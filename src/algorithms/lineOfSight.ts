import { isWalkable, keyOf } from "./grid";
import type { Point3D } from "./types";

export const hasLineOfSight = (
  from: Point3D,
  to: Point3D,
  gridSize: number,
  obstacles: Set<string>
): boolean => {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const dz = Math.abs(to.z - from.z);
  const steps = Math.max(dx, dy, dz);

  if (steps === 0) return true;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = {
      x: Math.round(from.x + (to.x - from.x) * t),
      y: Math.round(from.y + (to.y - from.y) * t),
      z: Math.round(from.z + (to.z - from.z) * t)
    };
    if (keyOf(point) !== keyOf(from) && !isWalkable(point, gridSize, obstacles)) {
      return false;
    }
  }

  return true;
};
