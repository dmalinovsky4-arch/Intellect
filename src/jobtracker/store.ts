import { create } from "zustand";
import { type Job, newJob } from "./types";

const JOBS_KEY = "jobtracker.jobs.v1";
const KEY_KEY = "jobtracker.anthropicKey.v1";
const MODEL_KEY = "jobtracker.model.v1";

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Job[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

type BulkAddResult = { added: number; duplicates: number };

type JobStore = {
  jobs: Job[];
  selectedId: string | null;
  anthropicKey: string;
  model: string;
  addJob: (partial?: Partial<Job>) => string;
  bulkAddUrls: (urls: string[]) => BulkAddResult;
  updateJob: (id: string, patch: Partial<Job>) => void;
  removeJob: (id: string) => void;
  select: (id: string | null) => void;
  setKey: (key: string) => void;
  setModel: (model: string) => void;
  importJobs: (jobs: Job[]) => void;
};

function normalizeUrl(u: string): string {
  return u.trim().replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase();
}

function guessFromUrl(url: string): Partial<Job> {
  const out: Partial<Job> = { url };
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("linkedin")) out.source = "LinkedIn";
    else if (host.includes("indeed")) out.source = "Indeed";
    else if (host.includes("glassdoor")) out.source = "Glassdoor";
    else if (host.includes("greenhouse") || host.includes("lever") || host.includes("workday"))
      out.source = "Company site";
    else out.source = host;
    const slugMatch = u.pathname.match(/\/(?:jobs|job|view|posting|careers|p)\/([^/?#]+)/i);
    if (slugMatch) {
      const slug = decodeURIComponent(slugMatch[1])
        .replace(/[-_]+/g, " ")
        .replace(/\b\d{4,}\b/g, "")
        .trim();
      if (slug && slug.length < 80) out.title = slug.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    // ignore parse errors
  }
  return out;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: loadJobs(),
  selectedId: null,
  anthropicKey: localStorage.getItem(KEY_KEY) ?? "",
  model: localStorage.getItem(MODEL_KEY) ?? "claude-haiku-4-5-20251001",
  addJob: (partial = {}) => {
    const job = newJob(partial);
    const jobs = [job, ...get().jobs];
    saveJobs(jobs);
    set({ jobs, selectedId: job.id });
    return job.id;
  },
  bulkAddUrls: (urls) => {
    const existing = new Set(get().jobs.map((j) => normalizeUrl(j.url)).filter(Boolean));
    const seenThisBatch = new Set<string>();
    const created: Job[] = [];
    let duplicates = 0;
    for (const raw of urls) {
      const url = raw.trim();
      if (!url) continue;
      const key = normalizeUrl(url);
      if (!key || existing.has(key) || seenThisBatch.has(key)) {
        duplicates++;
        continue;
      }
      seenThisBatch.add(key);
      created.push(newJob(guessFromUrl(url)));
    }
    if (created.length === 0) return { added: 0, duplicates };
    const jobs = [...created, ...get().jobs];
    saveJobs(jobs);
    set({ jobs });
    return { added: created.length, duplicates };
  },
  updateJob: (id, patch) => {
    const jobs = get().jobs.map((j) =>
      j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j,
    );
    saveJobs(jobs);
    set({ jobs });
  },
  removeJob: (id) => {
    const jobs = get().jobs.filter((j) => j.id !== id);
    saveJobs(jobs);
    set({
      jobs,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },
  select: (id) => set({ selectedId: id }),
  setKey: (key) => {
    localStorage.setItem(KEY_KEY, key);
    set({ anthropicKey: key });
  },
  setModel: (model) => {
    localStorage.setItem(MODEL_KEY, model);
    set({ model });
  },
  importJobs: (jobs) => {
    saveJobs(jobs);
    set({ jobs });
  },
}));
