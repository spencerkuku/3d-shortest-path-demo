import { distance3D } from "../algorithms/grid";
import type { Point3D } from "../algorithms/types";

export const calculatePathLength = (path: Point3D[]): number => {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += distance3D(path[i - 1], path[i]);
  }
  return total;
};

export const estimateMemory = (
  gridSize: number,
  visitedCount: number,
  pathCount: number
): string => {
  const nodeBytes = 32;
  const gridBytes = gridSize * gridSize * gridSize * 2;
  const activeBytes = (visitedCount + pathCount) * nodeBytes;
  const totalKb = (gridBytes + activeBytes) / 1024;
  return totalKb >= 1024 ? `${(totalKb / 1024).toFixed(2)} MB` : `${totalKb.toFixed(1)} KB`;
};

export const algorithmLabel = (algorithm: string): string => {
  if (algorithm === "dijkstra") return "Dijkstra";
  if (algorithm === "astar") return "A*";
  return "Theta*";
};
