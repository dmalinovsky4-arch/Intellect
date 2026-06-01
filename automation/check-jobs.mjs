#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_PATH = path.join(ROOT, "sources.json");
const STATE_PATH = path.join(ROOT, "state", "seen.json");
const OUTPUT_PATH = path.join(ROOT, "state", "last-run.json");

const MAX_SEEN = 5000;
const DESC_LIMIT = 280;

async function loadJson(p, fallback) {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8"));
  } catch {
    return fallback;
  }
}

async function saveJson(p, data) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2) + "\n");
}

function decodeXml(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXml(m[1]) : "";
}

function parseRss(xml) {
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRe) ?? [];
  for (const block of matches) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    if (link) items.push({ title, link, description, pubDate });
  }
  return items;
}

function matchesKeywords(text, must, blocked) {
  const t = text.toLowerCase();
  if (blocked?.some((k) => t.includes(k.toLowerCase()))) return false;
  if (!must?.length) return true;
  return must.some((k) => t.includes(k.toLowerCase()));
}

function normUrl(u) {
  try {
    const url = new URL(u);
    return (url.origin + url.pathname).toLowerCase().replace(/\/+$/, "");
  } catch {
    return String(u).trim().toLowerCase();
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[m]);
}

function renderHtml(jobs) {
  if (jobs.length === 0) {
    return `<div style="font-family:-apple-system,sans-serif">No new matches this run.</div>`;
  }
  const items = jobs
    .map(
      (j) => `
    <div style="margin:0 0 18px;padding:0 0 14px;border-bottom:1px solid #e5e7eb">
      <div><a href="${escapeHtml(j.url)}" style="font-weight:600;font-size:16px;color:#2563eb;text-decoration:none">${escapeHtml(j.title || "(untitled)")}</a></div>
      <div style="font-size:12px;color:#6b7280;margin:4px 0">${escapeHtml(j.source)}${j.pubDate ? " · " + escapeHtml(j.pubDate) : ""}</div>
      ${j.description ? `<div style="font-size:13px;color:#374151;line-height:1.5">${escapeHtml(j.description.slice(0, DESC_LIMIT))}${j.description.length > DESC_LIMIT ? "…" : ""}</div>` : ""}
    </div>`,
    )
    .join("");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:640px;margin:0 auto;padding:8px">
    <h2 style="font-size:18px;margin:0 0 16px">${jobs.length} new job match${jobs.length === 1 ? "" : "es"}</h2>
    ${items}
    <div style="font-size:11px;color:#9ca3af;margin-top:16px">Sent by your job tracker automation. Edit sources in <code>automation/sources.json</code>.</div>
  </div>`;
}

function renderText(jobs) {
  if (jobs.length === 0) return "No new matches this run.";
  return jobs
    .map(
      (j) =>
        `${j.title || "(untitled)"}\n${j.source}${j.pubDate ? " · " + j.pubDate : ""}\n${j.url}\n`,
    )
    .join("\n");
}

async function writeGithubOutput(values) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  const lines = [];
  for (const [key, value] of Object.entries(values)) {
    const v = String(value);
    if (v.includes("\n")) {
      const delim = `EOF_${crypto.randomBytes(8).toString("hex")}`;
      lines.push(`${key}<<${delim}`);
      lines.push(v);
      lines.push(delim);
    } else {
      lines.push(`${key}=${v}`);
    }
  }
  await fs.appendFile(out, lines.join("\n") + "\n");
}

async function fetchSource(src) {
  const res = await fetch(src.url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; JobTrackerBot/1.0; +https://github.com/dmalinovsky4-arch/Intellect)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const { sources = [] } = await loadJson(SOURCES_PATH, { sources: [] });
  const state = await loadJson(STATE_PATH, { seen: [] });
  const seen = new Set(state.seen || []);
  const beforeSize = seen.size;

  const newJobs = [];
  const sourceReports = [];

  for (const src of sources) {
    try {
      console.log(`Fetching: ${src.name}`);
      const body = await fetchSource(src);
      const items = parseRss(body);
      let kept = 0;
      for (const item of items) {
        const key = normUrl(item.link);
        if (!key || seen.has(key)) continue;
        const text = `${item.title} ${item.description}`;
        if (!matchesKeywords(text, src.keywords, src.blockedKeywords)) continue;
        seen.add(key);
        newJobs.push({
          source: src.name,
          title: item.title,
          url: item.link,
          description: item.description,
          pubDate: item.pubDate,
        });
        kept++;
      }
      sourceReports.push({ name: src.name, items: items.length, kept });
      console.log(`  ${items.length} item(s), ${kept} new match(es)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      sourceReports.push({ name: src.name, error: msg });
      console.warn(`  FAILED: ${msg}`);
    }
  }

  const trimmed = Array.from(seen).slice(-MAX_SEEN);
  await saveJson(STATE_PATH, {
    seen: trimmed,
    updatedAt: new Date().toISOString(),
  });
  await saveJson(OUTPUT_PATH, {
    generatedAt: new Date().toISOString(),
    newJobs,
    sources: sourceReports,
  });

  const subjectDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const subject =
    newJobs.length === 0
      ? `No new jobs · ${subjectDate}`
      : `${newJobs.length} new job${newJobs.length === 1 ? "" : "s"} · ${subjectDate}`;

  await writeGithubOutput({
    count: newJobs.length,
    subject,
    html: renderHtml(newJobs),
    text: renderText(newJobs),
  });

  console.log(
    `Done. ${newJobs.length} new job(s), seen set: ${beforeSize} → ${trimmed.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
