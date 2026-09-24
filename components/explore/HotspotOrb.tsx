"use client";

import { useState } from "react";
import { Float } from "@react-three/drei";
import { Hotspot } from "@/lib/content/explore";

export default function HotspotOrb({
  hotspot,
  collected,
  onSelect,
}: {
  hotspot: Hotspot;
  collected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={hotspot.position}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={1}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          scale={hovered ? 1.25 : 1}
        >
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial
            color={collected ? "#cbd5e1" : "#ffd166"}
            emissive={collected ? "#94a3b8" : "#ff9f1c"}
            emissiveIntensity={collected ? 0.2 : 0.9}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      </Float>
    </group>
  );
}
