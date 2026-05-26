export type AlgorithmType = "dijkstra" | "astar" | "theta";
export type MovementMode = "6" | "26";
export type MapMode = "voxel" | "drone";

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface GridConfig {
  size: number;
  obstacleDensity: number;
}

export interface VoxelNode {
  point: Point3D;
  blocked: boolean;
}

export interface PathfindingRequest {
  id: string;
  type: "run" | "cancel";
  gridSize: number;
  obstacles: string[];
  start: Point3D;
  goal: Point3D;
  algorithm: AlgorithmType;
  movementMode: MovementMode;
}

export interface AlgorithmMetrics {
  algorithm: AlgorithmType;
  executionTimeMs: number;
  pathLength: number;
  visitedCount: number;
  memoryEstimate: string;
  success: boolean;
}

export interface PathfindingResult {
  id: string;
  algorithm: AlgorithmType;
  path: Point3D[];
  visitedNodes: Point3D[];
  executionTimeMs: number;
  pathLength: number;
  memoryEstimate: string;
  success: boolean;
  error?: string;
}

export interface ProgressMessage {
  id: string;
  type: "progress";
  algorithm: AlgorithmType;
  visitedBatch: Point3D[];
  visitedCount: number;
}

export type WorkerResponse =
  | ProgressMessage
  | ({ type: "result" } & PathfindingResult);

export interface SearchContext {
  gridSize: number;
  obstacles: Set<string>;
  start: Point3D;
  goal: Point3D;
  movementMode: MovementMode;
  algorithm: AlgorithmType;
  isCancelled: () => boolean;
  onProgress?: (batch: Point3D[], visitedCount: number) => void;
}

export interface SearchOutput {
  path: Point3D[];
  visitedNodes: Point3D[];
}
