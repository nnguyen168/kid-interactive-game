"use client";

import { Billboard, Sparkles, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ArtKey } from "@/lib/art";
import { distance2D, game } from "./game";
import { Vec3 } from "./types";

let starGeometry: THREE.ExtrudeGeometry | null = null;

function getStarGeometry() {
  if (starGeometry) return starGeometry;
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.22;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  starGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 3,
  });
  starGeometry.center();
  return starGeometry;
}

const PICK_RADIUS = 1.15;

function Star({ position, taken, onTake }: { position: Vec3; taken: boolean; onTake: () => void }) {
  const group = useRef<THREE.Group>(null);
  const star = useRef<THREE.Mesh>(null);
  const takenAt = useRef<number | null>(null);
  const reported = useRef(false);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    const s = star.current;
    if (!g || !s) return;
    const t = clock.elapsedTime;
    if (!taken && !reported.current && distance2D(game.hero, position[0], position[2]) < PICK_RADIUS) {
      reported.current = true;
      takenAt.current = t;
      onTake();
    }
    if (takenAt.current !== null || taken) {
      // Zip upward, spin fast and shrink away.
      if (takenAt.current === null) takenAt.current = t - 1;
      const k = Math.min(1, (t - takenAt.current) / 0.5);
      s.position.y = 1.1 + k * 2.2;
      s.rotation.y += delta * 18;
      s.scale.setScalar(Math.max(0.001, 1.25 * (1 - k * k)));
      g.visible = k < 1;
      return;
    }
    s.position.y = 1.1 + Math.sin(t * 2.4 + position[0]) * 0.18;
    s.rotation.y = t * 1.8 + position[2];
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={star} geometry={getStarGeometry()} castShadow>
        <meshStandardMaterial color="#ffd23f" emissive="#ffae00" emissiveIntensity={0.85} metalness={0.35} roughness={0.28} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="#fff3a0" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      {!taken && <Sparkles count={10} scale={[1.4, 1.6, 1.4]} position={[0, 1.1, 0]} size={4} speed={0.5} color="#fff7c2" />}
    </group>
  );
}

export function Stars({ positions, taken, onTake }: { positions: Vec3[]; taken: boolean[]; onTake: (index: number) => void }) {
  return (
    <>
      {positions.map((p, i) => (
        <Star key={i} position={p} taken={taken[i]} onTake={() => onTake(i)} />
      ))}
    </>
  );
}

const ENTER_RADIUS = 1.7;
const LEAVE_RADIUS = 2.8;

/** A glowing discovery point: walking into it tells a fun fact. */
export function Spot({
  position,
  art,
  visited,
  onEnter,
}: {
  position: Vec3;
  art: ArtKey;
  visited: boolean;
  onEnter: () => void;
}) {
  const texture = useTexture(`/art/${art}.png`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const icon = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const armed = useRef(true);
  const color = visited ? "#86efac" : "#fde047";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const d = distance2D(game.hero, position[0], position[2]);
    if (armed.current && d < ENTER_RADIUS && !game.paused) {
      armed.current = false;
      onEnter();
    } else if (!armed.current && d > LEAVE_RADIUS) {
      armed.current = true;
    }
    if (icon.current) icon.current.position.y = (visited ? 2.2 : 2.7) + Math.sin(t * 2 + position[0]) * 0.2;
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
  });

  return (
    <group position={position}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.05}>
        <ringGeometry args={[1.05, 1.35, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <circleGeometry args={[1.05, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {!visited && (
        <mesh position-y={3}>
          <cylinderGeometry args={[0.9, 1.25, 6, 32, 1, true]} />
          <meshBasicMaterial
            color="#fff6b0"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      <group ref={icon}>
        <Billboard>
          <mesh>
            <circleGeometry args={[0.85, 40]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
          <mesh position-z={0.01}>
            <ringGeometry args={[0.85, 0.97, 40]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          <mesh position-z={0.02} scale={visited ? 1 : 1.12}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
          </mesh>
        </Billboard>
      </group>
      {!visited && <Sparkles count={16} scale={[2.4, 4, 2.4]} position={[0, 2, 0]} size={5} speed={0.4} color="#fff7c2" />}
    </group>
  );
}
