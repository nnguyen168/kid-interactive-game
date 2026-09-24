"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { seeded } from "../game";
import { Vec3, WorldDef } from "../types";
import { Clouds } from "./common";
import { BALL_BAG_AT, FootballMission, GOAL_HALF, GOAL_LINE, stadiumFx } from "./football";

const PITCH = { halfW: 11, halfD: 16 };

function Stripes() {
  const stripes = 10;
  const depth = (PITCH.halfD * 2 + 4) / stripes;
  return (
    <>
      {Array.from({ length: stripes }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.005, -PITCH.halfD - 2 + depth * (i + 0.5)]} receiveShadow>
          <planeGeometry args={[PITCH.halfW * 2 + 4, depth]} />
          <meshStandardMaterial color={i % 2 ? "#4fb548" : "#5cc453"} roughness={0.95} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[70, 80]} />
        <meshStandardMaterial color="#3f9a3c" roughness={1} />
      </mesh>
    </>
  );
}

function Line({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[x, 0.02, z]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} />
    </mesh>
  );
}

function Markings() {
  const { halfW: W, halfD: D } = PITCH;
  const t = 0.16;
  return (
    <>
      <Line x={0} z={-D} w={W * 2} d={t} />
      <Line x={0} z={D} w={W * 2} d={t} />
      <Line x={-W} z={0} w={t} d={D * 2} />
      <Line x={W} z={0} w={t} d={D * 2} />
      <Line x={0} z={0} w={W * 2} d={t} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Line x={0} z={s * (D - 4.5)} w={14} d={t} />
          <Line x={-7} z={s * (D - 2.25)} w={t} d={4.5} />
          <Line x={7} z={s * (D - 2.25)} w={t} d={4.5} />
          <Line x={0} z={s * (D - 1.8)} w={7.6} d={t} />
          <Line x={-3.8} z={s * (D - 0.9)} w={t} d={1.8} />
          <Line x={3.8} z={s * (D - 0.9)} w={t} d={1.8} />
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[3.2, 3.36, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <circleGeometry args={[0.25, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </>
  );
}

function useCanvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) draw(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
    // draw is a stable module-level function in practice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);
}

function drawNet(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 21) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
}

function Goal() {
  const net = useCanvasTexture(256, 256, drawNet);
  const netSide = useMemo(() => {
    const t = net.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.4, 0.6);
    t.needsUpdate = true;
    return t;
  }, [net]);
  const H = 2.6;
  const depth = 1.8;
  const white = <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />;
  return (
    <group position={[0, 0, GOAL_LINE]}>
      {[-GOAL_HALF, GOAL_HALF].map((x) => (
        <mesh key={x} position={[x, H / 2, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, H, 12]} />
          {white}
        </mesh>
      ))}
      <mesh position={[0, H, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.12, 0.12, GOAL_HALF * 2 + 0.24, 12]} />
        {white}
      </mesh>
      {/* net */}
      <mesh position={[0, H / 2, -depth]}>
        <planeGeometry args={[GOAL_HALF * 2, H]} />
        <meshStandardMaterial map={net} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, H, -depth / 2]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[GOAL_HALF * 2, depth]} />
        <meshStandardMaterial map={netSide} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {[-GOAL_HALF, GOAL_HALF].map((x) => (
        <mesh key={x} position={[x, H / 2, -depth / 2]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[depth, H]} />
          <meshStandardMaterial map={netSide} transparent side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const BOARD_WORDS = ["ALLEZ !", "BUT !", "FOOT", "BRAVO", "GO GO GO", "CHAMPION"];
const BOARD_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2"];

function drawBoard(ctx: CanvasRenderingContext2D) {
  const w = 2048;
  const cell = w / BOARD_WORDS.length;
  BOARD_WORDS.forEach((word, i) => {
    ctx.fillStyle = BOARD_COLORS[i];
    ctx.fillRect(i * cell, 0, cell, 64);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(word, i * cell + cell / 2, 34);
  });
}

/** Scrolling LED advertising boards around the pitch. */
function Boards() {
  const base = useCanvasTexture(2048, 64, drawBoard);
  const textures = useMemo(() => {
    return [0, 1].map((k) => {
      const t = base.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.repeat.set(k === 0 ? 2 : 1.4, 1);
      t.needsUpdate = true;
      return t;
    });
  }, [base]);
  useFrame((_, delta) => {
    textures.forEach((t) => {
      t.offset.x = (t.offset.x + delta * 0.05) % 1;
    });
  });
  const X = PITCH.halfW + 1.6;
  const Z = PITCH.halfD + 1.8;
  const board = (tex: THREE.Texture) => (
    <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.9} toneMapped={false} />
  );
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} position={[s * X, 0.5, 0]} rotation-y={-s * (Math.PI / 2)}>
          <boxGeometry args={[Z * 2, 1, 0.2]} />
          {board(textures[0])}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`z${s}`} position={[0, 0.5, s * Z]} rotation-y={s > 0 ? Math.PI : 0}>
          <boxGeometry args={[X * 2, 1, 0.2]} />
          {board(textures[1])}
        </mesh>
      ))}
    </>
  );
}

const SEAT_COLORS = ["#1d4ed8", "#f8fafc", "#dc2626"];
const SHIRTS = ["#2563eb", "#1d4ed8", "#f8fafc", "#dc2626", "#facc15", "#16a34a", "#f97316", "#a855f7"];
const ROWS = 6;

type Seat = { x: number; y: number; z: number; ry: number; color: THREE.Color; phase: number };

function buildStands() {
  const rand = seeded(99);
  const tiers: { position: Vec3; size: Vec3; color: string; ry: number }[] = [];
  const seats: Seat[] = [];
  const sides = [
    { axis: "x" as const, sign: -1, length: 40 },
    { axis: "x" as const, sign: 1, length: 40 },
    { axis: "z" as const, sign: -1, length: 30 },
    { axis: "z" as const, sign: 1, length: 30 },
  ];
  for (const side of sides) {
    const start = side.axis === "x" ? PITCH.halfW + 3.4 : PITCH.halfD + 3.6;
    const ry = side.axis === "x" ? (side.sign < 0 ? Math.PI / 2 : -Math.PI / 2) : side.sign < 0 ? 0 : Math.PI;
    for (let r = 0; r < ROWS; r++) {
      const out = start + r * 1.3;
      const h = 0.8 + r * 0.9;
      const pos: Vec3 = side.axis === "x" ? [side.sign * out, h / 2, 0] : [0, h / 2, side.sign * out];
      const size: Vec3 = side.axis === "x" ? [1.3, h, side.length] : [side.length, h, 1.3];
      tiers.push({ position: pos, size, color: SEAT_COLORS[r % 3], ry: 0 });
      const count = Math.floor(side.length / 1.05);
      for (let k = 0; k < count; k++) {
        if (rand() < 0.14) continue; // a few empty seats
        const along = -side.length / 2 + 0.5 + k * 1.05 + (rand() - 0.5) * 0.2;
        const x = side.axis === "x" ? side.sign * out : along;
        const z = side.axis === "x" ? along : side.sign * out;
        seats.push({ x, y: h, z, ry, color: new THREE.Color(SHIRTS[Math.floor(rand() * SHIRTS.length)]), phase: rand() * Math.PI * 2 });
      }
    }
  }
  return { tiers, seats };
}

/** Rows of cheering fans, one instanced mesh for bodies and one for heads. */
function Crowd({ seats }: { seats: Seat[] }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const skin = useMemo(() => ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac"].map((c) => new THREE.Color(c)), []);

  useLayoutEffect(() => {
    seats.forEach((s, i) => {
      bodies.current?.setColorAt(i, s.color);
      heads.current?.setColorAt(i, skin[i % skin.length]);
    });
    if (bodies.current?.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    if (heads.current?.instanceColor) heads.current.instanceColor.needsUpdate = true;
  }, [seats, skin]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cheering = performance.now() < stadiumFx.cheerUntil;
    // A Mexican wave runs once around the stadium after the hero waves.
    const waveT = (performance.now() - stadiumFx.waveAt) / 1000;
    const waveFront = waveT < 3.2 ? waveT * 2.2 - Math.PI : null;
    seats.forEach((s, i) => {
      let bob = cheering ? Math.abs(Math.sin(t * 9 + s.phase)) * 0.7 : Math.max(0, Math.sin(t * 2 + s.phase)) * 0.08;
      if (waveFront !== null) {
        const gap = Math.abs(Math.atan2(s.z, s.x) - waveFront);
        if (gap < 0.5) bob = Math.max(bob, (1 - gap / 0.5) * 0.9);
      }
      tmp.position.set(s.x, s.y + 0.45 + bob, s.z);
      tmp.rotation.set(0, s.ry, 0);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      bodies.current?.setMatrixAt(i, tmp.matrix);
      tmp.position.y += 0.62;
      tmp.updateMatrix();
      heads.current?.setMatrixAt(i, tmp.matrix);
    });
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true;
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, seats.length]} castShadow frustumCulled={false}>
        <capsuleGeometry args={[0.28, 0.45, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, seats.length]} frustumCulled={false}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </>
  );
}

function Stands() {
  const { tiers, seats } = useMemo(() => buildStands(), []);
  return (
    <>
      {tiers.map((t, i) => (
        <mesh key={i} position={t.position} castShadow receiveShadow>
          <boxGeometry args={t.size} />
          <meshStandardMaterial color={t.color} roughness={0.7} />
        </mesh>
      ))}
      <Crowd seats={seats} />
    </>
  );
}

function Floodlight({ position }: { position: Vec3 }) {
  const facing = Math.atan2(-position[0], -position[2]);
  return (
    <group position={position} rotation-y={facing}>
      <mesh position-y={10}>
        <cylinderGeometry args={[0.25, 0.4, 20, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[0, 20.5, 0.4]} rotation-x={0.35}>
        <mesh>
          <boxGeometry args={[4.4, 2.6, 0.4]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-1.65 + (i % 4) * 1.1, 0.75 - Math.floor(i / 4) * 0.75, 0.22]}>
            <boxGeometry args={[0.8, 0.5, 0.05]} />
            <meshStandardMaterial color="#fffbea" emissive="#fff6d5" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Trophy({ position }: { position: Vec3 }) {
  const cup = useMemo(() => {
    const pts = [
      [0, 0], [0.55, 0], [0.55, 0.12], [0.2, 0.2], [0.14, 0.6], [0.2, 0.8], [0.55, 1.05], [0.72, 1.5], [0.75, 1.9], [0.68, 1.9], [0.3, 1.3], [0, 1.2],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  const gold = <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.22} emissive="#b45309" emissiveIntensity={0.25} />;
  return (
    <group position={position}>
      <mesh position-y={0.6} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.9, 1.2, 8]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
      </mesh>
      <group ref={ref} position-y={1.2} scale={1.2}>
        <mesh geometry={cup} castShadow>
          {gold}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.72, 1.4, 0]} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.25, 0.06, 8, 20, Math.PI * 1.3]} />
            {gold}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Dugout({ x }: { x: number }) {
  const s = Math.sign(x);
  return (
    <group position={[x, 0, 0]} rotation-y={s > 0 ? -Math.PI / 2 : Math.PI / 2}>
      <mesh position={[0, 1.2, -0.7]} castShadow>
        <boxGeometry args={[6, 2.4, 0.15]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[0, 2.4, 0]} rotation-x={0.12} castShadow>
        <boxGeometry args={[6.2, 0.1, 1.8]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} metalness={0.2} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.45, -0.3]}>
        <boxGeometry args={[5.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#e11d48" />
      </mesh>
    </group>
  );
}

function BallBag({ position }: { position: Vec3 }) {
  const balls = [
    [0, 0.35, 0],
    [0.55, 0.35, 0.2],
    [-0.5, 0.35, 0.25],
    [0.1, 0.35, 0.6],
    [0.2, 0.85, 0.25],
  ] as Vec3[];
  return (
    <group position={position}>
      {balls.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={i % 2 ? "#ffffff" : "#f8fafc"} roughness={0.4} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const TROPHY_AT: Vec3 = [-9.6, 0, 11];
const FLOODLIGHTS: Vec3[] = [
  [-24, 0, -26],
  [24, 0, -26],
  [-24, 0, 26],
  [24, 0, 26],
];

function StadiumScene() {
  return (
    <>
      <Stripes />
      <Markings />
      <Goal />
      <Boards />
      <Stands />
      {FLOODLIGHTS.map((p, i) => (
        <Floodlight key={i} position={p} />
      ))}
      <Trophy position={TROPHY_AT} />
      <Dugout x={-13.2} />
      <Dugout x={13.2} />
      <BallBag position={BALL_BAG_AT} />
      <Clouds seed={9} height={30} radius={80} />
    </>
  );
}

export const stadium: WorldDef = {
  spawn: [0, 0, 6],
  bounds: { kind: "rect", minX: -PITCH.halfW - 0.8, maxX: PITCH.halfW + 0.8, minZ: GOAL_LINE + 0.4, maxZ: PITCH.halfD + 1 },
  colliders: [
    { x: TROPHY_AT[0], z: TROPHY_AT[2], r: 0.9 },
    { x: BALL_BAG_AT[0], z: BALL_BAG_AT[2], r: 0.8 },
    { x: -GOAL_HALF, z: GOAL_LINE, r: 0.15 },
    { x: GOAL_HALF, z: GOAL_LINE, r: 0.15 },
  ],
  stars: [],
  spots: {
    but: [7, 0, -12.5],
    ballon: [BALL_BAG_AT[0] - 1.8, 0, BALL_BAG_AT[2]],
    trophee: [TROPHY_AT[0] + 1.9, 0, TROPHY_AT[2] - 0.6],
    tribune: [-9.6, 0, -3],
  },
  sky: { top: "#3d7ee6", horizon: "#ffe0b0", fog: "#e9dcc9", fogNear: 60, fogFar: 160 },
  camera: { height: 8, distance: 11 },
  Scene: StadiumScene,
  Mission: FootballMission,
};
