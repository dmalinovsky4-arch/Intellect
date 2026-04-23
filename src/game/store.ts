import { create } from "zustand";

export type HotspotId = "chalk" | "reflection" | "newsstand";

export type Phase =
  | "briefing"
  | "exploring"
  | "ethicsChoice"
  | "epilogueExfil"
  | "epilogueWalkAway";

type Note = {
  tag: string;
  title: string;
  body: string;
};

type GameState = {
  phase: Phase;
  visited: Record<HotspotId, boolean>;
  activeNote: Note | null;
  nearby: HotspotId | null;
  setPhase: (phase: Phase) => void;
  setNearby: (id: HotspotId | null) => void;
  visit: (id: HotspotId) => void;
  showNote: (note: Note) => void;
  dismissNote: () => void;
};

export const useGame = create<GameState>((set, get) => ({
  phase: "briefing",
  visited: { chalk: false, reflection: false, newsstand: false },
  activeNote: null,
  nearby: null,
  setPhase: (phase) => set({ phase }),
  setNearby: (id) => set({ nearby: id }),
  visit: (id) => {
    const visited = { ...get().visited, [id]: true };
    set({ visited });
    if (id === "newsstand") set({ phase: "ethicsChoice" });
  },
  showNote: (note) => set({ activeNote: note }),
  dismissNote: () => set({ activeNote: null }),
}));

export const hotspotNotes: Record<HotspotId, Note> = {
  chalk: {
    tag: "Tradecraft",
    title: "Chalk signal",
    body: "A horizontal chalk mark on a lamppost was a common Cold War 'signal site' — it told the asset the meet was on, or that a dead drop had been filled. Signals were always separated from the actual drop so a compromised one didn't burn the other.",
  },
  reflection: {
    tag: "Tradecraft",
    title: "Surveillance detection",
    body: "Before any meet, case officers ran an SDR — a surveillance detection route. Checking reflections in shop windows let you spot a tail without turning your head. In Moscow, the KGB's 7th Directorate rotated watchers every few blocks to defeat this.",
  },
  newsstand: {
    tag: "Tradecraft",
    title: "The brush pass",
    body: "Two people walk past each other. For one second, their hands meet and microfilm changes hands. Done right, it's invisible from three meters away. The CIA trained case officers on this for weeks before posting them behind the Iron Curtain.",
  },
};
