"use client";

import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { shuffle } from "@/lib/random";
import { useLazyGenerated } from "@/lib/useLazyGenerated";
import { distance2D, game, startAction, Zone } from "../game";
import { ActionPrompt, MissionProps, Vec3 } from "../types";

/** Places in front of building walls where a fire can start; three are picked each round. */
const FIRE_SPOTS: Vec3[] = [
  [11.6, 0, -4.2],
  [11.6, 0, -11.2],
  [10, 0, -11.9],
  [6.6, 0, -11.9],
  [2, 0, -13.2],
  [-2, 0, -13.8],
  [-11.7, 0, -3.2],
];

function pickFires(): Vec3[] {
  const chosen: Vec3[] = [];
  for (const p of shuffle(FIRE_SPOTS)) {
    if (chosen.every((c) => Math.hypot(c[0] - p[0], c[2] - p[2]) > 5)) chosen.push(p);
    if (chosen.length === 3) break;
  }
  return chosen;
}

// The rescue: a ladder against the tall building at the end of the avenue, a cat on its roof.
export const LADDER_AT: Vec3 = [1.8, 0, -17.2];
export const ROOF_Y = 3.9;
const ROOF: Zone = { minX: -2.4, maxX: 2.4, minZ: -22.4, maxZ: -17.7, y: ROOF_Y };
const LADDER_BASE = new THREE.Vector3(1.8, 0, -16.4);
const LADDER_TOP = new THREE.Vector3(1.8, ROOF_Y, -18.3);
const LADDER_FACE = new THREE.Vector3(1.8, 0, -30);
const CAT_AT = new THREE.Vector3(-1.2, ROOF_Y, -21);
const CLIMB_TIME = 2.2;

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

function meow() {
  sfx.meow();
}

/** A little orange cat, drawn with simple shapes. */
function Cat({ state }: { state: MutableRefObject<{ phase: Phase; carried: boolean; saved: boolean; at: number }> }) {
  const root = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const bubble = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const st = state.current;
    const t = clock.elapsedTime;
    if (st.carried) {
      // Riding on the firefighter's shoulders.
      g.position.set(game.hero.x, game.hero.y + 1.55, game.hero.z);
      g.rotation.y = Math.atan2(game.heroDir.x, game.heroDir.z);
    } else if (st.saved) {
      g.position.set(LADDER_BASE.x - 1.6, Math.abs(Math.sin(t * 5)) * 0.25, LADDER_BASE.z + 0.6);
      g.rotation.y = t * 1.5;
    } else {
      g.position.copy(CAT_AT);
      g.rotation.y = Math.sin(t * 0.7) * 0.6 + 0.4;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 4) * 0.4;
    if (bubble.current) {
      bubble.current.visible = !st.carried;
      bubble.current.position.y = 1.35 + Math.sin(t * 3) * 0.08;
    }
  });
  const fur = <meshStandardMaterial color="#f59e0b" roughness={0.8} />;
  return (
    <group ref={root} position={CAT_AT}>
      <mesh position={[0, 0.35, 0]} rotation-x={Math.PI / 2} castShadow>
        <capsuleGeometry args={[0.22, 0.45, 6, 12]} />
        {fur}
      </mesh>
      <mesh position={[0, 0.62, 0.38]} castShadow>
        <sphereGeometry args={[0.24, 16, 12]} />
        {fur}
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.86, 0.36]} rotation-z={x > 0 ? -0.2 : 0.2}>
          <coneGeometry args={[0.07, 0.16, 8]} />
          {fur}
        </mesh>
      ))}
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.66, 0.6]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0.62]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color="#f472b6" />
      </mesh>
      <mesh ref={tail} position={[0, 0.45, -0.42]} rotation-x={-0.9}>
        <capsuleGeometry args={[0.05, 0.45, 4, 8]} />
        {fur}
      </mesh>
      {[-0.12, 0.12].flatMap((x) =>
        [-0.18, 0.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.1, z]}>
            <capsuleGeometry args={[0.05, 0.12, 4, 8]} />
            {fur}
          </mesh>
        )),
      )}
      <group ref={bubble}>
        <mesh>
          <sphereGeometry args={[0.28, 16, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position-z={0.26}>
          <torusGeometry args={[0.1, 0.035, 8, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
}

type Phase = "ground" | "up" | "roof" | "down";

/** Firefighter mission: three fires at random places, and a cat to bring down from a roof. */
export function FireMission({ onScore, onPrompt }: MissionProps) {
  const [fires] = useLazyGenerated(true, pickFires);
  const health = useRef<number[]>([1, 1, 1]);
  const target = useRef<number | null>(null);
  const shown = useRef<ActionPrompt | null>(null);
  const rescue = useRef<{ phase: Phase; carried: boolean; saved: boolean; at: number }>({ phase: "ground", carried: false, saved: false, at: 0 });
  const nextMeow = useRef(0);

  useFrame(({ clock }, rawDelta) => {
    if (!fires) return;
    const delta = Math.min(rawDelta, 0.1);
    const now = clock.elapsedTime;
    const r = rescue.current;

    // Climbing up or down the ladder: the mission moves the hero.
    if (r.phase === "up" || r.phase === "down") {
      const k = Math.min(1, (now - r.at) / CLIMB_TIME);
      const from = r.phase === "up" ? LADDER_BASE : LADDER_TOP;
      const to = r.phase === "up" ? LADDER_TOP : LADDER_BASE;
      game.hero.lerpVectors(from, to, k);
      if (k >= 1) {
        game.cinematic = false;
        game.action = null;
        if (r.phase === "up") {
          r.phase = "roof";
          game.zone = ROOF;
          game.hero.set(LADDER_TOP.x, ROOF_Y, LADDER_TOP.z - 0.3);
        } else {
          r.phase = "ground";
          game.zone = null;
          game.hero.set(LADDER_BASE.x, 0, LADDER_BASE.z + 0.2);
          if (r.carried) {
            r.carried = false;
            r.saved = true;
            meow();
            sfx.correct();
            startAction("cheer", 1.8);
            onScore();
          }
        }
      }
    }

    // The cat meows now and then until it is safe.
    if (!r.saved && !r.carried && now > nextMeow.current && distance2D(game.hero, CAT_AT.x, CAT_AT.z) < 14) {
      nextMeow.current = now + 6;
      meow();
    }
    if (r.phase === "roof" && !r.carried && !r.saved && distance2D(game.hero, CAT_AT.x, CAT_AT.z) < 1.3) {
      r.carried = true;
      meow();
      sfx.star();
    }

    let nearest = -1;
    let best = REACH;
    if (r.phase === "ground") {
      fires.forEach((p, i) => {
        if (health.current[i] <= 0) return;
        const d = distance2D(game.hero, p[0], p[2]);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });
    }
    const atLadder = r.phase === "ground" && distance2D(game.hero, LADDER_BASE.x, LADDER_BASE.z) < 1.8 && !r.saved;
    const atTop = r.phase === "roof" && distance2D(game.hero, LADDER_TOP.x, LADDER_TOP.z) < 1.6;
    // Standing right at the ladder means "climb", even if a fire burns nearby.
    let want: ActionPrompt | null = atLadder ? "climb" : nearest >= 0 ? "spray" : atTop ? "descend" : null;
    if (game.paused || game.cinematic) want = null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }

    if (game.actionRequest) {
      game.actionRequest = false;
      if (want === "spray") {
        const spot = new THREE.Vector3(...fires[nearest]);
        target.current = nearest;
        game.target = null;
        game.sprayTarget = spot;
        startAction("spray", 1.9, spot);
        sfx.splash();
      } else if (want === "climb" || want === "descend") {
        r.phase = want === "climb" ? "up" : "down";
        r.at = now;
        game.target = null;
        game.cinematic = true;
        game.vy = 0;
        startAction("climb", 60, LADDER_FACE);
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

  if (!fires) return null;
  return (
    <>
      {fires.map((p, i) => (
        <Fire key={i} position={p} index={i} health={health} />
      ))}
      <WaterJet />
      <Cat state={rescue} />
    </>
  );
}
