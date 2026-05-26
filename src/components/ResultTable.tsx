import type { AlgorithmType, PathfindingResult } from "../algorithms/types";
import { algorithmLabel } from "../utils/metrics";

interface ResultTableProps {
  results: Partial<Record<AlgorithmType, PathfindingResult>>;
}

const order: AlgorithmType[] = ["dijkstra", "astar", "theta"];

export const ResultTable = ({ results }: ResultTableProps) => (
  <section className="border-t border-line bg-white p-4">
    <div className="mb-3">
      <h2 className="text-base font-bold text-ink">比較表</h2>
      <p className="text-sm text-slate-500">在同一張體素地圖上比較 Dijkstra、A* 與 Theta*。</p>
    </div>
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="bg-panel text-xs font-bold uppercase text-slate-600">
          <tr>
            <th className="px-3 py-2">演算法</th>
            <th className="px-3 py-2">狀態</th>
            <th className="px-3 py-2">運算時間</th>
            <th className="px-3 py-2">路徑長度</th>
            <th className="px-3 py-2">探索節點</th>
            <th className="px-3 py-2">記憶體</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {order.map((algorithm) => {
            const result = results[algorithm];
            return (
              <tr key={algorithm}>
                <td className="px-3 py-2 font-semibold text-ink">{algorithmLabel(algorithm)}</td>
                <td className="px-3 py-2">
                  {result ? (result.success ? "找到路徑" : "沒有路徑") : "-"}
                </td>
                <td className="px-3 py-2">
                  {result ? `${result.executionTimeMs.toFixed(2)} ms` : "-"}
                </td>
                <td className="px-3 py-2">
                  {result && result.success ? result.pathLength.toFixed(2) : "-"}
                </td>
                <td className="px-3 py-2">
                  {result ? result.visitedNodes.length.toLocaleString() : "-"}
                </td>
                <td className="px-3 py-2">{result ? result.memoryEstimate : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);
