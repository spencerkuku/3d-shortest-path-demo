import { useCallback, useEffect, useMemo, useState } from "react";
import { clampPoint, generateRandomObstacles, keyOf } from "../algorithms/grid";
import type { AlgorithmType, MapMode, MovementMode, PathfindingResult, Point3D } from "../algorithms/types";
import { AlgorithmNotes } from "../components/AlgorithmNotes";
import { ControlPanel } from "../components/ControlPanel";
import { MetricsPanel } from "../components/MetricsPanel";
import { ResultTable } from "../components/ResultTable";
import { ScenarioSummary } from "../components/ScenarioSummary";
import { VoxelScene } from "../components/VoxelScene";
import { usePathfindingWorker } from "../hooks/usePathfindingWorker";
import { createDroneScenario } from "../utils/droneScenario";
import { ChevronDown, ChevronUp } from "lucide-react";

const allAlgorithms: AlgorithmType[] = ["dijkstra", "astar", "theta"];
type ObstacleLayers = {
  buildings: Set<string>;
  noFlyZones: Set<string>;
  temporaryRestrictions: Set<string>;
};

export const App = () => {
  const [gridSize, setGridSize] = useState(30);
  const [obstacleDensity, setObstacleDensity] = useState(18);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>("astar");
  const [movementMode, setMovementMode] = useState<MovementMode>("26");
  const [mapMode, setMapMode] = useState<MapMode>("voxel");
  const [start, setStart] = useState<Point3D>({ x: 0, y: 0, z: 0 });
  const [goal, setGoal] = useState<Point3D>({ x: 29, y: 29, z: 29 });
  const [obstacles, setObstacles] = useState<Set<string>>(() =>
    generateRandomObstacles(30, 18, { x: 0, y: 0, z: 0 }, { x: 29, y: 29, z: 29 })
  );
  const [obstacleLayers, setObstacleLayers] = useState<ObstacleLayers | null>(null);
  const [results, setResults] = useState<Partial<Record<AlgorithmType, PathfindingResult>>>({});
  const [displayResult, setDisplayResult] = useState<PathfindingResult | null>(null);
  const [showVisited, setShowVisited] = useState(true);
  const [showRestrictions, setShowRestrictions] = useState(true);
  const [visibleAlgorithms, setVisibleAlgorithms] = useState<Record<AlgorithmType, boolean>>({
    dijkstra: true,
    astar: true,
    theta: true
  });
  const [resetCameraSignal, setResetCameraSignal] = useState(0);
  const [resultsOpen, setResultsOpen] = useState(false);

  const dijkstraWorker = usePathfindingWorker();
  const astarWorker = usePathfindingWorker();
  const thetaWorker = usePathfindingWorker();

  const workers = useMemo(
    () => ({
      dijkstra: dijkstraWorker,
      astar: astarWorker,
      theta: thetaWorker
    }),
    [astarWorker, dijkstraWorker, thetaWorker]
  );

  const runningAlgorithms = useMemo(
    () => allAlgorithms.filter((item) => workers[item].running),
    [workers]
  );
  const running = runningAlgorithms.length > 0;

  const cancelAll = useCallback(() => {
    dijkstraWorker.cancel();
    astarWorker.cancel();
    thetaWorker.cancel();
  }, [astarWorker, dijkstraWorker, thetaWorker]);

  const applyDroneScenario = useCallback(
    (size: number, density: number, nextStart?: Point3D, nextGoal?: Point3D) => {
      const scenario = createDroneScenario(size, density, nextStart, nextGoal);
      setStart(scenario.start);
      setGoal(scenario.goal);
      setObstacles(scenario.obstacles);
      setObstacleLayers({
        buildings: scenario.buildings,
        noFlyZones: scenario.noFlyZones,
        temporaryRestrictions: scenario.temporaryRestrictions
      });
      setResults({});
      setDisplayResult(null);
      setResetCameraSignal((value) => value + 1);
    },
    []
  );

  const cleanObstacles = useCallback(
    (nextStart = start, nextGoal = goal) => {
      setObstacles((current) => {
        const next = new Set(current);
        next.delete(keyOf(nextStart));
        next.delete(keyOf(nextGoal));
        return next;
      });
      setObstacleLayers((current) => {
        if (!current) return current;
        const next = {
          buildings: new Set(current.buildings),
          noFlyZones: new Set(current.noFlyZones),
          temporaryRestrictions: new Set(current.temporaryRestrictions)
        };
        for (const layer of Object.values(next)) {
          layer.delete(keyOf(nextStart));
          layer.delete(keyOf(nextGoal));
        }
        return next;
      });
    },
    [goal, start]
  );

  const generate = useCallback(() => {
    if (mapMode === "drone") {
      applyDroneScenario(gridSize, obstacleDensity, start, goal);
      return;
    }
    setObstacles(generateRandomObstacles(gridSize, obstacleDensity, start, goal));
    setObstacleLayers(null);
    setResults({});
    setDisplayResult(null);
  }, [applyDroneScenario, goal, gridSize, mapMode, obstacleDensity, start]);

  const prepareRun = useCallback(() => {
    const sanitizedStart = clampPoint(start, gridSize);
    const sanitizedGoal = clampPoint(goal, gridSize);
    const runnableObstacles = new Set(obstacles);
    runnableObstacles.delete(keyOf(sanitizedStart));
    runnableObstacles.delete(keyOf(sanitizedGoal));
    setStart(sanitizedStart);
    setGoal(sanitizedGoal);
    cleanObstacles(sanitizedStart, sanitizedGoal);
    setObstacles(runnableObstacles);
    setDisplayResult(null);
    return { sanitizedStart, sanitizedGoal, runnableObstacles };
  }, [cleanObstacles, goal, gridSize, obstacles, start]);

  const runAlgorithm = useCallback(
    (targetAlgorithm: AlgorithmType) => {
      workers[targetAlgorithm].cancel();
      const { sanitizedStart, sanitizedGoal, runnableObstacles } = prepareRun();
      setResults((current) => {
        const next = { ...current };
        delete next[targetAlgorithm];
        return next;
      });
      workers[targetAlgorithm].run({
        gridSize,
        obstacles: runnableObstacles,
        start: sanitizedStart,
        goal: sanitizedGoal,
        algorithm: targetAlgorithm,
        movementMode
      });
    },
    [gridSize, movementMode, prepareRun, workers]
  );

  const handleRun = useCallback(() => {
    cancelAll();
    runAlgorithm(algorithm);
  }, [algorithm, cancelAll, runAlgorithm]);

  const handleRunAll = useCallback(() => {
    cancelAll();
    setResults({});
    setDisplayResult(null);
    const { sanitizedStart, sanitizedGoal, runnableObstacles } = prepareRun();
    allAlgorithms.forEach((item) => {
      workers[item].run({
        gridSize,
        obstacles: runnableObstacles,
        start: sanitizedStart,
        goal: sanitizedGoal,
        algorithm: item,
        movementMode
      });
    });
  }, [cancelAll, gridSize, movementMode, prepareRun, workers]);

  useEffect(() => {
    const result = dijkstraWorker.result;
    if (!result) return;
    setResults((current) => ({
      ...current,
      [result.algorithm]: result
    }));
    setDisplayResult(result);
  }, [dijkstraWorker.result]);

  useEffect(() => {
    const result = astarWorker.result;
    if (!result) return;
    setResults((current) => ({
      ...current,
      [result.algorithm]: result
    }));
    setDisplayResult(result);
  }, [astarWorker.result]);

  useEffect(() => {
    const result = thetaWorker.result;
    if (!result) return;
    setResults((current) => ({
      ...current,
      [result.algorithm]: result
    }));
    setDisplayResult(result);
  }, [thetaWorker.result]);

  const handleGridSizeChange = (size: number) => {
    cancelAll();
    const nextStart = { x: 0, y: 0, z: 0 };
    const nextGoal = { x: size - 1, y: size - 1, z: size - 1 };
    setGridSize(size);
    if (mapMode === "drone") {
      applyDroneScenario(size, obstacleDensity, nextStart, nextGoal);
      return;
    }

    setStart(nextStart);
    setGoal(nextGoal);
    setObstacles(generateRandomObstacles(size, obstacleDensity, nextStart, nextGoal));
    setObstacleLayers(null);
    setResults({});
    setDisplayResult(null);
    setResetCameraSignal((value) => value + 1);
  };

  const handleMapModeChange = (mode: MapMode) => {
    cancelAll();
    setMapMode(mode);
    if (mode === "drone") {
      applyDroneScenario(gridSize, obstacleDensity);
      return;
    }

    const nextStart = { x: 0, y: 0, z: 0 };
    const nextGoal = { x: gridSize - 1, y: gridSize - 1, z: gridSize - 1 };
    setStart(nextStart);
    setGoal(nextGoal);
    setObstacles(generateRandomObstacles(gridSize, obstacleDensity, nextStart, nextGoal));
    setObstacleLayers(null);
    setResults({});
    setDisplayResult(null);
    setResetCameraSignal((value) => value + 1);
  };

  const handlePointChange = (kind: "start" | "goal", axis: keyof Point3D, value: number) => {
    const setter = kind === "start" ? setStart : setGoal;
    setter((current) => {
      const next = clampPoint({ ...current, [axis]: value }, gridSize);
      setObstacles((existing) => {
        const updated = new Set(existing);
        updated.delete(keyOf(next));
        return updated;
      });
      setObstacleLayers((existing) => {
        if (!existing) return existing;
        const updated = {
          buildings: new Set(existing.buildings),
          noFlyZones: new Set(existing.noFlyZones),
          temporaryRestrictions: new Set(existing.temporaryRestrictions)
        };
        for (const layer of Object.values(updated)) {
          layer.delete(keyOf(next));
        }
        return updated;
      });
      return next;
    });
    setDisplayResult(null);
    setResults({});
  };

  const handleClear = () => {
    cancelAll();
    setObstacles(new Set());
    setObstacleLayers(null);
    setDisplayResult(null);
    setResults({});
  };

  const algorithmVisuals = useMemo(
    () =>
      allAlgorithms.reduce(
        (acc, item) => {
          const worker = workers[item];
          const result = results[item];
          acc[item] = {
            visitedNodes: worker.running
              ? worker.liveVisited
              : result?.visitedNodes.slice(-3500) ?? [],
            path: worker.running ? [] : result?.path ?? [],
            running: worker.running
          };
          return acc;
        },
        {} as Record<
          AlgorithmType,
          { visitedNodes: Point3D[]; path: Point3D[]; running: boolean }
        >
      ),
    [results, workers]
  );

  const progressCount = running
    ? allAlgorithms.reduce((total, item) => total + workers[item].progressCount, 0)
    : displayResult?.visitedNodes.length ?? 0;
  const selectedResult = results[algorithm] ?? null;
  const selectedProgressCount = workers[algorithm].running
    ? workers[algorithm].progressCount
    : selectedResult?.visitedNodes.length ?? 0;

  return (
    <div className="h-screen overflow-hidden bg-[#eef1f4] text-ink">
      <div className="grid h-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="relative min-h-0 min-w-0">
          <VoxelScene
            gridSize={gridSize}
            obstacles={obstacles}
            start={start}
            goal={goal}
            algorithmVisuals={algorithmVisuals}
            visibleAlgorithms={visibleAlgorithms}
            showVisited={showVisited}
            showRestrictions={showRestrictions}
            resetCameraSignal={resetCameraSignal}
            runningAlgorithms={runningAlgorithms}
            algorithm={algorithm}
            visitedCount={progressCount}
            scenarioLabel={mapMode === "drone" ? "無人機城市" : "體素實驗"}
            obstacleLayers={obstacleLayers ?? undefined}
          />
          <div
            className={`absolute inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur transition-[height] duration-200 ${
              resultsOpen ? "h-[42vh]" : "h-14"
            }`}
          >
            <button
              className="flex h-14 w-full items-center justify-between gap-3 px-4 text-left hover:bg-slate-50"
              onClick={() => setResultsOpen((current) => !current)}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">結果與分析</p>
                <p className="truncate text-xs text-slate-500">
                  {running
                    ? `執行中：${runningAlgorithms.map((item) => item.toUpperCase()).join(", ")}`
                    : displayResult
                      ? `${displayResult.algorithm.toUpperCase()} - ${displayResult.success ? "找到路徑" : "沒有路徑"}`
                      : "展開查看指標、比較表與說明"}
                </p>
              </div>
              <span className="button-secondary h-8 px-2">
                {resultsOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                {resultsOpen ? "收合" : "展開"}
              </span>
            </button>
            {resultsOpen ? (
              <div className="h-[calc(42vh-3.5rem)] overflow-auto">
                <ScenarioSummary
                  mapMode={mapMode}
                  obstacleCount={obstacles.size}
                  buildingCount={obstacleLayers?.buildings.size ?? 0}
                  noFlyCount={obstacleLayers?.noFlyZones.size ?? 0}
                  temporaryRestrictionCount={obstacleLayers?.temporaryRestrictions.size ?? 0}
                />
                <MetricsPanel
                  result={selectedResult}
                  running={workers[algorithm].running}
                  progressCount={selectedProgressCount}
                  selectedAlgorithm={algorithm}
                />
                <ResultTable results={results} />
                <AlgorithmNotes />
              </div>
            ) : null}
          </div>
        </main>
        <ControlPanel
          gridSize={gridSize}
          obstacleDensity={obstacleDensity}
          algorithm={algorithm}
          movementMode={movementMode}
          mapMode={mapMode}
          start={start}
          goal={goal}
          running={running}
          showVisited={showVisited}
          showRestrictions={showRestrictions}
          visibleAlgorithms={visibleAlgorithms}
          onGridSizeChange={handleGridSizeChange}
          onDensityChange={setObstacleDensity}
          onAlgorithmChange={setAlgorithm}
          onMovementModeChange={setMovementMode}
          onMapModeChange={handleMapModeChange}
          onPointChange={handlePointChange}
          onGenerate={generate}
          onClear={handleClear}
          onRun={handleRun}
          onRunAll={handleRunAll}
          onCancel={() => {
            cancelAll();
          }}
          onResetCamera={() => setResetCameraSignal((value) => value + 1)}
          onToggleVisited={setShowVisited}
          onToggleRestrictions={setShowRestrictions}
          onToggleAlgorithmVisible={(targetAlgorithm, show) =>
            setVisibleAlgorithms((current) => ({
              ...current,
              [targetAlgorithm]: show
            }))
          }
        />
      </div>
    </div>
  );
};
