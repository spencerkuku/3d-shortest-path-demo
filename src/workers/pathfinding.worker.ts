import { runAStar } from "../algorithms/astar";
import { runDijkstra } from "../algorithms/dijkstra";
import { keyOf } from "../algorithms/grid";
import { runThetaStar } from "../algorithms/thetaStar";
import type { PathfindingRequest, SearchContext, WorkerResponse } from "../algorithms/types";
import { calculatePathLength, estimateMemory } from "../utils/metrics";

const cancelledTasks = new Set<string>();

self.onmessage = (event: MessageEvent<PathfindingRequest>) => {
  const request = event.data;

  if (request.type === "cancel") {
    cancelledTasks.add(request.id);
    return;
  }

  const startedAt = performance.now();

  try {
    const obstacles = new Set(request.obstacles);
    obstacles.delete(keyOf(request.start));
    obstacles.delete(keyOf(request.goal));

    const context: SearchContext = {
      gridSize: request.gridSize,
      obstacles,
      start: request.start,
      goal: request.goal,
      movementMode: request.movementMode,
      algorithm: request.algorithm,
      isCancelled: () => cancelledTasks.has(request.id),
      onProgress: (visitedBatch, visitedCount) => {
        const message: WorkerResponse = {
          id: request.id,
          type: "progress",
          algorithm: request.algorithm,
          visitedBatch,
          visitedCount
        };
        self.postMessage(message);
      }
    };

    const output =
      request.algorithm === "dijkstra"
        ? runDijkstra(context)
        : request.algorithm === "astar"
          ? runAStar(context)
          : runThetaStar(context);

    const executionTimeMs = performance.now() - startedAt;
    const pathLength = calculatePathLength(output.path);
    const message: WorkerResponse = {
      id: request.id,
      type: "result",
      algorithm: request.algorithm,
      path: output.path,
      visitedNodes: output.visitedNodes,
      executionTimeMs,
      pathLength,
      memoryEstimate: estimateMemory(
        request.gridSize,
        output.visitedNodes.length,
        output.path.length
      ),
      success: output.path.length > 0,
      error: cancelledTasks.has(request.id) ? "任務已取消。" : undefined
    };

    cancelledTasks.delete(request.id);
    self.postMessage(message);
  } catch (error) {
    const executionTimeMs = performance.now() - startedAt;
    const message: WorkerResponse = {
      id: request.id,
      type: "result",
      algorithm: request.algorithm,
      path: [],
      visitedNodes: [],
      executionTimeMs,
      pathLength: 0,
      memoryEstimate: estimateMemory(request.gridSize, 0, 0),
      success: false,
      error: error instanceof Error ? error.message : "未知的 Worker 錯誤。"
    };
    self.postMessage(message);
  }
};

export {};
