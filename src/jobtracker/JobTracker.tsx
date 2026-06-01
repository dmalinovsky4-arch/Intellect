import { useMemo, useState } from "react";
import { useJobStore } from "./store";
import { STATUSES, type Status, type Job } from "./types";
import { RESUME } from "./resume";
import { JobDetail } from "./JobDetail";

function statusClass(s: Status): string {
  return `status status-${s.toLowerCase()}`;
}

export function JobTracker() {
  const jobs = useJobStore((s) => s.jobs);
  const selectedId = useJobStore((s) => s.selectedId);
  const select = useJobStore((s) => s.select);
  const addJob = useJobStore((s) => s.addJob);
  const importJobs = useJobStore((s) => s.importJobs);

  const [filter, setFilter] = useState<Status | "All">("All");
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filter !== "All" && j.status !== filter) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.notes.toLowerCase().includes(q)
      );
    });
  }, [jobs, filter, query]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { All: jobs.length };
    for (const s of STATUSES) out[s] = 0;
    for (const j of jobs) out[j.status]++;
    return out;
  }, [jobs]);

  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  function exportJSON() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Job[];
        if (Array.isArray(parsed)) importJobs(parsed);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="brand">
          <h1>Job Tracker</h1>
          <p className="subtle">{RESUME.name}</p>
        </header>

        <button className="btn-primary" onClick={() => addJob()}>
          + New Application
        </button>

        <div className="search">
          <input
            type="text"
            placeholder="Search title, company, notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <nav className="filters">
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              className={`filter ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s as Status | "All")}
            >
              <span>{s}</span>
              <span className="count">{counts[s] ?? 0}</span>
            </button>
          ))}
        </nav>

        <div className="job-list">
          {filtered.length === 0 ? (
            <div className="empty subtle">
              {jobs.length === 0
                ? "No applications yet. Click \"New Application\" to add one."
                : "No matches."}
            </div>
          ) : (
            filtered.map((j) => (
              <button
                key={j.id}
                className={`job-row ${selectedId === j.id ? "selected" : ""}`}
                onClick={() => select(j.id)}
              >
                <div className="job-row-top">
                  <span className="job-title">{j.title || "(untitled role)"}</span>
                  <span className={statusClass(j.status)}>{j.status}</span>
                </div>
                <div className="job-row-bottom subtle">
                  {j.company || "(no company)"} {j.location ? `· ${j.location}` : ""}
                </div>
              </button>
            ))
          )}
        </div>

        <footer className="sidebar-footer">
          <button className="btn-ghost" onClick={() => setShowSettings((v) => !v)}>
            {showSettings ? "Hide" : "Settings"}
          </button>
          <button className="btn-ghost" onClick={exportJSON}>
            Export
          </button>
          <label className="btn-ghost">
            Import
            <input type="file" accept="application/json" onChange={importJSON} hidden />
          </label>
        </footer>

        {showSettings && <SettingsPanel />}
      </aside>

      <main className="detail">
        {selected ? (
          <JobDetail job={selected} />
        ) : (
          <div className="placeholder">
            <h2>Pick an application — or start a new one.</h2>
            <p className="subtle">
              Everything saves to your browser. Use Export to back up. Use the cover-letter
              generator inside an application to draft a letter from your resume.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function SettingsPanel() {
  const key = useJobStore((s) => s.anthropicKey);
  const setKey = useJobStore((s) => s.setKey);
  const model = useJobStore((s) => s.model);
  const setModel = useJobStore((s) => s.setModel);
  const [show, setShow] = useState(false);

  return (
    <div className="settings">
      <h3>Cover letter AI</h3>
      <p className="subtle small">
        Optional. Paste an Anthropic API key to generate tailored letters with Claude. Stored only
        in your browser. Without a key, the generator uses an offline template.
      </p>
      <label>
        API key
        <div className="key-row">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-…"
          />
          <button className="btn-ghost" onClick={() => setShow((v) => !v)}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      <label>
        Model
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="claude-haiku-4-5-20251001">Haiku 4.5 (fast, cheap)</option>
          <option value="claude-sonnet-4-6">Sonnet 4.6 (balanced)</option>
          <option value="claude-opus-4-8">Opus 4.8 (best quality)</option>
        </select>
      </label>
    </div>
  );
}
