import { create } from "zustand";
import { LOCATIONS, type Location } from "@/data/locations";

export interface OccupancyData {
  pct: number;
  trend: "up" | "stable" | "down";
  queue_minutes: number;
}

interface NavState {
  personX: number;
  personY: number;
  heading: number;
  from: Location | null;
  to: Location | null;
  route: { x: number; y: number; id?: string }[];
  eta: number;
  distance: number;
  occupancy: Record<string, OccupancyData>;
  visibleCategories: Set<string>;
  scale: number;
  tx: number;
  ty: number;
  rerouting: boolean;

  setPerson: (x: number, y: number, heading?: number) => void;
  setFrom: (loc: Location | null) => void;
  setTo: (loc: Location | null) => void;
  setRoute: (route: { x: number; y: number; id?: string }[], eta: number, distance: number) => void;
  endNavigation: () => void;
  toggleCategory: (cat: string) => void;
  resetCategories: () => void;
  setTransform: (scale: number, tx: number, ty: number) => void;
  updateOccupancy: () => void;
  setRerouting: (b: boolean) => void;
}

function genOccupancy(): Record<string, OccupancyData> {
  const out: Record<string, OccupancyData> = {};
  for (const loc of LOCATIONS) {
    const base =
      loc.category === "food"
        ? 0.6 + Math.random() * 0.35
        : loc.category === "academic"
          ? 0.4 + Math.random() * 0.5
          : loc.category === "hostel"
            ? 0.3 + Math.random() * 0.4
            : Math.random() * 0.7;
    const trends: Array<"up" | "stable" | "down"> = ["up", "stable", "down"];
    out[loc.id] = {
      pct: Math.min(0.99, Math.max(0.05, base)),
      trend: trends[Math.floor(Math.random() * 3)],
      queue_minutes: Math.round(base * 15),
    };
  }
  return out;
}

export const useNavigationStore = create<NavState>((set, get) => ({
  personX: 500,
  personY: 680,
  heading: -90,
  from: null,
  to: null,
  route: [],
  eta: 0,
  distance: 0,
  occupancy: genOccupancy(),
  visibleCategories: new Set([
    "academic",
    "hostel",
    "food",
    "sports",
    "admin",
    "transport",
    "facility",
  ]),
  scale: 1,
  tx: 0,
  ty: 0,
  rerouting: false,

  setPerson: (x, y, heading) =>
    set((s) => ({ personX: x, personY: y, heading: heading ?? s.heading })),
  setFrom: (loc) => set({ from: loc }),
  setTo: (loc) => set({ to: loc }),
  setRoute: (route, eta, distance) => set({ route, eta, distance }),
  endNavigation: () => set({ from: null, to: null, route: [], eta: 0, distance: 0 }),
  toggleCategory: (cat) =>
    set((s) => {
      const next = new Set(s.visibleCategories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { visibleCategories: next };
    }),
  resetCategories: () =>
    set({
      visibleCategories: new Set([
        "academic",
        "hostel",
        "food",
        "sports",
        "admin",
        "transport",
        "facility",
      ]),
    }),
  setTransform: (scale, tx, ty) => set({ scale, tx, ty }),
  updateOccupancy: () => {
    const cur = get().occupancy;
    const next: Record<string, OccupancyData> = {};
    for (const [id, d] of Object.entries(cur)) {
      const delta = (Math.random() - 0.5) * 0.08;
      const pct = Math.min(0.99, Math.max(0.05, d.pct + delta));
      next[id] = {
        pct,
        trend: delta > 0.02 ? "up" : delta < -0.02 ? "down" : "stable",
        queue_minutes: Math.round(pct * 15),
      };
    }
    set({ occupancy: next });
  },
  setRerouting: (b) => set({ rerouting: b }),
}));

export function statusFromPct(pct: number): {
  label: string;
  color: string;
  glow: string;
  critical: boolean;
} {
  if (pct < 0.4)
    return { label: "Low", color: "#10b981", glow: "#10b981", critical: false };
  if (pct < 0.7)
    return { label: "Moderate", color: "#f59e0b", glow: "#f59e0b", critical: false };
  if (pct < 0.9)
    return { label: "High", color: "#ef4444", glow: "#ef4444", critical: false };
  return { label: "Critical", color: "#dc2626", glow: "#dc2626", critical: true };
}