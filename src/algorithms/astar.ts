import { distance3D, getNeighbors, keyOf, reconstructPath, samePoint } from "./grid";
import { PriorityQueue } from "./priorityQueue";
import type { Point3D, SearchContext, SearchOutput } from "./types";

export const runAStar = (context: SearchContext): SearchOutput => {
  const open = new PriorityQueue<Point3D>();
  const startKey = keyOf(context.start);
  const goalKey = keyOf(context.goal);
  const gScore = new Map<string, number>([[startKey, 0]]);
  const parent = new Map<string, string>();
  const closed = new Set<string>();
  const visitedNodes: Point3D[] = [];
  let batch: Point3D[] = [];

  open.enqueue(context.start, distance3D(context.start, context.goal));

  while (open.size > 0) {
    if (context.isCancelled()) break;
    const current = open.dequeue();
    if (!current) break;
    const currentKey = keyOf(current);
    if (closed.has(currentKey)) continue;

    closed.add(currentKey);
    visitedNodes.push(current);
    batch.push(current);

    if (batch.length >= 250) {
      context.onProgress?.(batch, visitedNodes.length);
      batch = [];
    }

    if (samePoint(current, context.goal)) {
      if (batch.length) context.onProgress?.(batch, visitedNodes.length);
      return { path: reconstructPath(parent, startKey, goalKey), visitedNodes };
    }

    for (const neighbor of getNeighbors(
      current,
      context.gridSize,
      context.obstacles,
      context.movementMode
    )) {
      const neighborKey = keyOf(neighbor);
      if (closed.has(neighborKey)) continue;
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + distance3D(current, neighbor);
      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        gScore.set(neighborKey, tentativeG);
        parent.set(neighborKey, currentKey);
        open.enqueue(neighbor, tentativeG + distance3D(neighbor, context.goal));
      }
    }
  }

  if (batch.length) context.onProgress?.(batch, visitedNodes.length);
  return { path: [], visitedNodes };
};
