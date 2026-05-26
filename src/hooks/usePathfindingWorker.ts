import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AlgorithmType,
  MovementMode,
  PathfindingResult,
  Point3D,
  WorkerResponse
} from "../algorithms/types";

interface RunOptions {
  gridSize: number;
  obstacles: Set<string>;
  start: Point3D;
  goal: Point3D;
  algorithm: AlgorithmType;
  movementMode: MovementMode;
}

interface WorkerState {
  running: boolean;
  progressCount: number;
  liveVisited: Point3D[];
  result: PathfindingResult | null;
  error: string | null;
}

const initialState: WorkerState = {
  running: false,
  progressCount: 0,
  liveVisited: [],
  result: null,
  error: null
};

export const usePathfindingWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const taskIdRef = useRef<string>("");
  const [state, setState] = useState<WorkerState>(initialState);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ id: taskIdRef.current, type: "cancel" });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState((current) => ({ ...current, running: false }));
  }, []);

  const run = useCallback(
    (options: RunOptions) => {
      cancel();
      const id = crypto.randomUUID();
      taskIdRef.current = id;
      const worker = new Worker(
        new URL("../workers/pathfinding.worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;
      setState({ ...initialState, running: true });

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        if (message.id !== taskIdRef.current) return;

        if (message.type === "progress") {
          setState((current) => ({
            ...current,
            progressCount: message.visitedCount,
            liveVisited: [...current.liveVisited, ...message.visitedBatch].slice(-3500)
          }));
          return;
        }

        setState({
          running: false,
          progressCount: message.visitedNodes.length,
          liveVisited: message.visitedNodes.slice(-3500),
          result: message,
          error: message.error ?? null
        });
        worker.terminate();
        workerRef.current = null;
      };

      worker.onerror = (error) => {
        setState((current) => ({
          ...current,
          running: false,
          error: error.message
        }));
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage({
        id,
        type: "run",
        gridSize: options.gridSize,
        obstacles: Array.from(options.obstacles),
        start: options.start,
        goal: options.goal,
        algorithm: options.algorithm,
        movementMode: options.movementMode
      });
    },
    [cancel]
  );

  useEffect(() => cancel, [cancel]);

  return { ...state, run, cancel };
};
