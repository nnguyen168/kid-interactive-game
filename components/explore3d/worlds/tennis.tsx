"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { shuffle } from "@/lib/random";
import { distance2D, game, seeded, startAction } from "../game";
import { ActionPrompt, MissionProps, Vec3, WorldDef } from "../types";
import { Clouds } from "./common";

// Court: x across, z along; the net is at z = 0 and the hero plays from the near (+z) side.
const HALF_W = 5.5;
const HALF_L = 12;
const NET_H = 1.05;
const MACHINE_AT: Vec3 = [0, 0, -11.5];
const TARGET_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#a855f7", "#14b8a6"];
const TARGETS: Vec3[] = [
  [-3.6, 0, -4],
  [3.6, 0, -4.5],
  [0, 0, -7],
  [-3.8, 0, -9.5],
  [3.8, 0, -9.5],
];
const POINT_NAMES = ["Quinze !", "Trente !", "Quarante !", "Jeu !", "Jeu, set et match !"];
const SCREEN_TEXT = ["15", "30", "40", "JEU !", "MATCH !"];

const HIT_REACH = 3;
/** A swing this early (seconds before the ball reaches the racket) still counts: generous for little players. */
const EARLY_OK = 0.5;
const SWING_DELAY = 0.15;

function Line({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[x, 0.025, z]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#ffffff" roughness={0.7} />
    </mesh>
  );
}

function Court() {
  const t = 0.12;
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#15803d" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow>
        <planeGeometry args={[HALF_W * 2 + 7, HALF_L * 2 + 9]} />
        <meshStandardMaterial color="#c2551f" roughness={1} />
      </mesh>
      {/* singles court lines */}
      <Line x={0} z={-HALF_L} w={HALF_W * 2} d={t} />
      <Line x={0} z={HALF_L} w={HALF_W * 2} d={t} />
      <Line x={-HALF_W} z={0} w={t} d={HALF_L * 2} />
      <Line x={HALF_W} z={0} w={t} d={HALF_L * 2} />
      <Line x={0} z={-6.4} w={HALF_W * 2} d={t} />
      <Line x={0} z={6.4} w={HALF_W * 2} d={t} />
      <Line x={0} z={0} w={t} d={12.8} />
    </>
  );
}

function Net() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "rgba(15,23,42,0.85)";
      ctx.lineWidth = 2;
      for (let x = 0; x <= 512; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 64);
        ctx.stroke();
      }
      for (let y = 0; y <= 64; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  return (
    <group>
      <mesh position-y={NET_H / 2 + 0.05}>
        <planeGeometry args={[HALF_W * 2 + 1.6, NET_H]} />
        <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position-y={NET_H + 0.06}>
        <boxGeometry args={[HALF_W * 2 + 1.6, 0.1, 0.06]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (HALF_W + 0.8), 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.2, 10]} />
          <meshStandardMaterial color="#14532d" />
        </mesh>
      ))}
    </group>
  );
}

function UmpireChair() {
  return (
    <group position={[HALF_W + 2.2, 0, 0]}>
      {[-0.5, 0.5].flatMap((x) =>
        [-0.5, 0.5].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.2, z]} castShadow>
            <boxGeometry args={[0.1, 2.4, 0.1]} />
            <meshStandardMaterial color="#14532d" />
          </mesh>
        )),
      )}
      <mesh position-y={2.45} castShadow>
        <boxGeometry args={[1.2, 0.12, 1.2]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      <mesh position={[0.5, 3, 0]} castShadow>
        <boxGeometry args={[0.12, 1, 1.2]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      <mesh position={[-0.2, 3.4, 0]} castShadow>
        <boxGeometry args={[1.4, 0.06, 1.6]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

/** Two long stands full of fans along the sides of the court. */
function Stands() {
  const fans = useRef<THREE.InstancedMesh>(null);
  const seats = useMemo(() => {
    const rand = seeded(12);
    const list: { x: number; z: number; y: number; ry: number; phase: number; color: THREE.Color }[] = [];
    for (const side of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        for (let k = 0; k < 26; k++) {
          if (rand() < 0.15) continue;
          list.push({
            x: side * (HALF_W + 5 + row * 1.2),
            z: -15 + k * 1.2,
            y: 0.9 + row * 0.8,
            ry: side < 0 ? Math.PI / 2 : -Math.PI / 2,
            phase: rand() * 6,
            color: new THREE.Color(["#f8fafc", "#facc15", "#16a34a", "#2563eb", "#ef4444", "#f97316"][Math.floor(rand() * 6)]),
          });
        }
      }
    }
    return list;
  }, []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    seats.forEach((s, i) => fans.current?.setColorAt(i, s.color));
    if (fans.current?.instanceColor) fans.current.instanceColor.needsUpdate = true;
  }, [seats]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cheering = performance.now() < tennisFx.cheerUntil;
    seats.forEach((s, i) => {
      // Spectators follow the ball with their heads... here, their whole bodies sway.
      const bob = cheering ? Math.abs(Math.sin(t * 9 + s.phase)) * 0.5 : Math.max(0, Math.sin(t * 1.5 + s.phase)) * 0.05;
      tmp.position.set(s.x, s.y + 0.45 + bob, s.z);
      tmp.rotation.set(0, s.ry + Math.sin(t * 0.8) * 0.15, 0);
      tmp.updateMatrix();
      fans.current?.setMatrixAt(i, tmp.matrix);
    });
    if (fans.current) fans.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      {[-1, 1].map((side) =>
        [0, 1, 2, 3].map((row) => (
          <mesh key={`${side}${row}`} position={[side * (HALF_W + 5 + row * 1.2), 0.45 + row * 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.9 + row * 0.8, 32]} />
            <meshStandardMaterial color={row % 2 ? "#166534" : "#15803d"} />
          </mesh>
        )),
      )}
      <instancedMesh ref={fans} args={[undefined, undefined, seats.length]} castShadow frustumCulled={false}>
        <capsuleGeometry args={[0.26, 0.4, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </>
  );
}

function Hedges() {
  return (
    <>
      <mesh position={[0, 1.2, -HALF_L - 4.5]} castShadow receiveShadow>
        <boxGeometry args={[30, 2.4, 1]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>
      <mesh position={[0, 1.2, HALF_L + 4.5]} castShadow receiveShadow>
        <boxGeometry args={[30, 2.4, 1]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>
    </>
  );
}

/** Shared between the mission and the crowd. */
const tennisFx = { cheerUntil: 0 };

function Scoreboard({ scoreRef }: { scoreRef: React.MutableRefObject<{ points: number; flashUntil: number }> }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 300;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  const last = useRef("");
  useFrame(({ clock }) => {
    const { points, flashUntil } = scoreRef.current;
    const flash = clock.elapsedTime < flashUntil;
    const blink = flash ? Math.floor(clock.elapsedTime * 5) % 2 : 0;
    const key = `${points}|${blink}|${flash}`;
    if (key === last.current) return;
    last.current = key;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#14532d";
    ctx.fillRect(0, 0, 1024, 300);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#bef264";
    ctx.font = "bold 54px system-ui, sans-serif";
    ctx.fillText("LOUKAS", 512, 60);
    ctx.fillStyle = flash && blink ? "#facc15" : "#ffffff";
    ctx.font = "bold 150px system-ui, sans-serif";
    ctx.fillText(points === 0 ? "0" : SCREEN_TEXT[points - 1], 512, 190);
    if (screen.current?.map) screen.current.map.needsUpdate = true;
  });
  return (
    <group position={[0, 3.6, -HALF_L - 4.2]}>
      <mesh position-z={-0.2}>
        <boxGeometry args={[9, 2.9, 0.3]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh>
        <planeGeometry args={[8.6, 2.5]} />
        <meshBasicMaterial ref={screen} map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function BallMachine({ firedAt }: { firedAt: React.MutableRefObject<number> }) {
  const tube = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!tube.current) return;
    const e = clock.elapsedTime - firedAt.current;
    tube.current.position.z = e < 0.25 ? -Math.sin((e / 0.25) * Math.PI) * 0.25 : 0;
  });
  return (
    <group position={MACHINE_AT}>
      <mesh position-y={0.7} castShadow>
        <boxGeometry args={[1.4, 1, 1.2]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} />
      </mesh>
      <mesh position-y={1.45}>
        <cylinderGeometry args={[0.65, 0.45, 0.6, 20, 1, true]} />
        <meshStandardMaterial color="#1e3a8a" side={THREE.DoubleSide} />
      </mesh>
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 1.55, (i - 1) * 0.15]}>
          <sphereGeometry args={[0.13, 12, 10]} />
          <meshStandardMaterial color="#d9f99d" emissive="#a3e635" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <group ref={tube} position={[0, 1, 0.6]}>
        <mesh rotation-x={Math.PI / 2 - 0.3}>
          <cylinderGeometry args={[0.18, 0.2, 0.8, 16]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      </group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 14]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

function Target({ position, color, index, hits }: { position: Vec3; color: string; index: number; hits: React.MutableRefObject<number[]> }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const hitAt = hits.current[index];
    const t = clock.elapsedTime;
    if (hitAt > 0) {
      const e = t - hitAt;
      g.current.scale.setScalar(Math.max(0.001, 1 + e * 2 - e * e * 6));
      g.current.visible = e < 0.6;
      g.current.position.y = e * 2;
    } else {
      g.current.position.y = 0;
      g.current.scale.setScalar(1 + Math.sin(t * 3 + position[0]) * 0.04);
    }
  });
  return (
    <group position={position}>
      <group ref={g}>
        {[1.2, 0.8, 0.4].map((r, i) => (
          <mesh key={r} rotation-x={-Math.PI / 2} position-y={0.03 + i * 0.005}>
            <circleGeometry args={[r, 40]} />
            <meshStandardMaterial color={i % 2 ? "#ffffff" : color} emissive={i % 2 ? "#000000" : color} emissiveIntensity={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0.35, 1.6, 0]}>
          <planeGeometry args={[0.7, 0.45]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

type Ball =
  | { phase: "idle" }
  | { phase: "in"; start: number; from: THREE.Vector3; bounce: THREE.Vector3; hit: THREE.Vector3 }
  | { phase: "out"; start: number; from: THREE.Vector3; to: THREE.Vector3; target: number; dur: number }
  | { phase: "miss"; start: number; pos: THREE.Vector3; vel: THREE.Vector3 };

const IN_1 = 1.3; // machine -> bounce
const IN_2 = 0.6; // bounce -> racket height
const arc = (a: THREE.Vector3, b: THREE.Vector3, k: number, h: number, out: THREE.Vector3) =>
  out.lerpVectors(a, b, k).setY(THREE.MathUtils.lerp(a.y, b.y, k) + Math.sin(k * Math.PI) * h);

/**
 * The ball machine sends a ball to the hero; pressing "Frapper" as it arrives
 * sends it back into one of the targets (the aim is automatic, timing is the game).
 */
function TennisMission({ onScore, onPrompt }: MissionProps) {
  const ballMesh = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);
  const markerMat = useRef<THREE.MeshBasicMaterial>(null);
  const ball = useRef<Ball>({ phase: "idle" });
  const idleSince = useRef(0);
  const firedAt = useRef(-9);
  const swingAt = useRef<number | null>(null);
  const swingHits = useRef(false);
  // One "hit at" time per target (0 = still standing), shared with the Target components.
  const hitStates = useRef<number[]>(TARGETS.map(() => 0));
  const remaining = useRef<number[]>(shuffle(TARGETS.map((_, i) => i)));
  const score = useRef({ points: 0, flashUntil: 0 });
  const shown = useRef<ActionPrompt | null>(null);
  const p = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, raw) => {
    const t = clock.elapsedTime;
    const dt = Math.min(raw, 0.1);
    const b = ball.current;
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __tennis: { ball: b, t } });
    const done = remaining.current.length === 0;

    const want: ActionPrompt | null = !game.paused && !done ? "hit" : null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }

    // Serve a new ball a moment after the last one.
    if (b.phase === "idle" && !done && !game.paused && t - idleSince.current > 1.6) {
      const hx = THREE.MathUtils.clamp(game.hero.x, -HALF_W + 0.5, HALF_W - 0.5);
      const hz = THREE.MathUtils.clamp(game.hero.z, 3, HALF_L);
      const from = new THREE.Vector3(MACHINE_AT[0], 1.2, MACHINE_AT[2] + 0.9);
      const hit = new THREE.Vector3(hx, 1.1, hz - 0.6);
      const bounce = new THREE.Vector3().lerpVectors(from, hit, 0.78).setY(0.12);
      ball.current = { phase: "in", start: t, from, bounce, hit };
      firedAt.current = t;
      sfx.pop();
    }

    if (game.actionRequest) {
      game.actionRequest = false;
      if (!game.action) {
        const face = b.phase === "in" ? b.hit.clone() : new THREE.Vector3(game.hero.x, 0, game.hero.z - 5);
        // Decide right away whether this swing connects, so a slow frame never steals the point.
        const early = b.phase === "in" && IN_1 + IN_2 - (t - b.start) < EARLY_OK && distance2D(game.hero, b.hit.x, b.hit.z) < HIT_REACH;
        const late = b.phase === "miss" && t - b.start < 0.5;
        const near = (b.phase === "in" || b.phase === "miss") && distance2D(game.hero, p.x, p.z) < HIT_REACH && p.y < 2.6;
        swingHits.current = early || late || near;
        startAction("slash", 0.6, face);
        swingAt.current = t + SWING_DELAY;
        sfx.whoosh();
      }
    }

    // Where is the ball now?
    let visible = true;
    if (b.phase === "in") {
      const e = t - b.start;
      if (e < IN_1) arc(b.from, b.bounce, e / IN_1, 2.6, p);
      else if (e < IN_1 + IN_2) arc(b.bounce, b.hit, (e - IN_1) / IN_2, 0.9, p);
      else {
        // Past the racket: missed. Let it roll away.
        const vel = new THREE.Vector3().subVectors(b.hit, b.bounce).multiplyScalar(0.5 / IN_2).setY(-1);
        ball.current = { phase: "miss", start: t, pos: b.hit.clone(), vel };
        p.copy(b.hit);
      }
    } else if (b.phase === "out") {
      const k = Math.min(1, (t - b.start) / b.dur);
      arc(b.from, b.to, k, 3.2, p);
      if (k >= 1) {
        const i = b.target;
        hitStates.current[i] = t;
        remaining.current = remaining.current.filter((r) => r !== i);
        score.current.points += 1;
        score.current.flashUntil = t + 2;
        tennisFx.cheerUntil = performance.now() + 2200;
        sfx.correct();
        sfx.cheer();
        speak(POINT_NAMES[Math.min(score.current.points, POINT_NAMES.length) - 1]);
        startAction("cheer", 1.6);
        onScore();
        ball.current = { phase: "idle" };
        idleSince.current = t;
      }
    } else if (b.phase === "miss") {
      b.vel.y -= 18 * dt;
      b.pos.addScaledVector(b.vel, dt);
      if (b.pos.y < 0.12) {
        b.pos.y = 0.12;
        b.vel.y = Math.abs(b.vel.y) * 0.5;
        b.vel.x *= 0.8;
        b.vel.z *= 0.8;
      }
      p.copy(b.pos);
      if (t - b.start > 1.4) {
        ball.current = { phase: "idle" };
        idleSince.current = t;
      }
    } else visible = false;

    // The swing connects if the ball is close to the racket.
    if (swingAt.current !== null && t >= swingAt.current) {
      swingAt.current = null;
      if (swingHits.current && ball.current.phase !== "out" && remaining.current.length) {
        swingHits.current = false;
        const target = remaining.current[0];
        const to = new THREE.Vector3(TARGETS[target][0], 0.12, TARGETS[target][2]);
        // Off the racket, wherever the ball is now (or just in front of the player).
        const from = ball.current.phase === "idle" ? new THREE.Vector3(game.hero.x, 1.1, game.hero.z - 0.6) : p.clone();
        ball.current = { phase: "out", start: t, from, to, target, dur: 1.1 };
        sfx.kick();
      }
    }

    if (ballMesh.current) {
      ballMesh.current.visible = visible;
      ballMesh.current.position.copy(p);
      ballMesh.current.rotation.x += dt * 12;
    }
    if (shadow.current) {
      shadow.current.visible = visible;
      shadow.current.position.set(p.x, 0.04, p.z);
      shadow.current.scale.setScalar(Math.max(0.4, 1 - p.y * 0.15));
    }
    // A ring shows where to stand; it turns green when it is time to hit.
    const cur = ball.current;
    if (marker.current && markerMat.current) {
      const incoming = cur.phase === "in";
      marker.current.visible = incoming;
      if (incoming) {
        marker.current.position.set(cur.hit.x, 0.05, cur.hit.z + 0.6);
        const ready = t - cur.start > IN_1 + IN_2 * 0.35;
        markerMat.current.color.set(ready ? "#22c55e" : "#facc15");
        marker.current.scale.setScalar(1 + Math.sin(t * 10) * 0.08);
      }
    }
  });

  return (
    <>
      <BallMachine firedAt={firedAt} />
      {TARGETS.map((pos, i) => (
        <Target key={i} position={pos} color={TARGET_COLORS[i]} index={i} hits={hitStates} />
      ))}
      <mesh ref={ballMesh} castShadow visible={false}>
        <sphereGeometry args={[0.17, 20, 14]} />
        <meshStandardMaterial color="#d9f99d" emissive="#bef264" emissiveIntensity={0.5} roughness={0.8} />
      </mesh>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.7, 0.95, 32]} />
        <meshBasicMaterial ref={markerMat} color="#facc15" transparent opacity={0.85} toneMapped={false} depthWrite={false} />
      </mesh>
      <Scoreboard scoreRef={score} />
    </>
  );
}

function TennisScene() {
  return (
    <>
      <Court />
      <Net />
      <UmpireChair />
      <Stands />
      <Hedges />
      <Clouds seed={14} height={26} />
    </>
  );
}

export const tennisCourt: WorldDef = {
  spawn: [0, 0, 9],
  bounds: { kind: "rect", minX: -HALF_W - 1.5, maxX: HALF_W + 1.5, minZ: 1.2, maxZ: HALF_L + 2.5 },
  colliders: [],
  // Bonus stars around the near half of the court.
  stars: [
    [-5.5, 0, 3],
    [5.5, 0, 12],
    [0, 0, 13.5],
  ],
  spots: {
    balle: [-5.6, 0, 7],
    "terre-battue": [5.6, 0, 6],
    filet: [-2.8, 0, 2],
    score: [3, 0, 14],
  },
  sky: { top: "#3b82f6", horizon: "#fde7c2", fog: "#eadcc5", fogNear: 60, fogFar: 160 },
  camera: { height: 6.5, distance: 9.5 },
  Scene: TennisScene,
  Mission: TennisMission,
};
