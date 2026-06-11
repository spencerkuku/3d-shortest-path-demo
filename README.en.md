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

## Algorithm Pseudocode

The following pseudocode follows the actual implementation in `src/algorithms/`. All three algorithms use a min-priority queue to retrieve the node with the lowest priority, and a `closed` set to prevent nodes from being expanded more than once.

### Shared Function: Neighbor Generation

The 6-direction mode permits movement along exactly one coordinate axis. The 26-direction mode also includes edge-diagonal and corner-diagonal movement. A candidate node must be inside the grid and must not be an obstacle.

```txt
FUNCTION GetNeighbors(current, gridSize, obstacles, movementMode)
    neighbors <- empty list

    FOR dx FROM -1 TO 1
        FOR dy FROM -1 TO 1
            FOR dz FROM -1 TO 1
                IF dx = 0 AND dy = 0 AND dz = 0
                    CONTINUE

                nonZeroAxes <- CountNonZero(dx, dy, dz)
                IF movementMode = 6 AND nonZeroAxes != 1
                    CONTINUE

                neighbor <- (current.x + dx,
                             current.y + dy,
                             current.z + dz)

                IF neighbor is inside grid AND neighbor is not an obstacle
                    ADD neighbor TO neighbors

    RETURN neighbors
```

Movement cost between nodes is calculated with 3D Euclidean distance:

```txt
Distance(a, b) <- SQRT(
    (a.x - b.x)^2 +
    (a.y - b.y)^2 +
    (a.z - b.z)^2
)
```

### Dijkstra Pseudocode

Dijkstra uses only the accumulated distance from the start node as its priority and does not use a heuristic.

```txt
FUNCTION Dijkstra(start, goal, grid)
    open <- empty Min-Priority Queue
    distance[start] <- 0
    parent <- empty map
    closed <- empty set
    visited <- empty list

    ENQUEUE open WITH (start, priority = 0)

    WHILE open is not empty
        IF task is cancelled
            BREAK

        current <- DEQUEUE node with minimum priority
        IF current is in closed
            CONTINUE

        ADD current TO closed
        ADD current TO visited

        IF current = goal
            RETURN (ReconstructPath(parent, start, goal), visited)

        FOR EACH neighbor IN GetNeighbors(current)
            IF neighbor is in closed
                CONTINUE

            newDistance <- distance[current] + Distance(current, neighbor)

            IF newDistance < distance[neighbor]
                distance[neighbor] <- newDistance
                parent[neighbor] <- current
                ENQUEUE open WITH (neighbor, priority = newDistance)

    RETURN (empty path, visited)
```

### A* Pseudocode

A* uses `f(n) = g(n) + h(n)` as the priority, where `h(n)` is the 3D Euclidean distance from a node to the goal.

```txt
FUNCTION AStar(start, goal, grid)
    open <- empty Min-Priority Queue
    gScore[start] <- 0
    parent <- empty map
    closed <- empty set
    visited <- empty list

    ENQUEUE open WITH (
        start,
        priority = Distance(start, goal)
    )

    WHILE open is not empty
        IF task is cancelled
            BREAK

        current <- DEQUEUE node with minimum priority
        IF current is in closed
            CONTINUE

        ADD current TO closed
        ADD current TO visited

        IF current = goal
            RETURN (ReconstructPath(parent, start, goal), visited)

        FOR EACH neighbor IN GetNeighbors(current)
            IF neighbor is in closed
                CONTINUE

            tentativeG <- gScore[current] + Distance(current, neighbor)

            IF tentativeG < gScore[neighbor]
                gScore[neighbor] <- tentativeG
                parent[neighbor] <- current
                heuristic <- Distance(neighbor, goal)
                ENQUEUE open WITH (
                    neighbor,
                    priority = tentativeG + heuristic
                )

    RETURN (empty path, visited)
```

### Theta* Pseudocode

Theta* retains the A* evaluation function but checks whether `parent[current]` has direct Line-of-Sight to `neighbor`. If the direct route is available and has a lower cost, Theta* skips `current` and assigns that ancestor as the neighbor's parent.

```txt
FUNCTION ThetaStar(start, goal, grid)
    open <- empty Min-Priority Queue
    gScore[start] <- 0
    parent[start] <- start
    closed <- empty set
    visited <- empty list

    ENQUEUE open WITH (
        start,
        priority = Distance(start, goal)
    )

    WHILE open is not empty
        IF task is cancelled
            BREAK

        current <- DEQUEUE node with minimum priority
        IF current is in closed
            CONTINUE

        ADD current TO closed
        ADD current TO visited

        IF current = goal
            RETURN (ReconstructPath(parent, start, goal), visited)

        FOR EACH neighbor IN GetNeighbors(current)
            IF neighbor is in closed
                CONTINUE

            candidateParent <- current
            candidateG <- gScore[current] + Distance(current, neighbor)
            currentParent <- parent[current]

            IF HasLineOfSight(currentParent, neighbor)
                shortcutG <- gScore[currentParent]
                             + Distance(currentParent, neighbor)

                IF shortcutG < candidateG
                    candidateG <- shortcutG
                    candidateParent <- currentParent

            IF candidateG < gScore[neighbor]
                gScore[neighbor] <- candidateG
                parent[neighbor] <- candidateParent
                heuristic <- Distance(neighbor, goal)
                ENQUEUE open WITH (
                    neighbor,
                    priority = candidateG + heuristic
                )

    RETURN (empty path, visited)
```

### Line-of-Sight Pseudocode

The implementation chooses the number of samples from the largest coordinate difference between the endpoints. Each sample is rounded to a voxel coordinate. Line-of-Sight fails if any sampled voxel outside the starting point is out of bounds or blocked by an obstacle.

```txt
FUNCTION HasLineOfSight(from, to, grid)
    dx <- ABS(to.x - from.x)
    dy <- ABS(to.y - from.y)
    dz <- ABS(to.z - from.z)
    steps <- MAX(dx, dy, dz)

    IF steps = 0
        RETURN true

    FOR i FROM 0 TO steps
        t <- i / steps
        point <- (
            ROUND(from.x + (to.x - from.x) * t),
            ROUND(from.y + (to.y - from.y) * t),
            ROUND(from.z + (to.z - from.z) * t)
        )

        IF point != from AND point is not walkable
            RETURN false

    RETURN true
```

### Path Reconstruction Pseudocode

```txt
FUNCTION ReconstructPath(parent, start, goal)
    path <- empty list
    current <- goal

    WHILE current exists
        ADD current TO path
        IF current = start
            RETURN REVERSE(path)
        current <- parent[current]

    RETURN empty path
```

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
