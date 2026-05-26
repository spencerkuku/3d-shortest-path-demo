import { hasLineOfSight } from "./lineOfSight";
import { distance3D, getNeighbors, keyOf, reconstructPath, samePoint } from "./grid";
import { PriorityQueue } from "./priorityQueue";
import type { Point3D, SearchContext, SearchOutput } from "./types";

export const runThetaStar = (context: SearchContext): SearchOutput => {
  const open = new PriorityQueue<Point3D>();
  const startKey = keyOf(context.start);
  const goalKey = keyOf(context.goal);
  const gScore = new Map<string, number>([[startKey, 0]]);
  const parent = new Map<string, string>([[startKey, startKey]]);
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

      const currentParentKey = parent.get(currentKey) ?? currentKey;
      const currentParent = currentParentKey === currentKey ? current : parsePoint(currentParentKey);

      let candidateParentKey = currentKey;
      let candidateG = (gScore.get(currentKey) ?? Infinity) + distance3D(current, neighbor);

      if (
        hasLineOfSight(currentParent, neighbor, context.gridSize, context.obstacles)
      ) {
        const parentG =
          (gScore.get(currentParentKey) ?? Infinity) + distance3D(currentParent, neighbor);
        if (parentG < candidateG) {
          candidateG = parentG;
          candidateParentKey = currentParentKey;
        }
      }

      if (candidateG < (gScore.get(neighborKey) ?? Infinity)) {
        gScore.set(neighborKey, candidateG);
        parent.set(neighborKey, candidateParentKey);
        open.enqueue(neighbor, candidateG + distance3D(neighbor, context.goal));
      }
    }
  }

  if (batch.length) context.onProgress?.(batch, visitedNodes.length);
  return { path: [], visitedNodes };
};

const parsePoint = (key: string): Point3D => {
  const [x, y, z] = key.split(",").map(Number);
  return { x, y, z };
};
