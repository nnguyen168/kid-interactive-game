"use client";

import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { distance2D, game, startAction } from "../game";
import { ActionPrompt, MissionProps, Vec3 } from "../types";

/** The fires the hero must put out, each in front of a building wall. */
export const FIRES: Vec3[] = [
  [11.6, 0, -5],
  [10, 0, -11.9],
  [-11.7, 0, -3.2],
];

const REACH = 5;
const BURN_TIME = 2.4; // seconds of spraying to put out a fire

const FLAMES = [
  { x: 0, z: 0, r: 0.75, h: 2.6, color: "#e8340c" },
  { x: -0.6, z: 0.25, r: 0.55, h: 1.9, color: "#f04a0a" },
  { x: 0.62, z: 0.2, r: 0.55, h: 2, color: "#f04a0a" },
  { x: 0.1, z: 0.55, r: 0.5, h: 1.5, color: "#ff7a00" },
  { x: 0, z: 0.1, r: 0.45, h: 1.7, color: "#ffab00" },
  { x: -0.3, z: 0.45, r: 0.3, h: 1.1, color: "#ffd000" },
  { x: 0.35, z: 0.45, r: 0.3, h: 1.2, color: "#ffd000" },
];

// The inner, yellow tongues are pushed past 1.0 so they catch the bloom.
const FLAME_COLORS = FLAMES.map((f, i) => new THREE.Color(f.color).multiplyScalar(i >= 4 ? 1.5 : 1));

const SMOKE = 7;

function Fire({ position, index, health }: { position: Vec3; index: number; health: MutableRefObject<number[]> }) {
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const smoke = useRef<(THREE.Mesh | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  const root = useRef<THREE.Group>(null);
  const outAt = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const h = Math.max(0, health.current[index]);
    if (h <= 0 && outAt.current === null) outAt.current = t;

    flames.current.forEach((m, i) => {
      if (!m) return;
      const f = FLAMES[i];
      const flicker = 1 + Math.sin(t * (9 + i * 1.7) + i * 2.1) * 0.12 + Math.sin(t * 23 + i) * 0.06;
      m.scale.set(h, h * flicker, h);
      m.position.y = (f.h * h * flicker) / 2;
      m.visible = h > 0.01;
    });
    if (light.current) light.current.intensity = h * (30 + Math.sin(t * 17) * 6 + Math.sin(t * 7.3) * 5);

    // Dark smoke while burning, then a puff of white steam.
    const steaming = outAt.current !== null ? Math.max(0, 1 - (t - outAt.current) / 2.5) : 0;
    smoke.current.forEach((m, i) => {
      if (!m) return;
      const k = (t * 0.35 + i / SMOKE) % 1;
      const amount = Math.max(h, steaming);
      m.position.set(Math.sin(i * 3.1 + t * 0.6) * 0.5 * k, 2.2 + k * 5, Math.cos(i * 1.7) * 0.3 * k);
      m.scale.setScalar((0.5 + k * 1.3) * (0.4 + 0.6 * amount));
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = (1 - k) * 0.55 * amount;
      mat.color.set(h > 0 ? "#4b4f57" : "#f4f8ff");
      m.visible = amount > 0.01;
    });
    if (root.current) root.current.visible = h > 0 || steaming > 0;
  });

  return (
    <group ref={root} position={position}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[1.3, 24]} />
        <meshStandardMaterial color="#2a2522" transparent opacity={0.65} depthWrite={false} />
      </mesh>
      {FLAMES.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => {
            flames.current[i] = el;
          }}
          position={[f.x, f.h / 2, f.z]}
        >
          <coneGeometry args={[f.r, f.h, 7]} />
          <meshBasicMaterial color={FLAME_COLORS[i]} />
        </mesh>
      ))}
      {Array.from({ length: SMOKE }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            smoke.current[i] = el;
          }}
        >
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#4b4f57" transparent opacity={0.5} depthWrite={false} flatShading />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 1.5, 0.8]} color="#ff8a3d" distance={10} decay={1.6} />
    </group>
  );
}

const DROPS = 80;
const from = new THREE.Vector3();
const to = new THREE.Vector3();
const tmp = new THREE.Object3D();

/** Arcing stream of water droplets from the hero to the fire. */
function WaterJet() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const splash = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < DROPS; i++) {
      tmp.position.set(0, -50, 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const spraying = game.action?.kind === "spray" && game.sprayTarget;
    m.visible = !!spraying;
    if (splash.current) splash.current.visible = !!spraying;
    if (!spraying || !game.sprayTarget) return;
    const t = clock.elapsedTime;
    to.copy(game.sprayTarget).setY(1.2);
    const dir = to.clone().sub(game.hero).setY(0).normalize();
    from.copy(game.hero).addScaledVector(dir, 0.7).setY(1.15);
    const dist = from.distanceTo(to);
    for (let i = 0; i < DROPS; i++) {
      const k = (t * 1.8 + i / DROPS) % 1;
      tmp.position.lerpVectors(from, to, k);
      tmp.position.y += Math.sin(k * Math.PI) * (0.6 + dist * 0.18);
      tmp.position.x += Math.sin(i * 12.9898) * 0.25 * k;
      tmp.position.z += Math.cos(i * 78.233) * 0.25 * k;
      tmp.scale.setScalar(0.15 + k * 0.2);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (splash.current) {
      splash.current.position.copy(to).setY(0.9);
      splash.current.scale.setScalar(0.8 + Math.sin(t * 20) * 0.15);
    }
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, DROPS]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#cdefff" emissive="#58c4ff" emissiveIntensity={0.7} transparent opacity={0.85} roughness={0.1} />
      </instancedMesh>
      <mesh ref={splash} visible={false}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#e6f7ff" emissive="#9ddcff" emissiveIntensity={0.6} transparent opacity={0.55} depthWrite={false} flatShading />
      </mesh>
    </>
  );
}

export function FireMission({ onScore, onPrompt }: MissionProps) {
  const health = useRef<number[]>(FIRES.map(() => 1));
  const target = useRef<number | null>(null);
  const shown = useRef<ActionPrompt | null>(null);
  const targets = useMemo(() => FIRES.map((p) => new THREE.Vector3(...p)), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    let nearest = -1;
    let best = REACH;
    FIRES.forEach((p, i) => {
      if (health.current[i] <= 0) return;
      const d = distance2D(game.hero, p[0], p[2]);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });

    const want: ActionPrompt | null = nearest >= 0 && !game.paused ? "spray" : null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }

    if (game.actionRequest) {
      game.actionRequest = false;
      if (nearest >= 0) {
        target.current = nearest;
        game.target = null;
        game.sprayTarget = targets[nearest];
        startAction("spray", 1.9, targets[nearest]);
        sfx.splash();
      }
    }

    const i = target.current;
    if (i !== null && game.action?.kind === "spray" && health.current[i] > 0) {
      health.current[i] -= delta / BURN_TIME;
      if (health.current[i] <= 0) {
        health.current[i] = 0;
        target.current = null;
        game.sprayTarget = null;
        startAction("cheer", 1.8);
        sfx.correct();
        onScore();
      }
    }
    if (game.action?.kind !== "spray") game.sprayTarget = null;
  });

  return (
    <>
      {FIRES.map((p, i) => (
        <Fire key={i} position={p} index={i} health={health} />
      ))}
      <WaterJet />
    </>
  );
}
