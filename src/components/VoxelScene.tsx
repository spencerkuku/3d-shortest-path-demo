import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { parseKey } from "../algorithms/grid";
import type { AlgorithmType, Point3D } from "../algorithms/types";
import { algorithmColors } from "../utils/algorithmColors";
import { algorithmLabel } from "../utils/metrics";

interface VoxelSceneProps {
  gridSize: number;
  obstacles: Set<string>;
  start: Point3D;
  goal: Point3D;
  algorithmVisuals: Partial<
    Record<
      AlgorithmType,
      {
        visitedNodes: Point3D[];
        path: Point3D[];
        running: boolean;
      }
    >
  >;
  visibleAlgorithms: Record<AlgorithmType, boolean>;
  showVisited: boolean;
  showRestrictions: boolean;
  resetCameraSignal: number;
  runningAlgorithms: AlgorithmType[];
  algorithm: AlgorithmType;
  visitedCount: number;
  scenarioLabel: string;
  obstacleLayers?: {
    buildings: Set<string>;
    noFlyZones: Set<string>;
    temporaryRestrictions: Set<string>;
  };
}

const toScenePosition = (point: Point3D, gridSize: number): [number, number, number] => {
  const center = (gridSize - 1) / 2;
  return [point.x - center, point.z - center, point.y - center];
};

const InstancedVoxels = ({
  points,
  gridSize,
  color,
  opacity,
  scale
}: {
  points: Point3D[];
  gridSize: number;
  color: string;
  opacity: number;
  scale: number;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    points.forEach((point, index) => {
      const [x, y, z] = toScenePosition(point, gridSize);
      matrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        new THREE.Vector3(scale, scale, scale)
      );
      meshRef.current?.setMatrixAt(index, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [gridSize, matrix, points, scale]);

  if (points.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
      <boxGeometry args={[0.86, 0.86, 0.86]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </instancedMesh>
  );
};

const CameraReset = ({
  gridSize,
  resetCameraSignal
}: {
  gridSize: number;
  resetCameraSignal: number;
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const distance = Math.max(20, gridSize * 1.55);
    camera.position.set(distance, distance * 0.75, distance);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  }, [camera, gridSize, resetCameraSignal]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} />;
};

export const VoxelScene = ({
  gridSize,
  obstacles,
  start,
  goal,
  algorithmVisuals,
  visibleAlgorithms,
  showVisited,
  showRestrictions,
  resetCameraSignal,
  runningAlgorithms,
  algorithm,
  visitedCount,
  scenarioLabel,
  obstacleLayers
}: VoxelSceneProps) => {
  const obstaclePoints = useMemo(
    () => {
      const categorized = new Set([
        ...(obstacleLayers?.buildings ?? []),
        ...(obstacleLayers?.noFlyZones ?? []),
        ...(obstacleLayers?.temporaryRestrictions ?? [])
      ]);
      return Array.from(obstacles)
        .filter((key) => !categorized.has(key))
        .map(parseKey);
    },
    [obstacleLayers, obstacles]
  );
  const buildingPoints = useMemo(
    () => Array.from(obstacleLayers?.buildings ?? []).map(parseKey),
    [obstacleLayers]
  );
  const noFlyPoints = useMemo(
    () => Array.from(obstacleLayers?.noFlyZones ?? []).map(parseKey),
    [obstacleLayers]
  );
  const temporaryRestrictionPoints = useMemo(
    () => Array.from(obstacleLayers?.temporaryRestrictions ?? []).map(parseKey),
    [obstacleLayers]
  );
  const activeVisuals = useMemo(
    () =>
      (Object.keys(visibleAlgorithms) as AlgorithmType[])
        .filter((item) => visibleAlgorithms[item] && algorithmVisuals[item])
        .map((item) => ({ algorithm: item, visual: algorithmVisuals[item]! })),
    [algorithmVisuals, visibleAlgorithms]
  );

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#dfe5eb]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-md border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-xs font-bold uppercase text-slate-500">目前搜尋</p>
        <p className="mt-1 text-sm font-bold text-ink">
          {runningAlgorithms.length > 0
            ? `${runningAlgorithms.map(algorithmLabel).join(", ")} 執行中`
            : activeVisuals.length > 0
              ? "路徑已顯示"
              : "待命中"}
        </p>
        <p className="text-xs text-slate-600">
          {scenarioLabel} - 已探索：{visitedCount.toLocaleString()} 個節點
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 grid gap-2 rounded-md border border-white/70 bg-white/90 p-3 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur sm:grid-cols-3">
        {showRestrictions ? (
          <>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#34495e]" /> 障礙物
            </span>
            {obstacleLayers ? (
              <>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#26313f]" /> 建築物
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#be123c]" /> 禁航區
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#7c3aed]" /> 臨時限制
                </span>
              </>
            ) : null}
          </>
        ) : null}
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#2563eb]" /> Dijkstra
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#f59e0b]" /> A*
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#16a34a]" /> Theta*
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#18a058]" /> 起點
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#dc2626]" /> 終點
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#facc15]" /> 路徑
        </span>
      </div>

      <Canvas camera={{ position: [24, 18, 24], fov: 48 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#dfe5eb"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[20, 24, 16]} intensity={1.4} />
        <directionalLight position={[-16, 8, -14]} intensity={0.45} />

        <gridHelper
          args={[gridSize, gridSize, "#8292a3", "#c4ccd5"]}
          position={[0, -gridSize / 2 - 0.5, 0]}
        />
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(gridSize, gridSize, gridSize)]} />
          <lineBasicMaterial color="#8c98a6" transparent opacity={0.75} />
        </lineSegments>

        {showRestrictions ? (
          <>
            <InstancedVoxels
              points={obstaclePoints}
              gridSize={gridSize}
              color="#34495e"
              opacity={0.94}
              scale={0.9}
            />
            <InstancedVoxels
              points={buildingPoints}
              gridSize={gridSize}
              color="#26313f"
              opacity={0.98}
              scale={0.92}
            />
            <InstancedVoxels
              points={noFlyPoints}
              gridSize={gridSize}
              color="#be123c"
              opacity={0.36}
              scale={0.96}
            />
            <InstancedVoxels
              points={temporaryRestrictionPoints}
              gridSize={gridSize}
              color="#7c3aed"
              opacity={0.58}
              scale={0.82}
            />
          </>
        ) : null}
        {showVisited ? (
          <>
            {activeVisuals.map(({ algorithm: item, visual }) => (
              <InstancedVoxels
                key={`${item}-visited`}
                points={visual.visitedNodes.slice(-3500)}
                gridSize={gridSize}
                color={algorithmColors[item].visited}
                opacity={0.26}
                scale={0.74}
              />
            ))}
            {activeVisuals.map(({ algorithm: item, visual }) =>
              visual.running ? (
                <InstancedVoxels
                  key={`${item}-recent`}
                  points={visual.visitedNodes.slice(-120)}
                  gridSize={gridSize}
                  color={algorithmColors[item].recent}
                  opacity={0.8}
                  scale={0.86}
                />
              ) : null
            )}
          </>
        ) : null}

        <InstancedVoxels points={[start]} gridSize={gridSize} color="#18a058" opacity={1} scale={1.08} />
        <InstancedVoxels points={[goal]} gridSize={gridSize} color="#dc2626" opacity={1} scale={1.08} />

        {activeVisuals.map(({ algorithm: item, visual }) => {
          const pathPoints = visual.path.map((point) => toScenePosition(point, gridSize));
          return pathPoints.length > 1 ? (
            <Line
              key={`${item}-line`}
              points={pathPoints}
              color={algorithmColors[item].path}
              lineWidth={5}
              transparent
              opacity={0.98}
            />
          ) : null;
        })}
        {activeVisuals.map(({ algorithm: item, visual }) => (
          <InstancedVoxels
            key={`${item}-path-nodes`}
            points={visual.path}
            gridSize={gridSize}
            color={algorithmColors[item].path}
            opacity={0.78}
            scale={0.5}
          />
        ))}

        <CameraReset gridSize={gridSize} resetCameraSignal={resetCameraSignal} />
      </Canvas>
    </div>
  );
};
