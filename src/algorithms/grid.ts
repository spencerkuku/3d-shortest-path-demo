import type { MovementMode, Point3D } from "./types";

export const keyOf = (point: Point3D): string => `${point.x},${point.y},${point.z}`;

export const parseKey = (key: string): Point3D => {
  const [x, y, z] = key.split(",").map(Number);
  return { x, y, z };
};

export const samePoint = (a: Point3D, b: Point3D): boolean =>
  a.x === b.x && a.y === b.y && a.z === b.z;

export const isInsideGrid = (point: Point3D, size: number): boolean =>
  point.x >= 0 &&
  point.y >= 0 &&
  point.z >= 0 &&
  point.x < size &&
  point.y < size &&
  point.z < size;

export const distance3D = (a: Point3D, b: Point3D): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const isWalkable = (
  point: Point3D,
  gridSize: number,
  obstacles: Set<string>
): boolean => isInsideGrid(point, gridSize) && !obstacles.has(keyOf(point));

export const getNeighbors = (
  point: Point3D,
  gridSize: number,
  obstacles: Set<string>,
  movementMode: MovementMode
): Point3D[] => {
  const neighbors: Point3D[] = [];

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const nonZeroAxes = Number(dx !== 0) + Number(dy !== 0) + Number(dz !== 0);
        if (movementMode === "6" && nonZeroAxes !== 1) continue;

        const neighbor = {
          x: point.x + dx,
          y: point.y + dy,
          z: point.z + dz
        };
        if (isWalkable(neighbor, gridSize, obstacles)) {
          neighbors.push(neighbor);
        }
      }
    }
  }

  return neighbors;
};

export const reconstructPath = (
  parent: Map<string, string>,
  startKey: string,
  goalKey: string
): Point3D[] => {
  const path: Point3D[] = [];
  let current: string | undefined = goalKey;

  while (current) {
    path.push(parseKey(current));
    if (current === startKey) break;
    current = parent.get(current);
  }

  return path[path.length - 1] && keyOf(path[path.length - 1]) === startKey
    ? path.reverse()
    : [];
};

export const generateRandomObstacles = (
  size: number,
  density: number,
  start: Point3D,
  goal: Point3D
): Set<string> => {
  const obstacles = new Set<string>();
  const chance = Math.min(Math.max(density, 0), 40) / 100;
  const startKey = keyOf(start);
  const goalKey = keyOf(goal);

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        const key = `${x},${y},${z}`;
        if (key === startKey || key === goalKey) continue;
        if (Math.random() < chance) obstacles.add(key);
      }
    }
  }

  return obstacles;
};

export const clampPoint = (point: Point3D, size: number): Point3D => ({
  x: Math.min(Math.max(Math.round(point.x), 0), size - 1),
  y: Math.min(Math.max(Math.round(point.y), 0), size - 1),
  z: Math.min(Math.max(Math.round(point.z), 0), size - 1)
});
