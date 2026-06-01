export const STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  salary: string;
  status: Status;
  appliedOn: string;
  nextAction: string;
  contact: string;
  description: string;
  notes: string;
  coverLetter: string;
  opener: string;
  fitScore: number | null;
  fitStrengths: string[];
  fitGaps: string[];
  fitSummary: string;
  createdAt: number;
  updatedAt: number;
};

export function newJob(partial: Partial<Job> = {}): Job {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "",
    company: "",
    location: "",
    url: "",
    source: "",
    salary: "",
    status: "Saved",
    appliedOn: "",
    nextAction: "",
    contact: "",
    description: "",
    notes: "",
    coverLetter: "",
    opener: "",
    fitScore: null,
    fitStrengths: [],
    fitGaps: [],
    fitSummary: "",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
