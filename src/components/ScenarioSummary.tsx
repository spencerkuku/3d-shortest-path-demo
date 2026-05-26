import type { MapMode } from "../algorithms/types";

interface ScenarioSummaryProps {
  mapMode: MapMode;
  obstacleCount: number;
  buildingCount: number;
  noFlyCount: number;
  temporaryRestrictionCount: number;
}

export const ScenarioSummary = ({
  mapMode,
  obstacleCount,
  buildingCount,
  noFlyCount,
  temporaryRestrictionCount
}: ScenarioSummaryProps) => (
  <section className="border-t border-line bg-white p-4">
    <div className="mb-3">
      <h2 className="text-base font-bold text-ink">地圖情境</h2>
      <p className="text-sm text-slate-500">
        {mapMode === "drone"
          ? "無人機城市模擬都市 UAV 航線規劃，包含建築物、禁航空域與臨時作業限制。"
          : "體素實驗是原本的控制組網格，用來比較演算法在隨機障礙物中的表現。"}
      </p>
    </div>

    {mapMode === "drone" ? (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-md border border-line bg-panel p-3">
          <p className="metric-label">阻擋格數</p>
          <p className="mt-1 text-lg font-bold text-ink">{obstacleCount.toLocaleString()}</p>
        </div>
        <div className="rounded-md border border-line bg-panel p-3">
          <p className="metric-label">建築體積</p>
          <p className="mt-1 text-lg font-bold text-ink">{buildingCount.toLocaleString()}</p>
        </div>
        <div className="rounded-md border border-line bg-panel p-3">
          <p className="metric-label">禁航區</p>
          <p className="mt-1 text-lg font-bold text-ink">{noFlyCount.toLocaleString()}</p>
        </div>
        <div className="rounded-md border border-line bg-panel p-3">
          <p className="metric-label">臨時限制</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {temporaryRestrictionCount.toLocaleString()}
          </p>
        </div>
      </div>
    ) : (
      <div className="rounded-md border border-line bg-panel p-3">
        <p className="metric-label">隨機障礙物</p>
        <p className="mt-1 text-lg font-bold text-ink">{obstacleCount.toLocaleString()}</p>
      </div>
    )}
  </section>
);
