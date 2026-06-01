import type { Job } from "./types";

const COLUMNS: { key: keyof Job | "fitStrengths" | "fitGaps"; label: string }[] = [
  { key: "title", label: "Role" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "appliedOn", label: "Applied On" },
  { key: "fitScore", label: "Fit Score" },
  { key: "fitSummary", label: "Fit Summary" },
  { key: "fitStrengths", label: "Strengths" },
  { key: "fitGaps", label: "Gaps" },
  { key: "nextAction", label: "Next Action" },
  { key: "contact", label: "Contact" },
  { key: "source", label: "Source" },
  { key: "salary", label: "Salary" },
  { key: "url", label: "URL" },
  { key: "notes", label: "Notes" },
];

function escape(v: unknown): string {
  if (v == null) return "";
  let s = Array.isArray(v) ? v.join(" | ") : String(v);
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function jobsToCsv(jobs: Job[]): string {
  const header = COLUMNS.map((c) => c.label).join(",");
  const rows = jobs.map((j) =>
    COLUMNS.map((c) => escape((j as unknown as Record<string, unknown>)[c.key as string])).join(","),
  );
  return [header, ...rows].join("\n");
}
