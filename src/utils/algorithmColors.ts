import type { AlgorithmType } from "../algorithms/types";

export const algorithmColors: Record<
  AlgorithmType,
  { path: string; visited: string; recent: string }
> = {
  dijkstra: {
    path: "#2563eb",
    visited: "#93c5fd",
    recent: "#1d4ed8"
  },
  astar: {
    path: "#f59e0b",
    visited: "#fde68a",
    recent: "#d97706"
  },
  theta: {
    path: "#16a34a",
    visited: "#86efac",
    recent: "#15803d"
  }
};
