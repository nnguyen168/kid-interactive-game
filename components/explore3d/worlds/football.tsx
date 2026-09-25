"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { pick } from "@/lib/random";
import { HERO_RADIUS, HERO_SCALE } from "../Hero";
import { distance2D, game, startAction } from "../game";
import { dressHero } from "../outfit";
import { ActionPrompt, MissionProps, Vec3 } from "../types";

export const GOAL_LINE = -16;
export const GOAL_HALF = 3.6;
export const BALL_BAG_AT: Vec3 = [10.2, 0, 9];

/** Shared between the mission and the crowd so fans jump when a goal goes in. */
export const stadiumFx = { cheerUntil: 0, waveAt: 0 };

const R = 0.42;
const WALL_X = 12.2;
const WALL_Z = 17.4;
const NET_BACK = GOAL_LINE - 1.6;
const KICK_REACH = 2.4;
const KEEPER_SWAY = 2.3;

function makeBallGeometry() {
  // Truncated-icosahedron look: colour the corner triangles of a subdivided icosahedron black.
  const g = new THREE.IcosahedronGeometry(R, 2);
  const phi = (1 + Math.sqrt(5)) / 2;
  const corners = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  const pos = g.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let tri = 0; tri < pos.count; tri += 3) {
    let dark = false;
    for (let k = 0; k < 3 && !dark; k++) {
      v.fromBufferAttribute(pos, tri + k).normalize();
      dark = corners.some((c) => c.distanceTo(v) < 1e-3);
    }
    const c = dark ? 0.08 : 0.97;
    for (let k = 0; k < 3; k++) colors.set([c, c, c], (tri + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

const KEEPER_PAINT = {
  Knight_Body: "#facc15",
  Knight_ArmLeft: "#facc15",
  Knight_ArmRight: "#facc15",
  Knight_LegLeft: "#111827",
  Knight_LegRight: "#111827",
};

/** Live match state shared by the ball, the keeper and the big screen. */
type Match = {
  goals: number;
  keeperX: number;
  /** Extra reach while the keeper is lying on the grass after a dive. */
  reach: number;
  dive: { start: number; dir: number; fromX: number } | null;
  lastSaved: boolean;
  /** Big-screen message and when it ends (clock seconds). */
  flash: { text: string; until: number } | null;
};

const DIVE_OUT = 0.35;
const DIVE_LIE = 1.1;
const DIVE_END = 1.8;

function Keeper({ matchRef }: { matchRef: React.MutableRefObject<Match> }) {
  const { scene, animations } = useGLTF("/models/characters/Knight.glb");
  const model = useMemo(() => dressHero(scene, "foot", KEEPER_PAINT), [scene]);
  const { actions } = useAnimations(animations, model);
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  useEffect(() => {
    actions.Unarmed_Idle?.reset().play();
  }, [actions]);
  useFrame(({ clock }) => {
    const m = matchRef.current;
    const t = clock.elapsedTime;
    const sway = Math.sin(t * 0.8) * KEEPER_SWAY;
    let x = sway;
    let tilt = 0;
    let lift = 0;
    const dive = m.dive;
    if (dive && t >= dive.start) {
      const e = t - dive.start;
      const landX = THREE.MathUtils.clamp(dive.fromX + dive.dir * 2.6, -GOAL_HALF, GOAL_HALF);
      if (e < DIVE_OUT) {
        // Leap sideways.
        const a = e / DIVE_OUT;
        x = THREE.MathUtils.lerp(dive.fromX, landX, 1 - (1 - a) * (1 - a));
        tilt = a;
        lift = Math.sin(a * Math.PI) * 0.7;
      } else if (e < DIVE_LIE) {
        x = landX;
        tilt = 1;
      } else if (e < DIVE_END) {
        // Get up and walk back to the middle.
        const a = (e - DIVE_LIE) / (DIVE_END - DIVE_LIE);
        x = THREE.MathUtils.lerp(landX, sway, a);
        tilt = 1 - a;
      } else {
        m.dive = null;
      }
      if (m.dive) x = THREE.MathUtils.clamp(x, -GOAL_HALF, GOAL_HALF);
    } else if (dive) {
      x = dive.fromX;
    }
    m.keeperX = x;
    m.reach = tilt;
    if (ref.current) {
      ref.current.position.x = x;
      ref.current.position.y = lift;
    }
    if (body.current) body.current.rotation.z = -(dive?.dir ?? 0) * tilt * 1.35;
  });
  return (
    <group ref={ref} position={[0, 0, GOAL_LINE + 0.6]}>
      <group ref={body} position-y={0.4}>
        <primitive object={model} scale={HERO_SCALE} position-y={-0.4} />
      </group>
    </group>
  );
}

/** The giant stadium screen: goal count, and a flashing message after a goal or a save. */
function Jumbotron({ matchRef }: { matchRef: React.MutableRefObject<Match> }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 360;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const last = useRef("");
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const m = matchRef.current;
    const t = clock.elapsedTime;
    const flashing = m.flash && t < m.flash.until ? m.flash.text : null;
    const blink = flashing ? Math.floor(t * 5) % 4 : 0;
    const key = `${m.goals}|${flashing}|${blink}`;
    if (key === last.current) return;
    last.current = key;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b1437";
    ctx.fillRect(0, 0, 1024, 360);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (flashing) {
      const colors = ["#facc15", "#f97316", "#22c55e", "#38bdf8"];
      ctx.fillStyle = colors[blink];
      ctx.font = "bold 170px system-ui, sans-serif";
      ctx.fillText(flashing, 512, 190);
    } else {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 56px system-ui, sans-serif";
      ctx.fillText("LOUKAS FC", 512, 64);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 140px system-ui, sans-serif";
      ctx.fillText(`BUTS : ${m.goals}`, 512, 196);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < m.goals ? "#facc15" : "#334155";
        ctx.beginPath();
        ctx.arc(422 + i * 90, 310, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (screen.current?.map) screen.current.map.needsUpdate = true;
  });
  return (
    // A wide LED screen right behind the goal, framed by the net from the player's view.
    <group position={[0, 2.9, -19.3]}>
      <mesh position-z={-0.3} castShadow>
        <boxGeometry args={[11.4, 4.2, 0.5]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh>
        <planeGeometry args={[10.8, 3.8]} />
        <meshBasicMaterial ref={screen} map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Bursts over the penalty area, low enough to be seen from the player's camera.
const FIREWORKS = [
  { at: 0.1, x: -6, y: 6, z: -13, color: "#f472b6" },
  { at: 0.5, x: 6, y: 6.5, z: -13, color: "#facc15" },
  { at: 0.9, x: 0, y: 7, z: -15, color: "#38bdf8" },
  { at: 1.3, x: -9, y: 5.5, z: -7, color: "#4ade80" },
  { at: 1.7, x: 9, y: 5.5, z: -7, color: "#fb923c" },
];
const SPARKS = 48;

/** Fireworks over the stands after each goal. */
function Fireworks({ goalAt }: { goalAt: React.MutableRefObject<number | null> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const dirs = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        // Evenly spread directions on a sphere (golden spiral).
        const y = 1 - (i / (SPARKS - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const a = i * 2.39996;
        return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      }),
    [],
  );
  const popped = useRef<number[]>([]);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    FIREWORKS.forEach((f, b) => {
      for (let i = 0; i < SPARKS; i++) m.setColorAt(b * SPARKS + i, c.set(f.color).multiplyScalar(2.2));
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const start = goalAt.current;
    const t = start === null ? 99 : clock.elapsedTime - start;
    m.visible = t < 4;
    if (!m.visible) {
      popped.current = [];
      return;
    }
    FIREWORKS.forEach((f, b) => {
      const e = t - f.at;
      if (e > 0 && !popped.current.includes(b)) {
        popped.current.push(b);
        sfx.pop();
      }
      for (let i = 0; i < SPARKS; i++) {
        if (e <= 0 || e > 1.8) tmp.scale.setScalar(0.0001);
        else {
          const d = dirs[i];
          const spread = 3.6 * (1 - Math.exp(-e * 3));
          tmp.position.set(f.x + d.x * spread, f.y + d.y * spread - 1.5 * e * e, f.z + d.z * spread);
          tmp.scale.setScalar(0.18 * (1 - e / 1.8));
        }
        tmp.updateMatrix();
        m.setMatrixAt(b * SPARKS + i, tmp.matrix);
      }
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, FIREWORKS.length * SPARKS]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

const TRAIL = 22;

/** A rainbow trail behind the ball when it flies fast. */
function BallTrail({ pos, vel }: { pos: React.MutableRefObject<THREE.Vector3>; vel: React.MutableRefObject<THREE.Vector3> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const points = useRef(Array.from({ length: TRAIL }, () => new THREE.Vector3(0, -50, 0)));
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const strength = useRef(0);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    for (let i = 0; i < TRAIL; i++) m.setColorAt(i, c.setHSL(i / TRAIL, 0.9, 0.6).multiplyScalar(1.4));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const fast = Math.hypot(vel.current.x, vel.current.z) > 8;
    strength.current = THREE.MathUtils.clamp(strength.current + (fast ? 4 : -2.5) * Math.min(delta, 0.1), 0, 1);
    const pts = points.current;
    pts.pop();
    pts.unshift(pts.length ? pos.current.clone() : new THREE.Vector3());
    pts.forEach((p, i) => {
      tmp.position.copy(p);
      tmp.scale.setScalar(R * 0.85 * (1 - i / TRAIL) * strength.current + 0.0001);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, TRAIL]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  );
}

/** Where the ball comes back after a goal: the centre spot, the wings, the penalty area... */
const RESTARTS: [number, number][] = [
  [0, 0],
  [-6, 3],
  [6, 3],
  [0, 7],
  [-4, -5],
  [4, -5],
  [-8, -9],
  [8, -9],
];
const GOAL_CHEERS = ["But ! Bravo Loukas !", "Quel but magnifique !", "Buuut ! Le stade est en folie !", "Superbe tir, champion !"];

const CONFETTI = 160;
const CONFETTI_COLORS = ["#facc15", "#ef4444", "#3b82f6", "#22c55e", "#ffffff", "#a855f7"];

/** Burst of confetti over the goal. */
function GoalConfetti({ goalAt }: { goalAt: React.MutableRefObject<number | null> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: CONFETTI }, (_, i) => ({
        vx: Math.sin(i * 12.9898) * 7,
        vy: 9 + ((i * 7) % 11),
        vz: Math.cos(i * 78.233) * 4 + 3,
        spin: 3 + (i % 7),
      })),
    [],
  );
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const color = new THREE.Color();
    for (let i = 0; i < CONFETTI; i++) m.setColorAt(i, color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const start = goalAt.current;
    const t = start === null ? 99 : clock.elapsedTime - start;
    m.visible = t < 3.5;
    if (!m.visible) return;
    seeds.forEach((s, i) => {
      tmp.position.set(s.vx * t, 2 + s.vy * t - 6 * t * t, GOAL_LINE + 1 + s.vz * t * 0.6);
      if (tmp.position.y < 0.05) tmp.position.y = 0.05;
      tmp.rotation.set(t * s.spin, t * s.spin * 0.7, 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]} frustumCulled={false}>
      <planeGeometry args={[0.28, 0.16]} />
      <meshStandardMaterial side={THREE.DoubleSide} emissive="#ffffff" emissiveIntensity={0.2} />
    </instancedMesh>
  );
}

const toGoal = new THREE.Vector3();
const push = new THREE.Vector3();

export function FootballMission({ onScore, onPrompt }: MissionProps) {
  const geometry = useMemo(() => makeBallGeometry(), []);
  const ball = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(0, R, 2));
  const vel = useRef(new THREE.Vector3());
  const scoredAt = useRef<number | null>(null);
  const goalAt = useRef<number | null>(null);
  const kickAt = useRef<number | null>(null);
  const match = useRef<Match>({ goals: 0, keeperX: 0, reach: 0, dive: null, lastSaved: false, flash: null });
  const shown = useRef<ActionPrompt | null>(null);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const now = clock.elapsedTime;
    const p = pos.current;
    const v = vel.current;

    // After a goal, the ball drops back in somewhere new.
    if (scoredAt.current !== null && now - scoredAt.current > 2.4) {
      scoredAt.current = null;
      const [rx, rz] = pick(RESTARTS);
      p.set(rx, 7, rz);
      v.set(0, 0, 0);
    }

    // Dribbling: the hero nudges the ball when running into it.
    const d = distance2D(game.hero, p.x, p.z);
    const min = HERO_RADIUS + R;
    if (scoredAt.current === null && d < min && p.y < 1) {
      push.set(p.x - game.hero.x, 0, p.z - game.hero.z).normalize();
      p.x = game.hero.x + push.x * min;
      p.z = game.hero.z + push.z * min;
      const along = v.x * push.x + v.z * push.z;
      const speed = Math.max(along, game.moving ? 7.2 : 2.5);
      v.x = push.x * speed;
      v.z = push.z * speed;
    }

    // Near the stands, the footballer can wave to the fans and start a Mexican wave.
    const nearFans = Math.abs(game.hero.x) > 9.5 || game.hero.z > 14.5;
    let want: ActionPrompt | null = scoredAt.current === null && d < KICK_REACH ? "kick" : nearFans ? "wave" : null;
    if (game.paused) want = null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }

    if (game.actionRequest) {
      game.actionRequest = false;
      if (want === "kick") {
        game.target = null;
        startAction("kick", 0.75, p.clone());
        kickAt.current = now + 0.28;
      } else if (want === "wave" && !game.action) {
        game.target = null;
        startAction("cheer", 1.6);
        stadiumFx.waveAt = performance.now();
        sfx.cheer();
      }
    }
    if (kickAt.current !== null && now >= kickAt.current) {
      kickAt.current = null;
      // Friendly aim assist: shoot for the side of the goal the keeper is not guarding.
      const mt = match.current;
      const aimX = mt.keeperX > 0 ? -GOAL_HALF * 0.55 : GOAL_HALF * 0.55;
      // The keeper dives. Usually the wrong way; now and then he saves it (never the first goal, never twice in a row).
      const shotOnGoal = p.z < 4 && Math.abs(p.x) < 10;
      if (shotOnGoal && !mt.dive) {
        const save = mt.goals > 0 && !mt.lastSaved && Math.random() < 0.3;
        mt.dive = { start: now + 0.12, dir: save ? Math.sign(aimX) : -Math.sign(aimX), fromX: mt.keeperX };
        mt.lastSaved = false;
      }
      toGoal.set(aimX - p.x, 0, GOAL_LINE - 0.8 - p.z).normalize();
      push.set(p.x - game.hero.x, 0, p.z - game.hero.z).normalize();
      toGoal.multiplyScalar(0.8).addScaledVector(push, 0.2).normalize();
      v.set(toGoal.x * 17, 4.5, toGoal.z * 17);
      sfx.kick();
    }

    // Integrate.
    p.addScaledVector(v, dt);
    v.y -= 22 * dt;
    if (p.y < R) {
      p.y = R;
      v.y = Math.abs(v.y) > 1.5 ? -v.y * 0.45 : 0;
    }
    const friction = Math.exp(-(p.y > R + 0.01 ? 0.2 : 1.1) * dt);
    v.x *= friction;
    v.z *= friction;

    const inGoal = p.z < GOAL_LINE && Math.abs(p.x) < GOAL_HALF - R;
    if (inGoal) {
      if (scoredAt.current === null) {
        scoredAt.current = now;
        goalAt.current = now;
        const mt = match.current;
        mt.goals += 1;
        mt.flash = { text: "BUT !!!", until: now + 3 };
        stadiumFx.cheerUntil = performance.now() + 2600;
        stadiumFx.waveAt = performance.now() + 600;
        sfx.cheer();
        sfx.fanfare();
        speak(pick(GOAL_CHEERS));
        startAction("cheer", 2);
        onScore();
      }
      if (p.z < NET_BACK + R) {
        p.z = NET_BACK + R;
        v.z = Math.abs(v.z) * 0.2;
      }
      if (Math.abs(p.x) > GOAL_HALF - R) {
        p.x = Math.sign(p.x) * (GOAL_HALF - R);
        v.x *= -0.3;
      }
    } else {
      if (Math.abs(p.x) > WALL_X - R) {
        p.x = Math.sign(p.x) * (WALL_X - R);
        v.x *= -0.7;
      }
      if (p.z > WALL_Z - R) {
        p.z = WALL_Z - R;
        v.z *= -0.7;
      }
      if (p.z < GOAL_LINE - 1.2) {
        p.z = GOAL_LINE - 1.2;
        v.z = Math.abs(v.z) * 0.7;
      }
      // Goalposts and keeper bounce the ball back into play.
      const mt = match.current;
      const lying = mt.dive ? mt.reach : 0;
      const keeperCx = mt.keeperX + (mt.dive?.dir ?? 0) * 0.6 * lying;
      for (const [cx, cz, cr, isKeeper] of [
        [-GOAL_HALF, GOAL_LINE, 0.15, 0],
        [GOAL_HALF, GOAL_LINE, 0.15, 0],
        [keeperCx, GOAL_LINE + 0.6, 0.55 + 0.45 * lying, 1],
      ]) {
        const dx = p.x - cx;
        const dz = p.z - cz;
        const dd = Math.hypot(dx, dz);
        if (dd < cr + R && dd > 0.0001 && p.y < 2) {
          p.x = cx + (dx / dd) * (cr + R);
          p.z = cz + (dz / dd) * (cr + R);
          const vn = (v.x * dx + v.z * dz) / dd;
          if (isKeeper && vn < -6 && !mt.lastSaved && mt.dive) {
            // A real save!
            mt.lastSaved = true;
            mt.flash = { text: "ARRÊT !", until: now + 2 };
            sfx.kick();
            speak("Arrêt du gardien ! Essaie encore !");
          }
          if (vn < 0) {
            v.x -= (1.7 * vn * dx) / dd;
            v.z -= (1.7 * vn * dz) / dd;
          }
        }
      }
    }

    const m = ball.current;
    if (m) {
      const step = Math.hypot(v.x, v.z) * dt;
      if (step > 0) {
        const axis = new THREE.Vector3(v.z, 0, -v.x).normalize();
        m.rotateOnWorldAxis(axis, step / R);
      }
      m.position.copy(p);
    }
    if (shadow.current) {
      shadow.current.position.set(p.x, 0.03, p.z);
      shadow.current.scale.setScalar(Math.max(0.4, 1 - (p.y - R) * 0.15));
    }
  });

  return (
    <>
      <mesh ref={ball} geometry={geometry} castShadow position={[0, R, 2]}>
        <meshStandardMaterial vertexColors roughness={0.35} />
      </mesh>
      <mesh ref={shadow} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[R * 1.1, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <BallTrail pos={pos} vel={vel} />
      <Keeper matchRef={match} />
      <GoalConfetti goalAt={goalAt} />
      <Fireworks goalAt={goalAt} />
      <Jumbotron matchRef={match} />
    </>
  );
}
