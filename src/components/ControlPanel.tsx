import { Pause, Play, RefreshCcw, RotateCcw, Shuffle, Trash2 } from "lucide-react";
import type { AlgorithmType, MapMode, MovementMode, Point3D } from "../algorithms/types";
import { algorithmColors } from "../utils/algorithmColors";

interface ControlPanelProps {
  gridSize: number;
  obstacleDensity: number;
  algorithm: AlgorithmType;
  movementMode: MovementMode;
  mapMode: MapMode;
  start: Point3D;
  goal: Point3D;
  running: boolean;
  showVisited: boolean;
  showRestrictions: boolean;
  visibleAlgorithms: Record<AlgorithmType, boolean>;
  onGridSizeChange: (size: number) => void;
  onDensityChange: (density: number) => void;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  onMovementModeChange: (mode: MovementMode) => void;
  onMapModeChange: (mode: MapMode) => void;
  onPointChange: (kind: "start" | "goal", axis: keyof Point3D, value: number) => void;
  onGenerate: () => void;
  onClear: () => void;
  onRun: () => void;
  onRunAll: () => void;
  onCancel: () => void;
  onResetCamera: () => void;
  onToggleVisited: (show: boolean) => void;
  onToggleRestrictions: (show: boolean) => void;
  onToggleAlgorithmVisible: (algorithm: AlgorithmType, show: boolean) => void;
}

const algorithms: Array<{ value: AlgorithmType; label: string }> = [
  { value: "dijkstra", label: "Dijkstra" },
  { value: "astar", label: "A*" },
  { value: "theta", label: "Theta*" }
];

export const ControlPanel = ({
  gridSize,
  obstacleDensity,
  algorithm,
  movementMode,
  mapMode,
  start,
  goal,
  running,
  showVisited,
  showRestrictions,
  visibleAlgorithms,
  onGridSizeChange,
  onDensityChange,
  onAlgorithmChange,
  onMovementModeChange,
  onMapModeChange,
  onPointChange,
  onGenerate,
  onClear,
  onRun,
  onRunAll,
  onCancel,
  onResetCamera,
  onToggleVisited,
  onToggleRestrictions,
  onToggleAlgorithmVisible
}: ControlPanelProps) => {
  const axisLabel = (axis: keyof Point3D) =>
    mapMode === "drone" && axis === "z" ? "Z 高度" : axis.toUpperCase();

  const pointInputs = (kind: "start" | "goal", point: Point3D) => (
    <div className="grid grid-cols-3 gap-2">
      {(["x", "y", "z"] as Array<keyof Point3D>).map((axis) => (
        <label key={`${kind}-${axis}`} className="min-w-0">
          <span className="metric-label block">{axisLabel(axis)}</span>
          <input
            className="input-field w-full"
            type="number"
            min={0}
            max={gridSize - 1}
            value={point[axis]}
            onChange={(event) => onPointChange(kind, axis, Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );

  return (
    <aside className="min-h-0 overflow-auto border-l border-line bg-panel p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase text-cyan-800">3D 體素網格</p>
        <h1 className="mt-1 text-xl font-bold text-ink">最短路徑實驗室</h1>
      </div>

      <div className="space-y-5">
        <section className="space-y-3">
          <label className="control-label block">地圖情境</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={mapMode === "voxel" ? "button-primary" : "button-secondary"}
              onClick={() => onMapModeChange("voxel")}
              disabled={running}
            >
              體素實驗
            </button>
            <button
              className={mapMode === "drone" ? "button-primary" : "button-secondary"}
              onClick={() => onMapModeChange("drone")}
              disabled={running}
            >
              無人機城市
            </button>
          </div>
          <p className="rounded-md border border-line bg-white p-2 text-xs leading-5 text-slate-600">
            {mapMode === "drone"
              ? "無人機城市會加入建築物、禁航區與臨時限制；Z 軸代表高度。"
              : "體素實驗保留原本的隨機障礙物網格，用來觀察演算法行為。"}
          </p>
        </section>

        <section className="space-y-3">
          <label className="control-label block">地圖大小</label>
          <select
            className="input-field w-full"
            value={gridSize}
            onChange={(event) => onGridSizeChange(Number(event.target.value))}
            disabled={running}
          >
            {[30, 50, 100, 150].map((size) => (
              <option key={size} value={size}>
                {size}x{size}x{size}
              </option>
            ))}
          </select>
          {gridSize >= 100 ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs leading-5 text-amber-800">
              {gridSize}x{gridSize}x{gridSize} 會產生完整網格，不做抽樣。
              這是用來測試最壞情況，可能會花很久，尤其是 Dijkstra 或全部執行。
            </p>
          ) : gridSize === 50 ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              50x50x50 共有 125,000 個節點，執行時間可能較長，尤其是 Dijkstra。
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="control-label">
              {mapMode === "drone" ? "臨時限制密度" : "障礙物密度"}
            </label>
            <span className="text-sm font-semibold text-slate-700">{obstacleDensity}%</span>
          </div>
          <input
            className="w-full accent-cyan-700"
            type="range"
            min={0}
            max={40}
            value={obstacleDensity}
            onChange={(event) => onDensityChange(Number(event.target.value))}
            disabled={running}
          />
          <div className="grid grid-cols-2 gap-2">
            <button className="button-secondary" onClick={onGenerate} disabled={running}>
              <Shuffle size={16} /> {mapMode === "drone" ? "重設任務" : "產生地圖"}
            </button>
            <button className="button-secondary" onClick={onClear} disabled={running}>
              <Trash2 size={16} /> 清除
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <label className="control-label block">起點</label>
          {pointInputs("start", start)}
          <label className="control-label block">終點</label>
          {pointInputs("goal", goal)}
        </section>

        <section className="space-y-3">
          <label className="control-label block">演算法</label>
          <div className="grid grid-cols-3 gap-2">
            {algorithms.map((item) => (
              <button
                key={item.value}
                className={
                  algorithm === item.value
                    ? "button-primary"
                    : "button-secondary"
                }
                onClick={() => onAlgorithmChange(item.value)}
                disabled={running}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="control-label block">移動方式</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={movementMode === "6" ? "button-primary" : "button-secondary"}
              onClick={() => onMovementModeChange("6")}
              disabled={running}
            >
              6 方向
            </button>
            <button
              className={movementMode === "26" ? "button-primary" : "button-secondary"}
              onClick={() => onMovementModeChange("26")}
              disabled={running}
            >
              26 方向
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button className="button-primary" onClick={onRun} disabled={running}>
            <Play size={16} /> 執行
          </button>
          <button className="button-secondary" onClick={onRunAll} disabled={running}>
            <RefreshCcw size={16} /> 全部執行
          </button>
          <button className="button-secondary" onClick={onCancel} disabled={!running}>
            <Pause size={16} /> 取消
          </button>
          <button className="button-secondary" onClick={onResetCamera}>
            <RotateCcw size={16} /> 重設視角
          </button>
        </section>

        <label className="flex items-center gap-2 rounded-md border border-line bg-white p-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan-700"
            checked={showVisited}
            onChange={(event) => onToggleVisited(event.target.checked)}
          />
          顯示已探索節點
        </label>

        <label className="flex items-center gap-2 rounded-md border border-line bg-white p-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan-700"
            checked={showRestrictions}
            onChange={(event) => onToggleRestrictions(event.target.checked)}
          />
          顯示限制方塊
        </label>

        <section className="space-y-2 rounded-md border border-line bg-white p-3">
          <p className="control-label">演算法圖層</p>
          {algorithms.map((item) => (
            <label
              key={item.value}
              className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: algorithmColors[item.value].path }}
                />
                {item.label}
              </span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan-700"
                checked={visibleAlgorithms[item.value]}
                onChange={(event) =>
                  onToggleAlgorithmVisible(item.value, event.target.checked)
                }
              />
            </label>
          ))}
        </section>
      </div>
    </aside>
  );
};
