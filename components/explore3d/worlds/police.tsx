"use client";

import { Billboard, RoundedBox, Sparkles, useAnimations, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ArtKey } from "@/lib/art";
import { shuffle } from "@/lib/random";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { useLazyGenerated } from "@/lib/useLazyGenerated";
import { HERO_SCALE } from "../Hero";
import { CITY, MED } from "../Prop";
import { Collider, distance2D, game, resolveCollisions, seeded, startAction } from "../game";
import { dressRobber } from "../outfit";
import { ActionPrompt, MissionProps, Vec3, WorldDef } from "../types";
import { Clouds, collidersOf, Instanced, Path, Placed, Props } from "./common";

const BOUNDS = { minX: -16, maxX: 16, minZ: -15, maxZ: 13 };
const SPAWN: Vec3 = [0, 0, 9];
const STATION_AT: Vec3 = [0, 0, -13];
const CAR_AT: Vec3 = [7, 0, -8.6];
const CAR_SCALE = 4.5;
const FOUNTAIN_AT: Vec3 = [0, 0, 0.5];

/** A robber starts running when the hero comes this close... */
const FLEE_RANGE = 6.5;
/** ...and gives up when the hero is right next to him. */
const CATCH_RANGE = 2.4;
const ROBBER_SPEED = 3.4;
const RUN_TIME = 2.4;
const REST_TIME = 2.2;
const SIREN_TIME = 3.6;

/** What each robber took, as announced in the mission intro. */
const LOOT: { art: ArtKey; say: string }[] = [
  { art: "candy", say: "les bonbons" },
  { art: "teddy", say: "le nounours" },
  { art: "cake", say: "le gâteau" },
];
const BEANIES = ["#dc2626", "#16a34a", "#f97316", "#9333ea"];

/** Places where the robbers may hide (behind bushes and trees); each game picks three. */
const HIDING_SPOTS: Vec3[] = [
  [-11, 0, -3],
  [11.5, 0, -2],
  [-7.5, 0, 5],
  [8, 0, 6],
  [-13, 0, 10],
  [13, 0, 10.5],
  [-12.5, 0, -10.5],
  [13, 0, -12],
  [-3.5, 0, -5.5],
  [14, 0, 3],
];

type RobberState = "hide" | "run" | "rest" | "caught" | "gone";
type Robber = {
  pos: THREE.Vector3;
  yaw: number;
  state: RobberState;
  /** When the current run or rest ends (clock seconds). */
  until: number;
  caughtAt: number;
  /** Small zig-zag so the chase is fun to watch. */
  weave: number;
};

type Patrol = { robbers: Robber[]; sirenUntil: number; seen: number };

/* ---------- the robbers ---------- */

function RobberActor({ index, patrolRef, beanie, loot }: { index: number; patrolRef: React.MutableRefObject<Patrol>; beanie: string; loot: THREE.Texture }) {
  const { scene, animations } = useGLTF("/models/characters/Knight.glb");
  const model = useMemo(() => dressRobber(scene, beanie), [scene, beanie]);
  const { actions } = useAnimations(animations, model);
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const prize = useRef<THREE.Group>(null);
  const current = useRef<string | null>(null);

  useEffect(() => {
    actions.Unarmed_Idle?.reset().play();
    current.current = "Unarmed_Idle";
  }, [actions]);

  useFrame(({ clock }) => {
    const r = patrolRef.current.robbers[index];
    const g = group.current;
    if (!r || !g) return;
    const t = clock.elapsedTime;
    g.visible = r.state !== "gone";
    if (!g.visible) return;
    g.position.set(r.pos.x, 0, r.pos.z);
    g.rotation.y = r.yaw;

    const clip = r.state === "run" ? "Running_A" : r.state === "caught" ? "Cheer" : "Unarmed_Idle";
    if (clip !== current.current) {
      const next = actions[clip];
      const prev = current.current ? actions[current.current] : null;
      next?.reset().fadeIn(0.15).play();
      prev?.fadeOut(0.15);
      current.current = clip;
    }

    const b = body.current;
    if (b) {
      // Peeking out from behind the bush, or shrinking away once caught.
      const e = r.state === "caught" ? t - r.caughtAt : 0;
      b.position.x = r.state === "hide" ? Math.sin(t * 1.3 + index) * 0.25 : 0;
      b.scale.setScalar(e > 2.4 ? Math.max(0.01, 1 - (e - 2.4) / 0.4) : 1);
    }
    const p = prize.current;
    if (p) {
      if (r.state === "caught") {
        // The stolen toy floats up, big and shiny: it is given back!
        const e = Math.min(1, (t - r.caughtAt) / 0.9);
        p.position.set(0, 2.3 + e * 1.2, 0);
        p.scale.setScalar(1 + e * 0.6);
      } else {
        p.position.set(0, 2.3 + Math.sin(t * 2.4 + index) * 0.12, 0);
        p.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={group}>
      <group ref={body}>
        <primitive object={model} scale={HERO_SCALE} />
      </group>
      <group ref={prize}>
        <Billboard>
          <mesh>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial map={loot} color="#ebebeb" transparent alphaTest={0.05} toneMapped={false} />
          </mesh>
        </Billboard>
        <Sparkles count={8} scale={[1, 1, 1]} size={4} speed={0.6} color="#fff7c2" />
      </group>
    </group>
  );
}

function within(x: number, z: number, margin: number) {
  return {
    x: THREE.MathUtils.clamp(x, BOUNDS.minX + margin, BOUNDS.maxX - margin),
    z: THREE.MathUtils.clamp(z, BOUNDS.minZ + margin, BOUNDS.maxZ - margin),
  };
}

/* ---------- the police car and its siren ---------- */

function PoliceCar({ patrolRef }: { patrolRef: React.MutableRefObject<Patrol> }) {
  const red = useRef<THREE.MeshStandardMaterial>(null);
  const blue = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const on = t < patrolRef.current.sirenUntil;
    const flip = Math.sin(t * 14) > 0;
    if (red.current) red.current.emissiveIntensity = on ? (flip ? 5 : 0.3) : 0.6;
    if (blue.current) blue.current.emissiveIntensity = on ? (flip ? 0.3 : 5) : 0.6;
    if (glow.current) {
      glow.current.intensity = on ? 18 : 0;
      glow.current.color.set(flip ? "#ef4444" : "#3b82f6");
    }
  });
  return (
    <group position={CAR_AT} rotation-y={-Math.PI / 2}>
      <group position-y={0.33}>
        <group scale={CAR_SCALE}>
          <PropModel url={CITY("car_police")} />
        </group>
      </group>
      {/* A big chunky light bar, easy to see from the camera. */}
      <group position={[0, 1.95, -0.1]}>
        <mesh position-x={-0.32}>
          <boxGeometry args={[0.55, 0.22, 0.34]} />
          <meshStandardMaterial ref={red} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
        <mesh position-x={0.32}>
          <boxGeometry args={[0.55, 0.22, 0.34]} />
          <meshStandardMaterial ref={blue} color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
        <pointLight ref={glow} position-y={0.6} intensity={0} distance={14} decay={1.4} />
      </group>
    </group>
  );
}

function PropModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const copy = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    return c;
  }, [scene]);
  return <primitive object={copy} />;
}

/* ---------- the mission ---------- */

function PoliceMission({ onScore, onPrompt, world }: MissionProps) {
  const textures = useTexture({ candy: "/art/candy.png", teddy: "/art/teddy.png", cake: "/art/cake.png" }, (loaded) => {
    for (const t of Object.values(loaded as Record<string, THREE.Texture>)) t.colorSpace = THREE.SRGBColorSpace;
  }) as Record<string, THREE.Texture>;
  // Each game: robbers hide in new places and wear new colours.
  const [setup] = useLazyGenerated(true, () => ({ spots: shuffle(HIDING_SPOTS).slice(0, LOOT.length), beanies: shuffle(BEANIES) }));
  const patrol = useRef<Patrol>({ robbers: [], sirenUntil: 0, seen: 0 });
  const shown = useRef<ActionPrompt | null>(null);
  const step = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, rawDelta) => {
    if (!setup) return;
    const t = clock.elapsedTime;
    const dt = Math.min(rawDelta, 0.1);
    const p = patrol.current;
    if (p.robbers.length === 0) {
      p.robbers = setup.spots.map((s, i) => ({
        pos: new THREE.Vector3(s[0], 0, s[2]),
        yaw: Math.atan2(-s[0], -s[2]),
        state: "hide",
        until: 0,
        caughtAt: 0,
        weave: i * 2.1,
      }));
    }
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __police: p });

    const siren = t < p.sirenUntil;
    let nearest: Robber | null = null;
    let nearestD = Infinity;
    p.robbers.forEach((r) => {
      if (r.state === "caught") {
        if (t - r.caughtAt > 2.8) r.state = "gone";
        return;
      }
      if (r.state === "gone") return;
      const d = distance2D(game.hero, r.pos.x, r.pos.z);
      if (d < nearestD) {
        nearest = r;
        nearestD = d;
      }
      if (game.paused) return;

      if (r.state === "hide" && d < FLEE_RANGE && !siren) {
        r.state = "run";
        r.until = t + RUN_TIME;
        p.seen += 1;
        if (p.seen === 1) speak("Un voleur ! Cours, attrape-le !");
        else if (p.seen === 2) speak("Encore un voleur !");
      } else if (r.state === "run" && (d < CATCH_RANGE || t > r.until || siren)) {
        // Out of breath, or too scared of the siren: he stops.
        r.state = "rest";
        r.until = t + (siren ? Math.max(REST_TIME, p.sirenUntil - t) : REST_TIME);
      } else if (r.state === "rest" && t > r.until && d > CATCH_RANGE + 0.3 && d < FLEE_RANGE && !siren) {
        r.state = "run";
        r.until = t + RUN_TIME;
      }

      if (r.state === "run") {
        // Away from the hero, with a little zig-zag.
        const away = Math.atan2(r.pos.x - game.hero.x, r.pos.z - game.hero.z) + Math.sin(t * 2.2 + r.weave) * 0.6;
        step.set(Math.sin(away), 0, Math.cos(away));
        // Slide along the park fence instead of pushing into it.
        if (r.pos.x < BOUNDS.minX + 2.5 && step.x < 0) step.x = 0;
        if (r.pos.x > BOUNDS.maxX - 2.5 && step.x > 0) step.x = 0;
        if (r.pos.z < BOUNDS.minZ + 2.5 && step.z < 0) step.z = 0;
        if (r.pos.z > BOUNDS.maxZ - 2.5 && step.z > 0) step.z = 0;
        if (step.lengthSq() > 0.01) {
          step.normalize();
          r.pos.addScaledVector(step, ROBBER_SPEED * dt);
          r.yaw = Math.atan2(step.x, step.z);
        }
        resolveCollisions(r.pos, 0.5, world.colliders);
        const c = within(r.pos.x, r.pos.z, 1);
        r.pos.x = c.x;
        r.pos.z = c.z;
      } else {
        // Keep an eye on the policeman.
        r.yaw = Math.atan2(game.hero.x - r.pos.x, game.hero.z - r.pos.z);
      }
    });

    const nearCar = distance2D(game.hero, CAR_AT[0], CAR_AT[2]) < 3.6;
    let want: ActionPrompt | null = null;
    if (!game.paused && nearest && nearestD < CATCH_RANGE + 0.4) want = "catch";
    else if (!game.paused && nearCar && !siren) want = "siren";
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }

    if (game.actionRequest) {
      game.actionRequest = false;
      if (want === "catch" && nearest) {
        const r: Robber = nearest;
        const index = p.robbers.indexOf(r);
        r.state = "caught";
        r.caughtAt = t;
        r.yaw = Math.atan2(game.hero.x - r.pos.x, game.hero.z - r.pos.z);
        game.target = null;
        startAction("interact", 1.2, r.pos.clone());
        sfx.correct();
        const left = p.robbers.filter((x) => x.state !== "caught" && x.state !== "gone").length;
        speak(`Attrapé ! Il rend ${LOOT[index].say}.${left > 0 ? ` Encore ${left === 1 ? "un voleur" : "deux voleurs"} !` : ""}`);
        onScore();
      } else if (want === "siren") {
        p.sirenUntil = t + SIREN_TIME;
        game.target = null;
        startAction("interact", 1, new THREE.Vector3(CAR_AT[0], 0, CAR_AT[2]));
        sfx.siren();
        speak("Pin-pon ! Police ! Plus personne ne bouge !");
      }
    }
  });

  if (!setup) return null;
  return (
    <>
      <PoliceCar patrolRef={patrol} />
      {LOOT.map((l, i) => (
        <RobberActor key={i} index={i} patrolRef={patrol} beanie={setup.beanies[i]} loot={textures[l.art]} />
      ))}
    </>
  );
}

/* ---------- the town park and the police station ---------- */

function useSignTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 92px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("POLICE", 256, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function RoofLight({ position }: { position: Vec3 }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.emissiveIntensity = Math.sin(clock.elapsedTime * 6) > 0 ? 4 : 0.4;
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.45, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial ref={mat} color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} toneMapped={false} />
    </mesh>
  );
}

/** The police station: a blue building with a big sign, glass doors and a blinking light. */
function PoliceStation() {
  const sign = useSignTexture();
  const badge = useTexture("/art/police-officer.png", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  return (
    <group position={STATION_AT}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[10.6, 0.2, 5]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 5.2, 4.4]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.45, 0]} castShadow>
        <boxGeometry args={[10.6, 0.4, 5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      {/* sign */}
      <mesh position={[0, 4.45, 2.22]}>
        <boxGeometry args={[4.6, 1.2, 0.1]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      {sign && (
        <mesh position={[0, 4.45, 2.28]}>
          <planeGeometry args={[4.4, 1.1]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      )}
      {/* glass doors */}
      <mesh position={[0, 1.5, 2.22]}>
        <boxGeometry args={[2.4, 2.8, 0.08]} />
        <meshStandardMaterial color="#bfdbfe" metalness={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.5, 2.27]}>
        <boxGeometry args={[0.08, 2.8, 0.04]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      {/* windows */}
      {[-3.6, -2.1, 2.1, 3.6].map((x) => (
        <mesh key={x} position={[x, 2.3, 2.22]}>
          <boxGeometry args={[1.1, 1.3, 0.08]} />
          <meshStandardMaterial color="#dbeafe" metalness={0.3} roughness={0.1} />
        </mesh>
      ))}
      {/* badge emblem */}
      <mesh position={[3.6, 4.1, 2.23]}>
        <circleGeometry args={[0.55, 28]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh position={[3.6, 4.1, 2.25]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial map={badge} transparent alphaTest={0.05} />
      </mesh>
      <RoofLight position={[0, 5.65, 0]} />
      {/* flag pole */}
      <mesh position={[-5.8, 3, 2.4]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 6, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
      </mesh>
      {(["#1d4ed8", "#ffffff", "#ef4444"] as const).map((c, i) => (
        <mesh key={c} position={[-5.5 + i * 0.4, 5.5, 2.4]}>
          <boxGeometry args={[0.4, 0.8, 0.03]} />
          <meshStandardMaterial color={c} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** A round fountain in the middle of the park. */
function Fountain() {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current) water.current.position.y = 0.62 + Math.sin(clock.elapsedTime * 2) * 0.02;
  });
  return (
    <group position={FOUNTAIN_AT}>
      <mesh position-y={0.35} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.1, 0.7, 40]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh ref={water} position-y={0.62}>
        <cylinderGeometry args={[1.75, 1.75, 0.1, 40]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position-y={1.2} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 1.4, 16]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position-y={1.95}>
        <cylinderGeometry args={[0.7, 0.45, 0.2, 24]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <Sparkles count={30} scale={[1.2, 1.6, 1.2]} position={[0, 2.4, 0]} size={5} speed={1.2} color="#e0f2fe" />
    </group>
  );
}

/** A low green hedge that marks the edge of the park. */
function Hedges() {
  const pieces = useMemo(() => {
    const list: { p: Vec3; s: Vec3 }[] = [];
    const w = BOUNDS.maxX - BOUNDS.minX + 3;
    list.push({ p: [0, 0.5, BOUNDS.maxZ + 1.3], s: [w, 1, 1] });
    list.push({ p: [BOUNDS.minX - 1.3, 0.5, 0.5], s: [1, 1, BOUNDS.maxZ - BOUNDS.minZ + 3] });
    list.push({ p: [BOUNDS.maxX + 1.3, 0.5, 0.5], s: [1, 1, BOUNDS.maxZ - BOUNDS.minZ + 3] });
    return list;
  }, []);
  return (
    <>
      {pieces.map((h, i) => (
        <RoundedBox key={i} args={h.s} radius={0.35} position={h.p} castShadow receiveShadow>
          <meshStandardMaterial color="#3f8f3a" roughness={1} />
        </RoundedBox>
      ))}
    </>
  );
}

const C = 2.5;
const rand = seeded(41);

const town: Placed[] = [];
for (let i = -5; i <= 5; i++) {
  if (Math.abs(i) <= 1) continue;
  town.push({ model: CITY(`building_${"ABCDEFGH"[Math.floor(rand() * 8)]}`), position: [i * 5, 0, -21], scale: C });
}
for (const x of [-23, 23]) {
  for (let j = -3; j <= 2; j++) {
    town.push({ model: CITY(`building_${"ABCDEFGH"[Math.floor(rand() * 8)]}`), position: [x, 0, j * 5], rotation: Math.floor(rand() * 4) * (Math.PI / 2), scale: C });
  }
}

/** Bushes next to every hiding spot, between the robber and the middle of the park. */
const BUSHES: Vec3[] = HIDING_SPOTS.map(([x, z]) => {
  const out = Math.hypot(x, z) || 1;
  return [x - (x / out) * 1.5, 0, z - (z / out) * 1.5];
});

/** A round, leafy low-poly bush, big enough for a robber to crouch behind. */
function Bush({ position, seed }: { position: Vec3; seed: number }) {
  const blobs = useMemo(() => {
    const r = seeded(seed);
    return [
      { p: [0, 0.75, 0] as Vec3, s: 1.05 },
      { p: [-0.85, 0.55, 0.1] as Vec3, s: 0.8 },
      { p: [0.85, 0.55, -0.1] as Vec3, s: 0.8 },
      { p: [0.2, 0.5, 0.6] as Vec3, s: 0.7 },
    ].map((b) => ({ ...b, rot: r() * 6, dark: r() > 0.5 }));
  }, [seed]);
  return (
    <group position={position}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} rotation={[b.rot, b.rot * 0.7, 0]} scale={b.s} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={b.dark ? "#2f7d32" : "#43a047"} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const trees: Placed[] = [];
for (const [x, z] of [
  [-14.5, -6], [14.5, -6.5], [-9, 11.5], [9.5, 12], [-15, 4], [15, 3.5], [-6, -2], [6.5, -2.5], [0, 12.5],
] as [number, number][]) {
  trees.push({ model: MED(rand() > 0.5 ? "tree_single_A" : "tree_single_B"), position: [x, 0, z], rotation: rand() * 6, scale: 2.6 + rand() * 0.6, collide: 0.6 });
}
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const d = 30 + rand() * 6;
  trees.push({ model: MED("tree_single_A"), position: [Math.cos(a) * d, 0, Math.sin(a) * d + 6], rotation: rand() * 6, scale: 3 + rand() });
}

const props: Placed[] = [
  { model: CITY("car_police"), position: [-7, 0.33, -8.6], rotation: Math.PI / 2, scale: CAR_SCALE, collide: [2.2, 1.1] },
  { model: CITY("bench"), position: [-3.6, 0, 3.6], rotation: Math.PI / 4, scale: C * 1.3, collide: 0.6 },
  { model: CITY("bench"), position: [3.8, 0, 3.4], rotation: -Math.PI / 4, scale: C * 1.3, collide: 0.6 },
  { model: CITY("bench"), position: [-10, 0, 1.5], rotation: Math.PI / 2, scale: C * 1.3, collide: 0.6 },
  { model: CITY("streetlight"), position: [-4.5, 0, -6.5], scale: C, collide: 0.2 },
  { model: CITY("streetlight"), position: [4.5, 0, 7], rotation: Math.PI, scale: C, collide: 0.2 },
  { model: CITY("streetlight"), position: [-5, 0, 8], rotation: Math.PI, scale: C, collide: 0.2 },
  { model: CITY("trash_A"), position: [2.5, 0, 6.2], scale: C },
  { model: CITY("firehydrant"), position: [11.5, 0, -8], scale: C, collide: 0.3 },
  { model: CITY("trafficlight_A"), position: [-11.5, 0, -8], scale: C, collide: 0.25 },
];

function PoliceScene() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#7cc363" roughness={1} />
      </mesh>
      {/* the street and car park in front of the station */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -8.8]} receiveShadow>
        <planeGeometry args={[34, 4.4]} />
        <meshStandardMaterial color="#64748b" roughness={1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[-16 + i * 4, 0.02, -8.8]}>
          <planeGeometry args={[1.8, 0.18]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -21]} receiveShadow>
        <planeGeometry args={[60, 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={1} />
      </mesh>
      <Path points={[[0, 14], [0, 6], [0, 3]]} width={2.6} />
      <Path points={[[0, -2], [0, -6.5]]} width={2.6} />
      <Path points={[[-15, 1], [-8, 0.5], [-2.6, 0.5]]} width={2.4} />
      <Path points={[[2.6, 0.5], [8, 0.5], [15, 1]]} width={2.4} />
      <mesh rotation-x={-Math.PI / 2} position={[FOUNTAIN_AT[0], 0.018, FOUNTAIN_AT[2]]} receiveShadow>
        <ringGeometry args={[2, 3.4, 48]} />
        <meshStandardMaterial color="#e2c48b" roughness={1} />
      </mesh>
      <PoliceStation />
      <Fountain />
      <Hedges />
      <Instanced items={town} />
      <Instanced items={trees} />
      {BUSHES.map((b, i) => (
        <Bush key={i} position={b} seed={i + 3} />
      ))}
      <Props items={props} />
      <Clouds seed={29} height={24} />
    </>
  );
}

const COLLIDERS: Collider[] = [
  { x: STATION_AT[0], z: STATION_AT[2], hw: 5.2, hd: 2.4 },
  { x: CAR_AT[0], z: CAR_AT[2], hw: 2.2, hd: 1.1 },
  { x: FOUNTAIN_AT[0], z: FOUNTAIN_AT[2], r: 2.1 },
  ...collidersOf(trees.filter((t) => t.collide)),
  ...collidersOf(props),
];

export const policePark: WorldDef = {
  spawn: SPAWN,
  bounds: { kind: "rect", ...BOUNDS },
  colliders: COLLIDERS,
  stars: [],
  spots: {
    dixsept: [-3.5, 0, -9.8],
    uniforme: [-12, 0, 3],
    voiture: [11, 0, -6.2],
    chien: [-4, 0, 11.5],
  },
  sky: { top: "#4b8fe0", horizon: "#e0f2fe", fog: "#dbeafe", fogNear: 45, fogFar: 140 },
  camera: { height: 8.5, distance: 11.5 },
  Scene: PoliceScene,
  Mission: PoliceMission,
};
