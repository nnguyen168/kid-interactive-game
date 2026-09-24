"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ThemeId } from "@/lib/types";
import { EXPLORE_HOTSPOTS, Hotspot } from "@/lib/content/explore";
import { Ground, MascotFigure, ThemeWorld } from "./worlds";
import HotspotOrb from "./HotspotOrb";

const GROUND_COLOR: Record<ThemeId, string> = {
  chevalier: "#8bc34a",
  pompier: "#94a3b8",
  foot: "#4caf50",
};

export default function Scene3D({
  themeId,
  collected,
  onHotspotSelect,
}: {
  themeId: ThemeId;
  collected: string[];
  onHotspotSelect: (hotspot: Hotspot) => void;
}) {
  const hotspots = EXPLORE_HOTSPOTS[themeId];
  const target: [number, number, number] = [0, 1, -1.5];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 9, 8], fov: 40 }}
      onCreated={({ camera }) => camera.lookAt(...target)}
    >
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.25} />

      <Ground color={GROUND_COLOR[themeId]} />
      <ThemeWorld themeId={themeId} />
      <MascotFigure themeId={themeId} />

      {hotspots.map((hotspot) => (
        <HotspotOrb
          key={hotspot.id}
          hotspot={hotspot}
          collected={collected.includes(hotspot.id)}
          onSelect={() => onHotspotSelect(hotspot)}
        />
      ))}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={14} blur={2} far={4} />

      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={16}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.6}
        target={target}
      />
    </Canvas>
  );
}
