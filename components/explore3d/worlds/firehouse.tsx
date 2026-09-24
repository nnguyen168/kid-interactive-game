"use client";

import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Vec3 } from "../types";

const RED = "#d62828";
const CHROME = "#d9dee5";

/** Red/blue beacons that blink like a real emergency light bar. */
function Beacon({ position, color, phase }: { position: Vec3; color: string; phase: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const on = Math.sin(clock.elapsedTime * 9 + phase) > 0;
    mat.current.emissiveIntensity = on ? 4 : 0.3;
  });
  return (
    <mesh position={position}>
      <boxGeometry args={[0.55, 0.28, 0.4]} />
      <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
    </mesh>
  );
}

function Wheel({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.45, 24]} />
        <meshStandardMaterial color="#1f2328" roughness={0.9} />
      </mesh>
      <mesh position-y={position[0] > 0 ? 0.24 : -0.24}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
        <meshStandardMaterial color={CHROME} metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** A chunky toy-like fire engine with a ladder and blinking lights. */
export function FireTruck({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const rungs = Array.from({ length: 9 }, (_, i) => -1.9 + i * 0.47);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* body */}
      <RoundedBox args={[2.3, 1.7, 4.2]} radius={0.18} position={[0, 1.45, -0.55]} castShadow receiveShadow>
        <meshStandardMaterial color={RED} roughness={0.35} />
      </RoundedBox>
      {/* cab */}
      <RoundedBox args={[2.3, 2.1, 1.7]} radius={0.25} position={[0, 1.65, 2.25]} castShadow>
        <meshStandardMaterial color={RED} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 2.05, 3.11]}>
        <boxGeometry args={[1.9, 0.85, 0.05]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.4} roughness={0.1} />
      </mesh>
      {[-1.16, 1.16].map((x) => (
        <mesh key={x} position={[x, 2.05, 2.35]}>
          <boxGeometry args={[0.05, 0.75, 1]} />
          <meshStandardMaterial color="#1e3a5f" metalness={0.4} roughness={0.1} />
        </mesh>
      ))}
      {/* white side stripe */}
      {[-1.16, 1.16].map((x) => (
        <mesh key={x} position={[x, 1.2, 0.3]}>
          <boxGeometry args={[0.04, 0.22, 5.6]} />
          <meshStandardMaterial color="#fff7e0" emissive="#fde68a" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* bumper + headlights */}
      <mesh position={[0, 0.7, 3.15]} castShadow>
        <boxGeometry args={[2.4, 0.35, 0.3]} />
        <meshStandardMaterial color={CHROME} metalness={0.8} roughness={0.2} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 1.2, 3.12]}>
          <boxGeometry args={[0.35, 0.25, 0.05]} />
          <meshStandardMaterial color="#fffbe6" emissive="#fff3c4" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      ))}
      {/* ladder */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 2.5, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.12, 4.4]} />
          <meshStandardMaterial color={CHROME} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {rungs.map((z) => (
        <mesh key={z} position={[0, 2.5, z]}>
          <boxGeometry args={[1.1, 0.07, 0.07]} />
          <meshStandardMaterial color={CHROME} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {/* hose reel */}
      <mesh position={[0, 1.45, -2.72]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
      <Beacon position={[-0.55, 2.85, 2.2]} color="#ff2d2d" phase={0} />
      <Beacon position={[0.55, 2.85, 2.2]} color="#2d6bff" phase={Math.PI} />
      <Wheel position={[-1.15, 0.55, 2]} />
      <Wheel position={[1.15, 0.55, 2]} />
      <Wheel position={[-1.15, 0.55, -1.2]} />
      <Wheel position={[1.15, 0.55, -1.2]} />
      <Wheel position={[-1.15, 0.55, -2.3]} />
      <Wheel position={[1.15, 0.55, -2.3]} />
    </group>
  );
}

function GarageDoor({ x }: { x: number }) {
  return (
    <group position={[x, 0, 2.28]}>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[3, 3.6, 0.1]} />
        <meshStandardMaterial color="#eef2f7" roughness={0.5} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.6, 0.06]}>
          <boxGeometry args={[3, 0.05, 0.04]} />
          <meshStandardMaterial color="#b6c0cc" />
        </mesh>
      ))}
      <mesh position={[0, 2.9, 0.07]}>
        <boxGeometry args={[2.4, 0.5, 0.04]} />
        <meshStandardMaterial color="#9fd3ff" metalness={0.3} roughness={0.1} />
      </mesh>
    </group>
  );
}

/** The fire station: red brick hall, two big doors, drill tower with a siren. */
export function FireStation({ position }: { position: Vec3 }) {
  const emblem = useTexture("/art/helmet.png", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  return (
    <group position={position}>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.6, 5.2, 4.5]} />
        <meshStandardMaterial color="#c8432b" roughness={0.85} />
      </mesh>
      {/* brick courses */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.5 + i * 0.6, 2.26]}>
          <boxGeometry args={[8.6, 0.04, 0.02]} />
          <meshStandardMaterial color="#a8341f" />
        </mesh>
      ))}
      <mesh position={[0, 5.35, 0]} castShadow>
        <boxGeometry args={[9.2, 0.35, 5]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[9, 0.2, 4.9]} />
        <meshStandardMaterial color="#e8e2d6" />
      </mesh>
      <GarageDoor x={-2.1} />
      <GarageDoor x={2.1} />
      {/* emblem */}
      <mesh position={[0, 4.45, 2.3]}>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial color="#fff7e0" />
      </mesh>
      <mesh position={[0, 4.45, 2.32]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={emblem} transparent alphaTest={0.05} />
      </mesh>
      {/* drill tower */}
      <group position={[5.6, 0, -0.6]}>
        <mesh position={[0, 4.4, 0]} castShadow>
          <boxGeometry args={[2.4, 8.8, 2.4]} />
          <meshStandardMaterial color="#b83a25" roughness={0.85} />
        </mesh>
        <mesh position={[0, 9, 0]} castShadow>
          <boxGeometry args={[2.8, 0.4, 2.8]} />
          <meshStandardMaterial color="#f4efe6" />
        </mesh>
        {[2.5, 4.5, 6.5].map((y) => (
          <mesh key={y} position={[0, y, 1.22]}>
            <boxGeometry args={[1, 1.2, 0.05]} />
            <meshStandardMaterial color="#9fd3ff" metalness={0.3} roughness={0.1} />
          </mesh>
        ))}
        <Beacon position={[0, 9.4, 0]} color="#ff2d2d" phase={0.7} />
      </group>
    </group>
  );
}

/** A wooden ladder leaning on a wall. */
export function Ladder({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group rotation={[-0.25, 0, 0]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 2.6, 0]} castShadow>
            <boxGeometry args={[0.14, 5.2, 0.14]} />
            <meshStandardMaterial color={CHROME} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[0, 0.4 + i * 0.5, 0]}>
            <boxGeometry args={[0.9, 0.08, 0.08]} />
            <meshStandardMaterial color={CHROME} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
