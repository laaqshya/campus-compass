import { LOCATIONS, type Location } from "@/data/locations";
import type { OccupancyData } from "@/stores/navigationStore";

export interface RoutePoint {
  x: number;
  y: number;
  id?: string;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Build adjacency: each location connects to nearest 3 neighbors
function buildGraph() {
  const adj: Record<string, { id: string; d: number }[]> = {};
  for (const a of LOCATIONS) {
    const neighbors = LOCATIONS.filter((b) => b.id !== a.id)
      .map((b) => ({ id: b.id, d: dist(a, b) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 4);
    adj[a.id] = neighbors;
  }
  return adj;
}

const ADJ = buildGraph();
const LOC_BY_ID: Record<string, Location> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);

export interface RouteResult {
  points: RoutePoint[];
  distance: number;
  eta: number;
}

export function crowdAwareDijkstra(
  startId: string,
  endId: string,
  occupancy: Record<string, OccupancyData>,
  startPos?: { x: number; y: number },
): RouteResult | null {
  const dists: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  for (const id of Object.keys(LOC_BY_ID)) {
    dists[id] = Infinity;
    prev[id] = null;
  }
  dists[startId] = 0;
  const visited = new Set<string>();

  while (visited.size < LOCATIONS.length) {
    let u: string | null = null;
    let min = Infinity;
    for (const id of Object.keys(dists)) {
      if (!visited.has(id) && dists[id] < min) {
        min = dists[id];
        u = id;
      }
    }
    if (u === null) break;
    if (u === endId) break;
    visited.add(u);
    for (const { id: v, d } of ADJ[u]) {
      const occ = occupancy[v]?.pct ?? 0;
      const weight = d * (1 + occ * 1.5);
      if (dists[u] + weight < dists[v]) {
        dists[v] = dists[u] + weight;
        prev[v] = u;
      }
    }
  }

  if (dists[endId] === Infinity) return null;

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }

  const points: RoutePoint[] = path.map((id) => ({
    x: LOC_BY_ID[id].x,
    y: LOC_BY_ID[id].y,
    id,
  }));

  // Optionally prepend current person position
  let totalDist = 0;
  const pts = startPos ? [{ x: startPos.x, y: startPos.y }, ...points] : points;
  for (let i = 1; i < pts.length; i++) {
    totalDist += dist(pts[i - 1], pts[i]);
  }

  // 1 unit = ~0.5m. Walking 1.4 m/s = 84 m/min
  const meters = totalDist * 0.5;
  const eta = Math.max(1, Math.round(meters / 84));

  return { points: pts, distance: Math.round(meters), eta };
}