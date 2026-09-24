"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { ThemeId } from "@/lib/types";

export function CastleWorld() {
  return (
    <group>
      <group position={[0, 0, -5]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.6, 1.8, 4, 16]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.6, 0]} castShadow>
          <coneGeometry args={[2.1, 1.6, 16]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.55} />
        </mesh>
      </group>

      {[-4.4, 4.4].map((x) => (
        <group key={x} position={[x, 0, -4]}>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.9, 1, 3.2, 12]} />
            <meshStandardMaterial color="#c4b5a0" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.6, 0]} castShadow>
            <coneGeometry args={[1.2, 1.1, 12]} />
            <meshStandardMaterial color="#5b21b6" roughness={0.55} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1, -4]} castShadow receiveShadow>
        <boxGeometry args={[9, 2, 0.6]} />
        <meshStandardMaterial color="#b8ab94" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.03, -0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2, 3.4]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function FireStationWorld() {
  return (
    <group>
      <mesh position={[0, 1.6, -5]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.2, 3]} />
        <meshStandardMaterial color="#f4d35e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.6, -5]} castShadow>
        <boxGeometry args={[6.4, 0.6, 3.4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.2, -3.44]} receiveShadow>
        <planeGeometry args={[2.4, 2.2]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
      </mesh>

      <group position={[3.2, 0, 0.5]}>
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 1.1, 1.3]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[-1, 1.35, 0]} castShadow>
          <boxGeometry args={[0.9, 0.6, 1.2]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.3} />
        </mesh>
        {[
          [-0.8, -0.75],
          [0.8, -0.75],
          [-0.8, 0.75],
          [0.8, 0.75],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.28, 16]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
        ))}
      </group>

      <mesh position={[-3.2, 0.5, 1]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 1, 10]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function StadiumWorld() {
  return (
    <group>
      <group position={[0, 0, -5.5]}>
        <mesh position={[-1.6, 1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[1.6, 1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3.2, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      </group>

      {[-6, 6].map((x) => (
        <mesh key={x} position={[x, 1.4, -2]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 2.8, 7]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.35, 20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      <mesh position={[-3.6, 0.6, -2]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 1.2, 12]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

export function ThemeWorld({ themeId }: { themeId: ThemeId }) {
  if (themeId === "chevalier") return <CastleWorld />;
  if (themeId === "pompier") return <FireStationWorld />;
  return <StadiumWorld />;
}

export function MascotFigure({ themeId }: { themeId: ThemeId }) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.06;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.15;
  });

  const bodyColor = themeId === "chevalier" ? "#6d28d9" : themeId === "pompier" ? "#dc2626" : "#16a34a";
  const headColor = "#f4c9a0";

  return (
    <group position={[0, 0, 2.4]} ref={ref}>
      <mesh position={[-0.22, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.22, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={headColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.34, 0]} castShadow>
        {themeId === "foot" ? (
          <torusGeometry args={[0.06, 0.06, 8, 16]} />
        ) : (
          <coneGeometry args={[0.34, 0.3, 12]} />
        )}
        <meshStandardMaterial
          color={themeId === "pompier" ? "#facc15" : bodyColor}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

export function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[11, 48]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}
