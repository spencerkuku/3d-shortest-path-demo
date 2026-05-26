export const AlgorithmNotes = () => (
  <section className="border-t border-line bg-white p-4">
    <h2 className="mb-3 text-base font-bold text-ink">演算法說明</h2>
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-md border border-line bg-panel p-3">
        <h3 className="font-bold text-slate-800">Dijkstra</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          作為最短路徑基準方法，只依照目前已知成本擴展節點。
          結果穩定可靠，但通常會探索較多節點。
        </p>
      </div>
      <div className="rounded-md border border-line bg-panel p-3">
        <h3 className="font-bold text-slate-800">A*</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          使用 f(n) = g(n) + h(n)，並以 3D 歐幾里得距離作為啟發式函數，
          讓搜尋更偏向終點方向。
        </p>
      </div>
      <div className="rounded-md border border-line bg-panel p-3">
        <h3 className="font-bold text-slate-800">Theta*</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          在 A* 基礎上加入視線檢查，若父節點能直接連到鄰居節點，
          就能產生更平滑、較接近連續空間的路徑。
        </p>
      </div>
    </div>
  </section>
);
