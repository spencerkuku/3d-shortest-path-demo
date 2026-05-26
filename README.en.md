# 3D Shortest Path Demo

> 中文版說明: [README.md](./README.md)

`3d-shortest-path-demo` is a pure frontend interactive visualization project for an algorithms course final report. It models a 3D map as a voxel grid and compares Dijkstra, A*, and Theta* pathfinding algorithms.

The project does not require a backend or database. Pathfinding runs inside a Web Worker so the main UI can stay responsive while rendering the 3D scene.

## Overview

The goal of this project is to extend shortest path algorithms from common 2D examples into a 3D voxel environment. Users can observe how each algorithm explores nodes, handles obstacles, and produces paths under different movement modes and map scenarios.

## Key Features

- 3D Voxel Grid visualization
- Dijkstra, A*, and Theta* comparison
- Web Worker based pathfinding
- Voxel Lab random obstacle scenario
- Drone City UAV route-planning scenario
- Buildings, no-fly zones, and temporary restrictions
- 6-direction and 26-direction movement modes
- Custom start and goal coordinates
- Per-algorithm visualization layers
- Metrics table for execution time, path length, visited nodes, memory estimate, and success status
- Deployable to Cloudflare Pages

## Drone City Scenario

Drone City models a practical UAV route-planning task while still using the same 3D Voxel Grid representation.

In this scenario:

- `x` and `y` represent the horizontal ground plane
- `z` represents altitude
- Buildings are solid vertical volumes
- No-fly zones are restricted airspace columns
- Temporary restrictions simulate weather, events, or operational constraints

The same Dijkstra, A*, and Theta* implementations can be compared on this applied map.

## Algorithms

### Dijkstra

Dijkstra is used as the baseline shortest-path algorithm. It does not use a heuristic and expands nodes based only on known cost. It guarantees the shortest path, but usually visits more nodes in large 3D grids.

### A*

A* uses:

```txt
f(n) = g(n) + h(n)
```

The heuristic is 3D Euclidean distance, which guides the search toward the goal.

### Theta*

Theta* extends A* with Line-of-Sight checks. If a parent node can directly see a neighbor, Theta* attempts a shortcut, often producing smoother paths in open spaces.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Three.js / `@react-three/fiber`
- Web Worker

## Project Structure

```txt
src/
|-- app/
|-- components/
|   |-- ControlPanel.tsx
|   |-- MetricsPanel.tsx
|   |-- ResultTable.tsx
|   |-- ScenarioSummary.tsx
|   `-- VoxelScene.tsx
|-- algorithms/
|   |-- types.ts
|   |-- priorityQueue.ts
|   |-- grid.ts
|   |-- dijkstra.ts
|   |-- astar.ts
|   |-- thetaStar.ts
|   `-- lineOfSight.ts
|-- workers/
|   `-- pathfinding.worker.ts
|-- hooks/
|   `-- usePathfindingWorker.ts
`-- utils/
    |-- droneScenario.ts
    `-- metrics.ts
```

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output is generated in `dist/`.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

No backend, database, or server runtime is required.
