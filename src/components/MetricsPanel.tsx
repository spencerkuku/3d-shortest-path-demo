import { Activity, Clock, Database, MapPinned } from "lucide-react";
import type { AlgorithmType, PathfindingResult } from "../algorithms/types";
import { algorithmLabel } from "../utils/metrics";

interface MetricsPanelProps {
  result: PathfindingResult | null;
  running: boolean;
  progressCount: number;
  selectedAlgorithm: AlgorithmType;
}

export const MetricsPanel = ({
  result,
  running,
  progressCount,
  selectedAlgorithm
}: MetricsPanelProps) => {
  const items = [
    {
      label: "運算時間",
      value: result ? `${result.executionTimeMs.toFixed(2)} ms` : running ? "執行中" : "-"
    },
    {
      label: "路徑長度",
      value: result && result.success ? result.pathLength.toFixed(2) : "-"
    },
    {
      label: "探索節點",
      value: running ? progressCount.toLocaleString() : result ? result.visitedNodes.length.toLocaleString() : "-"
    },
    {
      label: "記憶體估算",
      value: result ? result.memoryEstimate : "-"
    }
  ];
  const icons = [Clock, MapPinned, Activity, Database];

  return (
    <section className="border-t border-line bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-ink">目前執行指標</h2>
          <p className="text-sm text-slate-500">
            {algorithmLabel(result?.algorithm ?? selectedAlgorithm)}
          </p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            result?.success
              ? "bg-emerald-50 text-emerald-700"
              : result
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {running ? "執行中" : result ? (result.success ? "找到路徑" : "沒有路徑") : "待命中"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[index];
          return (
            <div key={item.label} className="rounded-md border border-line bg-panel p-3">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <Icon size={15} />
                <span className="metric-label">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-ink">{item.value}</p>
            </div>
          );
        })}
      </div>
      {result?.error ? (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
          {result.error}
        </p>
      ) : null}
    </section>
  );
};
