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

type JobStore = {
  jobs: Job[];
  selectedId: string | null;
  anthropicKey: string;
  model: string;
  addJob: (partial?: Partial<Job>) => string;
  updateJob: (id: string, patch: Partial<Job>) => void;
  removeJob: (id: string) => void;
  select: (id: string | null) => void;
  setKey: (key: string) => void;
  setModel: (model: string) => void;
  importJobs: (jobs: Job[]) => void;
};

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
