"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { game } from "./game";

const ORANGE = "#f97316";
const DARK = "#1f2937";
const CHROME = "#d9dee5";

function Wheel({ x, z, r, w }: { x: number; z: number; r: number; w: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x += (game.speed / r) * Math.min(delta, 0.1);
  });
  return (
    <group position={[x, r, z]}>
      <group ref={ref}>
        <mesh rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[r, r, w, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.85} />
        </mesh>
        <mesh rotation-z={Math.PI / 2} position-x={x > 0 ? w / 2 + 0.01 : -w / 2 - 0.01}>
          <cylinderGeometry args={[r * 0.55, r * 0.55, 0.02, 12]} />
          <meshStandardMaterial color="#facc15" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** A chunky go-kart, nose pointing +z, with flames from the exhaust during turbo. */
export function Kart() {
  const flames = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (wheel.current) wheel.current.rotation.z = game.steer * 1.2;
    const f = flames.current;
    if (!f) return;
    const turbo = performance.now() < game.boostUntil;
    f.visible = turbo;
    if (turbo) f.scale.set(1, 1, 0.8 + Math.sin(clock.elapsedTime * 40) * 0.3);
  });
  return (
    <group>
      {/* floor pan and nose */}
      <RoundedBox args={[1.5, 0.22, 2.6]} radius={0.08} position={[0, 0.34, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={DARK} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[1.1, 0.42, 1.0]} radius={0.16} position={[0, 0.52, 1.05]} castShadow>
        <meshStandardMaterial color={ORANGE} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.9, 0.18, 0.35]} radius={0.08} position={[0, 0.4, 1.55]} castShadow>
        <meshStandardMaterial color={ORANGE} roughness={0.35} />
      </RoundedBox>
      {/* side pods */}
      {[-0.82, 0.82].map((x) => (
        <RoundedBox key={x} args={[0.3, 0.32, 1.3]} radius={0.12} position={[x, 0.5, -0.05]} castShadow>
          <meshStandardMaterial color={ORANGE} roughness={0.35} />
        </RoundedBox>
      ))}
      {/* number plate */}
      <mesh position={[0, 0.66, 1.56]} rotation-x={-0.5}>
        <circleGeometry args={[0.24, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* seat back */}
      <RoundedBox args={[0.8, 0.7, 0.18]} radius={0.08} position={[0, 0.75, -0.72]} rotation-x={-0.2} castShadow>
        <meshStandardMaterial color={DARK} roughness={0.5} />
      </RoundedBox>
      {/* steering wheel */}
      <group position={[0, 0.95, 0.45]} rotation-x={-1.1}>
        <mesh ref={wheel}>
          <torusGeometry args={[0.2, 0.04, 8, 20]} />
          <meshStandardMaterial color="#111827" />
          <mesh>
            <boxGeometry args={[0.36, 0.05, 0.03]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        </mesh>
      </group>
      {/* rear wing */}
      <mesh position={[0, 1.1, -1.25]} castShadow>
        <boxGeometry args={[1.7, 0.06, 0.4]} />
        <meshStandardMaterial color={ORANGE} roughness={0.35} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.85, -1.2]}>
          <boxGeometry args={[0.06, 0.5, 0.2]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}
      {/* exhausts and turbo flames */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.45, -1.35]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.08, 0.1, 0.3, 10]} />
          <meshStandardMaterial color={CHROME} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <group ref={flames} position={[0, 0.45, -1.5]} visible={false}>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, 0, -0.3]} rotation-x={-Math.PI / 2}>
            <coneGeometry args={[0.13, 0.7, 10]} />
            <meshBasicMaterial color={new THREE.Color("#60a5fa").multiplyScalar(1.6)} />
          </mesh>
        ))}
      </group>
      <Wheel x={-0.85} z={1.0} r={0.3} w={0.28} />
      <Wheel x={0.85} z={1.0} r={0.3} w={0.28} />
      <Wheel x={-0.9} z={-0.95} r={0.38} w={0.4} />
      <Wheel x={0.9} z={-0.95} r={0.38} w={0.4} />
    </group>
  );
}
