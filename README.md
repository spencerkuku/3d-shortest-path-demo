# 3D Shortest Path Demo

> English version: [README.en.md](./README.en.md)

這是一個純前端的「3D 地圖最短路徑演算法視覺化」專案，用於演算法課程期末報告展示。專案以 3D Voxel Grid 建立地圖模型，並比較 Dijkstra、A*、Theta* 三種路徑搜尋演算法在不同情境下的表現。

本專案不需要後端與資料庫，演算法運算放在 Web Worker 中執行，讓主畫面可以持續維持互動與 3D 渲染。

## 專案目標

本專案的目標是將最短路徑演算法從一般 2D 範例延伸到 3D 空間，讓使用者可以在立體網格中觀察：

- 演算法如何探索節點
- 障礙物如何影響搜尋範圍
- 不同移動模式如何改變路徑長度
- Dijkstra、A*、Theta* 在運算時間、探索節點數與路徑品質上的差異
- 無人機在都市環境中避開建築物與禁航區後的路徑規劃結果

## 主要功能

- 3D Voxel Grid 地圖視覺化
- 起點、終點、障礙物、已探索節點、最終路徑顯示
- Voxel Lab 隨機障礙物實驗地圖
- Drone City 無人機城市情境地圖
- 建築物、禁航區、臨時限制區視覺化
- 支援 6 方向與 26 方向移動
- 支援地圖大小：30x30x30、50x50x50、100x100x100、150x150x150
- 支援障礙物或臨時限制密度調整
- 可自行設定起點與終點座標
- 可單獨執行 Dijkstra、A*、Theta*
- 可使用「全部執行」在同一張地圖上比較三種演算法
- 每個演算法有不同顏色的路徑與探索節點
- 可開關特定演算法圖層
- 可開關已探索節點與限制方塊顯示
- 使用 OrbitControls 旋轉、縮放與平移 3D 視角
- 可重設相機視角

## Drone City 無人機情境

Drone City 是本專案中偏向實際應用的地圖模式。它仍然使用 3D Voxel Grid 表示空間，但情境改成無人機在城市中規劃航線。

在這個模式中：

- `x` 與 `y` 表示水平地面座標
- `z` 表示高度
- 建築物以垂直體積表示
- 禁航區以限制空域表示
- 臨時限制可模擬天氣、活動管制或任務限制

使用者可以在同一張城市地圖上執行 Dijkstra、A*、Theta*，比較它們在實際限制條件下的搜尋效率與路徑差異。

## 演算法說明

### Dijkstra

Dijkstra 作為 baseline 方法，不使用 heuristic，只依照目前已知的最短成本向外擴展。它能保證找到最短路徑，但在大型 3D 網格中通常會探索大量節點，因此運算時間與 visited nodes 數量通常較高。

### A*

A* 使用：

```txt
f(n) = g(n) + h(n)
```

其中：

- `g(n)` 是起點到目前節點的實際成本
- `h(n)` 是目前節點到終點的估計成本

本專案使用 3D Euclidean distance 作為 heuristic，讓搜尋更偏向終點方向，通常能比 Dijkstra 探索更少節點。

### Theta*

Theta* 是 A* 的延伸版本，加入 Line-of-Sight 檢查。當目前節點的 parent 可以直接看到 neighbor 時，Theta* 會嘗試直接連線，減少不必要的轉折。

因此 Theta* 在開闊空間中通常可以產生更平滑、較接近連續空間的路徑。

## 比較指標

每次演算法執行後會顯示：

- 運算時間
- 路徑長度
- 探索節點數
- 記憶體估算
- 是否找到路徑

使用「全部執行」可以在同一張地圖上同時比較 Dijkstra、A*、Theta* 的結果。

## 技術架構

- React
- Vite
- TypeScript
- Tailwind CSS
- Three.js / `@react-three/fiber`
- Web Worker
- Cloudflare Pages 靜態部署

## 專案結構

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

## 如何執行

安裝套件：

```bash
npm install
```

啟動開發伺服器：

```bash
npm run dev
```

接著開啟 Vite 顯示的本地網址。

## 建置專案

```bash
npm run build
```

建置完成後，輸出檔案會產生在 `dist/`。

## 部署到 Cloudflare Pages

Cloudflare Pages 設定：

- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: Vite

本專案是純前端靜態網站，不需要後端、資料庫或伺服器 runtime。
