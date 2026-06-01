import { useState } from "react";
import { useJobStore } from "./store";
import { STATUSES, type Job } from "./types";
import {
  templateCoverLetter,
  generateCoverLetterWithClaude,
  analyzeFitWithClaude,
  heuristicFitScore,
} from "./coverLetter";

type Props = { job: Job };

export function JobDetail({ job }: Props) {
  const update = useJobStore((s) => s.updateJob);
  const remove = useJobStore((s) => s.removeJob);
  const apiKey = useJobStore((s) => s.anthropicKey);
  const model = useJobStore((s) => s.model);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  function patch<K extends keyof Job>(field: K, value: Job[K]) {
    update(job.id, { [field]: value } as Partial<Job>);
  }

  async function handleGenerate(mode: "template" | "ai") {
    setGenError(null);
    if (mode === "template") {
      patch("coverLetter", templateCoverLetter(job));
      return;
    }
    if (!apiKey) {
      setGenError("Add an Anthropic API key in Settings to use AI generation.");
      return;
    }
    try {
      setGenerating(true);
      const text = await generateCoverLetterWithClaude({ apiKey, model, job });
      patch("coverLetter", text);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function copyLetter() {
    if (!job.coverLetter) return;
    await navigator.clipboard.writeText(job.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function applyAnalysis(a: ReturnType<typeof heuristicFitScore>) {
    update(job.id, {
      fitScore: a.score,
      fitSummary: a.summary,
      fitStrengths: a.strengths,
      fitGaps: a.gaps,
      opener: a.opener || job.opener,
      nextAction: a.nextAction || job.nextAction,
    });
  }

  async function handleAnalyze(mode: "heuristic" | "ai") {
    setAnalyzeError(null);
    if (mode === "heuristic") {
      applyAnalysis(heuristicFitScore(job));
      return;
    }
    if (!apiKey) {
      setAnalyzeError("Add an Anthropic API key in Settings to use AI fit analysis.");
      return;
    }
    try {
      setAnalyzing(true);
      const result = await analyzeFitWithClaude({ apiKey, model, job });
      applyAnalysis(result);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  function openUrl() {
    if (!job.url) return;
    window.open(job.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="detail-inner">
      <div className="detail-header">
        <div className="title-block">
          <input
            className="title-input"
            value={job.title}
            placeholder="Role title"
            onChange={(e) => patch("title", e.target.value)}
          />
          <input
            className="company-input"
            value={job.company}
            placeholder="Company"
            onChange={(e) => patch("company", e.target.value)}
          />
        </div>
        <div className="detail-actions">
          <select
            className="status-select"
            value={job.status}
            onChange={(e) => patch("status", e.target.value as Job["status"])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm(`Delete application for ${job.title || "this job"}?`)) remove(job.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <section className="grid">
        <label>
          Location
          <input
            value={job.location}
            onChange={(e) => patch("location", e.target.value)}
            placeholder="City, State or Remote"
          />
        </label>
        <label>
          Source
          <input
            value={job.source}
            onChange={(e) => patch("source", e.target.value)}
            placeholder="LinkedIn, referral, etc."
          />
        </label>
        <label>
          Salary
          <input
            value={job.salary}
            onChange={(e) => patch("salary", e.target.value)}
            placeholder="$ or range"
          />
        </label>
        <label>
          Applied On
          <input
            type="date"
            value={job.appliedOn}
            onChange={(e) => patch("appliedOn", e.target.value)}
          />
        </label>
        <label>
          Next Action
          <input
            value={job.nextAction}
            onChange={(e) => patch("nextAction", e.target.value)}
            placeholder="Follow up Tuesday, prep for interview…"
          />
        </label>
        <label>
          Contact
          <input
            value={job.contact}
            onChange={(e) => patch("contact", e.target.value)}
            placeholder="Recruiter name + email"
          />
        </label>
        <label className="span-2">
          Posting URL
          <div className="url-row">
            <input
              value={job.url}
              onChange={(e) => patch("url", e.target.value)}
              placeholder="https://…"
            />
            <button className="btn-ghost" disabled={!job.url} onClick={openUrl}>
              Open
            </button>
          </div>
        </label>
      </section>

      <section>
        <label>
          Job Description (paste from the posting — used for the cover letter)
          <textarea
            value={job.description}
            onChange={(e) => patch("description", e.target.value)}
            placeholder="Paste the full job description here so the generator can tailor your letter."
            rows={6}
          />
        </label>
      </section>

      <section>
        <label>
          Notes
          <textarea
            value={job.notes}
            onChange={(e) => patch("notes", e.target.value)}
            placeholder="Interview prep, contacts, follow-ups…"
            rows={4}
          />
        </label>
      </section>

      <section className="fit">
        <div className="fit-header">
          <h3>Fit Analysis</h3>
          <div className="fit-actions">
            <button
              className="btn-secondary"
              onClick={() => handleAnalyze("heuristic")}
              disabled={analyzing}
            >
              Heuristic
            </button>
            <button
              className="btn-primary"
              onClick={() => handleAnalyze("ai")}
              disabled={analyzing}
              title={apiKey ? `Score with ${model}` : "Add API key in Settings"}
            >
              {analyzing ? "Analyzing…" : "Score with Claude"}
            </button>
          </div>
        </div>
        {analyzeError && <div className="error">{analyzeError}</div>}
        {job.fitScore != null ? (
          <div className="fit-body">
            <div className="fit-score-block">
              <div className={`fit-score-large ${job.fitScore >= 75 ? "fit-good" : job.fitScore >= 50 ? "fit-ok" : "fit-low"}`}>
                {job.fitScore}
              </div>
              <div className="fit-summary">{job.fitSummary}</div>
            </div>
            <div className="fit-grid">
              {job.fitStrengths.length > 0 && (
                <div>
                  <h4>Strengths</h4>
                  <ul>
                    {job.fitStrengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {job.fitGaps.length > 0 && (
                <div>
                  <h4>Gaps</h4>
                  <ul>
                    {job.fitGaps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {job.opener && (
              <div className="opener-block">
                <div className="opener-label">
                  <span>Application opener</span>
                  <button
                    className="btn-ghost"
                    onClick={() => navigator.clipboard.writeText(job.opener)}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  value={job.opener}
                  onChange={(e) => patch("opener", e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="subtle small">
            Run a fit analysis to get a score, strengths, gaps, and a short application opener for
            Easy Apply or recruiter DMs. Heuristic works offline; Claude needs a key.
          </p>
        )}
      </section>

      <section className="letter">
        <div className="letter-header">
          <h3>Cover Letter</h3>
          <div className="letter-actions">
            <button
              className="btn-secondary"
              onClick={() => handleGenerate("template")}
              disabled={generating}
            >
              Template
            </button>
            <button
              className="btn-primary"
              onClick={() => handleGenerate("ai")}
              disabled={generating}
              title={apiKey ? `Generate with ${model}` : "Add API key in Settings"}
            >
              {generating ? "Generating…" : "Generate with Claude"}
            </button>
            <button className="btn-ghost" onClick={copyLetter} disabled={!job.coverLetter}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        {genError && <div className="error">{genError}</div>}
        <textarea
          className="cover-letter-text"
          value={job.coverLetter}
          onChange={(e) => patch("coverLetter", e.target.value)}
          placeholder="Generate a draft, or write your own. Edits autosave."
          rows={20}
        />
      </section>
    </div>
  );
}
