import { keyOf } from "../algorithms/grid";
import type { Point3D } from "../algorithms/types";

export interface DroneScenario {
  obstacles: Set<string>;
  buildings: Set<string>;
  noFlyZones: Set<string>;
  temporaryRestrictions: Set<string>;
  start: Point3D;
  goal: Point3D;
}

const addPoint = (target: Set<string>, point: Point3D, size: number) => {
  if (
    point.x >= 0 &&
    point.y >= 0 &&
    point.z >= 0 &&
    point.x < size &&
    point.y < size &&
    point.z < size
  ) {
    target.add(keyOf(point));
  }
};

const addBox = (
  target: Set<string>,
  size: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  height: number
) => {
  for (let x = Math.max(0, x0); x <= Math.min(size - 1, x1); x += 1) {
    for (let y = Math.max(0, y0); y <= Math.min(size - 1, y1); y += 1) {
      for (let z = 0; z <= Math.min(size - 1, height); z += 1) {
        target.add(`${x},${y},${z}`);
      }
    }
  }
};

const addCylinder = (
  target: Set<string>,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  minZ: number,
  maxZ: number
) => {
  const radiusSq = radius * radius;
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy > radiusSq) continue;
      for (let z = Math.max(0, minZ); z <= Math.min(size - 1, maxZ); z += 1) {
        target.add(`${x},${y},${z}`);
      }
    }
  }
};

const seededNoise = (x: number, y: number, z: number, seed: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return value - Math.floor(value);
};

export const createDroneScenario = (
  size: number,
  temporaryRestrictionDensity: number,
  customStart?: Point3D,
  customGoal?: Point3D
): DroneScenario => {
  const start: Point3D = customStart ?? { x: 0, y: 0, z: 0 };
  const goal: Point3D = customGoal ?? { x: size - 1, y: size - 1, z: size - 1 };

  const buildings = new Set<string>();
  const noFlyZones = new Set<string>();
  const temporaryRestrictions = new Set<string>();

  const s = (value: number) => Math.round(value * (size - 1));
  const h = (value: number) => Math.max(2, Math.round(value * (size - 1)));

  addBox(buildings, size, s(0.14), s(0.24), s(0.2), s(0.34), h(0.58));
  addBox(buildings, size, s(0.32), s(0.42), s(0.1), s(0.24), h(0.42));
  addBox(buildings, size, s(0.48), s(0.58), s(0.22), s(0.38), h(0.74));
  addBox(buildings, size, s(0.68), s(0.8), s(0.14), s(0.3), h(0.5));
  addBox(buildings, size, s(0.18), s(0.3), s(0.58), s(0.76), h(0.48));
  addBox(buildings, size, s(0.42), s(0.54), s(0.66), s(0.82), h(0.66));
  addBox(buildings, size, s(0.68), s(0.82), s(0.56), s(0.74), h(0.44));
  addBox(buildings, size, s(0.04), s(0.12), s(0.42), s(0.56), h(0.36));
  addBox(buildings, size, s(0.08), s(0.18), s(0.82), s(0.94), h(0.62));
  addBox(buildings, size, s(0.28), s(0.38), s(0.38), s(0.52), h(0.52));
  addBox(buildings, size, s(0.58), s(0.66), s(0.02), s(0.12), h(0.7));
  addBox(buildings, size, s(0.86), s(0.96), s(0.3), s(0.46), h(0.58));
  addBox(buildings, size, s(0.86), s(0.98), s(0.82), s(0.96), h(0.4));
  addBox(buildings, size, s(0.34), s(0.46), s(0.86), s(0.98), h(0.54));
  addBox(buildings, size, s(0.56), s(0.64), s(0.44), s(0.56), h(0.34));
  addBox(buildings, size, s(0.02), s(0.08), s(0.02), s(0.1), h(0.28));
  addBox(buildings, size, s(0.9), s(0.98), s(0.04), s(0.14), h(0.32));

  addCylinder(noFlyZones, size, s(0.56), s(0.5), Math.max(2, size * 0.13), 0, size - 1);
  addCylinder(noFlyZones, size, s(0.76), s(0.42), Math.max(2, size * 0.1), 0, size - 1);
  addCylinder(noFlyZones, size, s(0.22), s(0.46), Math.max(2, size * 0.08), 0, size - 1);
  addCylinder(noFlyZones, size, s(0.34), s(0.9), Math.max(2, size * 0.09), 0, size - 1);
  addCylinder(noFlyZones, size, s(0.88), s(0.68), Math.max(2, size * 0.08), 0, size - 1);
  addCylinder(noFlyZones, size, s(0.12), s(0.16), Math.max(2, size * 0.06), 0, size - 1);

  const density = Math.min(Math.max(temporaryRestrictionDensity, 0), 40) / 100;
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        if (seededNoise(x, y, z, size * 19) < density * 0.18) {
          addPoint(temporaryRestrictions, { x, y, z }, size);
        }
      }
    }
  }

  const obstacles = new Set([
    ...buildings,
    ...noFlyZones,
    ...temporaryRestrictions
  ]);
  for (const protectedPoint of [start, goal]) {
    const key = keyOf(protectedPoint);
    obstacles.delete(key);
    buildings.delete(key);
    noFlyZones.delete(key);
    temporaryRestrictions.delete(key);
  }

  return {
    obstacles,
    buildings,
    noFlyZones,
    temporaryRestrictions,
    start,
    goal
  };
};
