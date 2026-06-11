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

## 演算法虛擬碼

以下虛擬碼依照 `src/algorithms/` 中的實際實作整理。三種演算法皆使用 Min-Priority Queue；每次取出優先權最小的節點，並以 `closed` 集合避免重複展開。

### 共用函式：取得相鄰節點

6 方向模式只允許沿單一座標軸移動；26 方向模式則包含面、邊與角方向。候選節點必須位於地圖範圍內，且不可為障礙物。

```txt
FUNCTION GetNeighbors(current, gridSize, obstacles, movementMode)
    neighbors <- empty list

    FOR dx FROM -1 TO 1
        FOR dy FROM -1 TO 1
            FOR dz FROM -1 TO 1
                IF dx = 0 AND dy = 0 AND dz = 0
                    CONTINUE

                nonZeroAxes <- CountNonZero(dx, dy, dz)
                IF movementMode = 6 AND nonZeroAxes != 1
                    CONTINUE

                neighbor <- (current.x + dx,
                             current.y + dy,
                             current.z + dz)

                IF neighbor is inside grid AND neighbor is not an obstacle
                    ADD neighbor TO neighbors

    RETURN neighbors
```

相鄰節點之間的移動成本使用 3D 歐幾里得距離：

```txt
Distance(a, b) <- SQRT(
    (a.x - b.x)^2 +
    (a.y - b.y)^2 +
    (a.z - b.z)^2
)
```

### Dijkstra 虛擬碼

Dijkstra 的 Priority Queue 優先權只有起點到節點的累積距離 `distance`，不使用 heuristic。

```txt
FUNCTION Dijkstra(start, goal, grid)
    open <- empty Min-Priority Queue
    distance[start] <- 0
    parent <- empty map
    closed <- empty set
    visited <- empty list

    ENQUEUE open WITH (start, priority = 0)

    WHILE open is not empty
        IF task is cancelled
            BREAK

        current <- DEQUEUE node with minimum priority
        IF current is in closed
            CONTINUE

        ADD current TO closed
        ADD current TO visited

        IF current = goal
            RETURN (ReconstructPath(parent, start, goal), visited)

        FOR EACH neighbor IN GetNeighbors(current)
            IF neighbor is in closed
                CONTINUE

            newDistance <- distance[current] + Distance(current, neighbor)

            IF newDistance < distance[neighbor]
                distance[neighbor] <- newDistance
                parent[neighbor] <- current
                ENQUEUE open WITH (neighbor, priority = newDistance)

    RETURN (empty path, visited)
```

### A* 虛擬碼

A* 使用 `f(n) = g(n) + h(n)` 作為 Priority Queue 優先權，其中 `h(n)` 是節點到終點的 3D 歐幾里得距離。

```txt
FUNCTION AStar(start, goal, grid)
    open <- empty Min-Priority Queue
    gScore[start] <- 0
    parent <- empty map
    closed <- empty set
    visited <- empty list

    ENQUEUE open WITH (
        start,
        priority = Distance(start, goal)
    )

    WHILE open is not empty
        IF task is cancelled
            BREAK

        current <- DEQUEUE node with minimum priority
        IF current is in closed
            CONTINUE

        ADD current TO closed
        ADD current TO visited

        IF current = goal
            RETURN (ReconstructPath(parent, start, goal), visited)

        FOR EACH neighbor IN GetNeighbors(current)
            IF neighbor is in closed
                CONTINUE

            tentativeG <- gScore[current] + Distance(current, neighbor)

            IF tentativeG < gScore[neighbor]
                gScore[neighbor] <- tentativeG
                parent[neighbor] <- current
                heuristic <- Distance(neighbor, goal)
                ENQUEUE open WITH (
                    neighbor,
                    priority = tentativeG + heuristic
                )

    RETURN (empty path, visited)
```

### Theta* 虛擬碼

Theta* 保留 A* 的評估方式，但會檢查 `parent[current]` 是否能直接看見 `neighbor`。若可直線到達且成本更低，便跳過 `current`，直接將該祖先設為 `neighbor` 的 parent。

```txt
FUNCTION ThetaStar(start, goal, grid)
    open <- empty Min-Priority Queue
    gScore[start] <- 0
    parent[start] <- start
    closed <- empty set
    visited <- empty list

    ENQUEUE open WITH (
        start,
        priority = Distance(start, goal)
    )

    WHILE open is not empty
        IF task is cancelled
            BREAK

        current <- DEQUEUE node with minimum priority
        IF current is in closed
            CONTINUE

        ADD current TO closed
        ADD current TO visited

        IF current = goal
            RETURN (ReconstructPath(parent, start, goal), visited)

        FOR EACH neighbor IN GetNeighbors(current)
            IF neighbor is in closed
                CONTINUE

            candidateParent <- current
            candidateG <- gScore[current] + Distance(current, neighbor)
            currentParent <- parent[current]

            IF HasLineOfSight(currentParent, neighbor)
                shortcutG <- gScore[currentParent]
                             + Distance(currentParent, neighbor)

                IF shortcutG < candidateG
                    candidateG <- shortcutG
                    candidateParent <- currentParent

            IF candidateG < gScore[neighbor]
                gScore[neighbor] <- candidateG
                parent[neighbor] <- candidateParent
                heuristic <- Distance(neighbor, goal)
                ENQUEUE open WITH (
                    neighbor,
                    priority = candidateG + heuristic
                )

    RETURN (empty path, visited)
```

### Line-of-Sight 虛擬碼

本專案的 Line-of-Sight 會在兩點間依最大座標差決定取樣次數，對每個取樣位置四捨五入成 Voxel 座標；只要其中一點超出地圖或碰到障礙物，就判定無法直視。

```txt
FUNCTION HasLineOfSight(from, to, grid)
    dx <- ABS(to.x - from.x)
    dy <- ABS(to.y - from.y)
    dz <- ABS(to.z - from.z)
    steps <- MAX(dx, dy, dz)

    IF steps = 0
        RETURN true

    FOR i FROM 0 TO steps
        t <- i / steps
        point <- (
            ROUND(from.x + (to.x - from.x) * t),
            ROUND(from.y + (to.y - from.y) * t),
            ROUND(from.z + (to.z - from.z) * t)
        )

        IF point != from AND point is not walkable
            RETURN false

    RETURN true
```

### 路徑回溯虛擬碼

```txt
FUNCTION ReconstructPath(parent, start, goal)
    path <- empty list
    current <- goal

    WHILE current exists
        ADD current TO path
        IF current = start
            RETURN REVERSE(path)
        current <- parent[current]

    RETURN empty path
```

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
