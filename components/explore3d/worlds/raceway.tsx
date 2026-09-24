"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { MED } from "../Prop";
import { Collider, distance2D, game, seeded } from "../game";
import { ActionPrompt, MissionProps, Vec3, WorldDef } from "../types";
import { Clouds, Instanced, Placed } from "./common";

const WIDTH = 9; // track width
const SAMPLES = 480;

// A flowing circuit: long start straight, hairpin, esses and a big sweeper.
const CURVE = new THREE.CatmullRomCurve3(
  [
    [-6, 14],
    [-24, 12],
    [-30, 0],
    [-24, -14],
    [-10, -18],
    [-2, -8],
    [8, -20],
    [24, -18],
    [30, -4],
    [22, 10],
    [8, 16],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  true,
  "centripetal",
);

const pointAt = (t: number) => CURVE.getPointAt(((t % 1) + 1) % 1);
const tangentAt = (t: number) => CURVE.getTangentAt(((t % 1) + 1) % 1);
const yawAt = (t: number) => {
  const d = tangentAt(t);
  return Math.atan2(d.x, d.z);
};
const vec3 = (p: THREE.Vector3): Vec3 => [p.x, 0, p.z];
/** A point beside the track, on the left (+) or right (-) side. */
function beside(t: number, offset: number): Vec3 {
  const p = pointAt(t);
  const d = tangentAt(t);
  return [p.x - d.z * offset, 0, p.z + d.x * offset];
}

const SAMPLE_POINTS = Array.from({ length: 200 }, (_, i) => pointAt(i / 200));
function distanceToTrack(x: number, z: number) {
  let best = Infinity;
  for (const p of SAMPLE_POINTS) best = Math.min(best, Math.hypot(p.x - x, p.z - z));
  return best;
}

// Order matters: the finish line (t = 0) closes each lap.
const CHECKPOINTS = [0.25, 0.5, 0.75, 0];
const BOOSTS = [0.1, 0.42, 0.66, 0.88];
const RAMP_T = 0.56;
const CONES = [0.2, 0.205, 0.21, 0.36, 0.365, 0.37, 0.8, 0.805, 0.81].map((t, i) => beside(t, (i % 3) - 1));
const TIRES: Vec3[] = [beside(0.18, 7.5), beside(0.33, 7.5), beside(0.5, -7.5), beside(0.71, 7.5), beside(0.95, -7.5), beside(0.6, 7.5)];

const PIT_T = 0.02;
const PIT_AT = beside(PIT_T, -13);
const STAND_AT = beside(0.9, 13);

/** Ribbon geometry following the circuit between two lateral offsets. */
function ribbon(inner: number, outer: number, y: number, colors?: (i: number) => THREE.Color) {
  const positions: number[] = [];
  const cols: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const p = pointAt(t);
    const d = tangentAt(t);
    const nx = -d.z;
    const nz = d.x;
    positions.push(p.x + nx * inner, y, p.z + nz * inner, p.x + nx * outer, y, p.z + nz * outer);
    if (colors) {
      const c = colors(i);
      cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    if (i < SAMPLES) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (colors) g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function Track() {
  const { asphalt, kerbs, line, finish } = useMemo(() => {
    const red = new THREE.Color("#e11d48");
    const white = new THREE.Color("#f8fafc");
    const grey = new THREE.Color("#4b5563");
    const kerbColor = (i: number) => (Math.floor(i / 3) % 2 ? red : white);
    const dash = (i: number) => (Math.floor(i / 5) % 2 ? white : grey);
    const half = WIDTH / 2;
    const kerbGeo = [ribbon(half, half + 0.9, 0.03, kerbColor), ribbon(-half - 0.9, -half, 0.03, kerbColor)];
    return {
      asphalt: ribbon(-half, half, 0.02),
      kerbs: kerbGeo,
      line: ribbon(-0.12, 0.12, 0.035, dash),
      finish: yawAt(0),
    };
  }, []);
  const start = pointAt(0);
  return (
    <>
      <mesh geometry={asphalt} receiveShadow>
        <meshStandardMaterial color="#4b5563" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {kerbs.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh geometry={line}>
        <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* chequered finish line */}
      <group position={[start.x, 0.04, start.z]} rotation-y={finish}>
        {Array.from({ length: 18 }, (_, i) =>
          [0, 1].map((r) => (
            <mesh key={`${i}-${r}`} rotation-x={-Math.PI / 2} position={[-WIDTH / 2 + 0.25 + i * 0.5, 0, (r - 0.5) * 0.5]}>
              <planeGeometry args={[0.5, 0.5]} />
              <meshStandardMaterial color={(i + r) % 2 ? "#111827" : "#ffffff"} />
            </mesh>
          )),
        )}
      </group>
    </>
  );
}

function Arch({ t, index, next }: { t: number; index: number; next: React.MutableRefObject<number> }) {
  const p = pointAt(t);
  const yaw = yawAt(t);
  const beam = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const m = beam.current;
    if (!m) return;
    const isNext = next.current === index;
    const color = isNext ? "#facc15" : "#38bdf8";
    m.color.set(color);
    m.emissive.set(color);
    m.emissiveIntensity = isNext ? 1.2 + Math.sin(clock.elapsedTime * 6) * 0.6 : 0.25;
  });
  const span = WIDTH + 2.6;
  const finish = t === 0;
  return (
    <group position={[p.x, 0, p.z]} rotation-y={yaw}>
      {[-span / 2, span / 2].map((x) => (
        <mesh key={x} position={[x, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.34, 4.8, 12]} />
          <meshStandardMaterial color={finish ? "#111827" : "#f8fafc"} />
        </mesh>
      ))}
      <mesh position={[0, 4.9, 0]} castShadow>
        <boxGeometry args={[span + 0.6, 0.9, 0.5]} />
        <meshStandardMaterial ref={beam} color="#38bdf8" emissive="#38bdf8" toneMapped={false} />
      </mesh>
      {finish &&
        Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-span / 2 + 0.6 + i * ((span - 1.2) / 11), 4.9, 0.27]}>
            <planeGeometry args={[0.45, 0.45]} />
            <meshStandardMaterial color={i % 2 ? "#111827" : "#ffffff"} />
          </mesh>
        ))}
    </group>
  );
}

function BoostPad({ t }: { t: number }) {
  const p = pointAt(t);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    mats.current.forEach((m, i) => {
      if (!m) return;
      const k = (clock.elapsedTime * 2.5 - i * 0.33) % 1;
      m.opacity = 0.35 + (1 - k) * 0.65;
    });
  });
  return (
    <group position={[p.x, 0.05, p.z]} rotation-y={yawAt(t)}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.2, 4.2]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.01, -1.2 + i * 1.2]}>
          <ringGeometry args={[0.7, 1.15, 3, 1, Math.PI / 6 - Math.PI / 2, (Math.PI * 2) / 3]} />
          <meshBasicMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            color={new THREE.Color("#facc15").multiplyScalar(1.6)}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function Ramp({ t }: { t: number }) {
  const p = pointAt(t);
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2, 0);
    shape.lineTo(2, 0);
    shape.lineTo(2, 1.1);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false });
    g.translate(0, 0, -2.5);
    g.rotateY(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group position={[p.x, 0, p.z]} rotation-y={yawAt(t)}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.02]} rotation-x={-Math.atan2(1.1, 4)}>
          <boxGeometry args={[0.5, 0.02, 3.8]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

function TireStack({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {[0, 1, 2].map((r) =>
        [-0.8, 0, 0.8].map((x) => (
          <mesh key={`${r}${x}`} position={[x, 0.2 + r * 0.38, 0]} rotation-x={Math.PI / 2} castShadow>
            <torusGeometry args={[0.36, 0.17, 10, 18]} />
            <meshStandardMaterial color={r === 1 ? "#dc2626" : "#1f2937"} roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

function PitBuilding() {
  const yaw = yawAt(PIT_T);
  return (
    <group position={PIT_AT} rotation-y={yaw}>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 4, 16]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[5, 0.4, 17]} />
        <meshStandardMaterial color="#ea580c" />
      </mesh>
      {[-5, 0, 5].map((z) => (
        <mesh key={z} position={[2.01, 1.4, z]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[3.4, 2.6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
      {/* timing tower */}
      <mesh position={[0, 6.5, 6]} castShadow>
        <boxGeometry args={[1.6, 4.2, 1.6]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.81, 7.8 - i * 0.8, 6]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[1.2, 0.5]} />
          <meshBasicMaterial color={new THREE.Color(i === 0 ? "#facc15" : "#38bdf8").multiplyScalar(1.3)} />
        </mesh>
      ))}
    </group>
  );
}

function Grandstand() {
  const yaw = yawAt(0.9);
  const fans = useRef<THREE.InstancedMesh>(null);
  const seats = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: 150 }, (_, i) => ({
      x: -14 + (i % 30) * 0.95,
      row: Math.floor(i / 30),
      phase: rand() * 6,
      color: new THREE.Color(["#2563eb", "#dc2626", "#facc15", "#f8fafc", "#16a34a", "#f97316"][Math.floor(rand() * 6)]),
    }));
  }, []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    seats.forEach((s, i) => fans.current?.setColorAt(i, s.color));
    if (fans.current?.instanceColor) fans.current.instanceColor.needsUpdate = true;
  }, [seats]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seats.forEach((s, i) => {
      tmp.position.set(s.x, 1.3 + s.row * 0.9 + Math.max(0, Math.sin(t * 3 + s.phase)) * 0.15, 0.4 + s.row * 1.1);
      tmp.updateMatrix();
      fans.current?.setMatrixAt(i, tmp.matrix);
    });
    if (fans.current) fans.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={STAND_AT} rotation-y={yaw}>
      {[0, 1, 2, 3, 4].map((r) => (
        <mesh key={r} position={[0, 0.45 + r * 0.9, 0.4 + r * 1.1]} castShadow receiveShadow>
          <boxGeometry args={[30, 0.9 + r * 0.02, 1.1]} />
          <meshStandardMaterial color={r % 2 ? "#e2e8f0" : "#cbd5e1"} />
        </mesh>
      ))}
      <mesh position={[0, 6.6, 3]} castShadow>
        <boxGeometry args={[31, 0.3, 6.5]} />
        <meshStandardMaterial color="#ea580c" />
      </mesh>
      <instancedMesh ref={fans} args={[undefined, undefined, seats.length]} castShadow frustumCulled={false}>
        <capsuleGeometry args={[0.26, 0.4, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

const trees: Placed[] = (() => {
  const rand = seeded(17);
  const list: Placed[] = [];
  while (list.length < 60) {
    const x = (rand() - 0.5) * 90;
    const z = (rand() - 0.5) * 80;
    if (distanceToTrack(x, z) < WIDTH / 2 + 5) continue;
    if (Math.hypot(x - PIT_AT[0], z - PIT_AT[2]) < 11 || Math.hypot(x - STAND_AT[0], z - STAND_AT[2]) < 17) continue;
    list.push({ model: MED(rand() > 0.5 ? "tree_single_A" : "tree_single_B"), position: [x, 0, z], rotation: rand() * 6, scale: 2.4 + rand() * 1.2 });
  }
  return list;
})();

function RacewayScene() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[300, 48]} />
        <meshStandardMaterial color="#6fbf5a" roughness={1} />
      </mesh>
      <Track />
      {BOOSTS.map((t) => (
        <BoostPad key={t} t={t} />
      ))}
      <Ramp t={RAMP_T} />
      {TIRES.map((p, i) => (
        <TireStack key={i} position={p} />
      ))}
      <PitBuilding />
      <Grandstand />
      <Instanced items={trees} />
      <Instanced
        items={[
          { model: MED("mountain_B_grass_trees"), position: [-50, -2, -80], scale: 14, rotation: 0.4 },
          { model: MED("mountain_A_grass_trees"), position: [10, -2, -95], scale: 17, rotation: 2 },
          { model: MED("mountain_B_grass_trees"), position: [60, -2, -78], scale: 13, rotation: 1.2 },
        ]}
      />
      <Clouds seed={21} height={26} radius={90} />
    </>
  );
}

/** Cones the kart can knock flying. */
function Cones() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef(CONES.map((p) => ({ x: p[0], z: p[2], y: 0, vx: 0, vy: 0, vz: 0, spin: 0, rot: 0 })));
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.1);
    state.current.forEach((c, i) => {
      const d = distance2D(game.hero, c.x, c.z);
      if (d < 1.5 && game.speed > 3 && c.y <= 0.01 && c.vy === 0) {
        const dx = (c.x - game.hero.x) / (d || 1);
        const dz = (c.z - game.hero.z) / (d || 1);
        c.vx = dx * game.speed * 0.8 + game.heroDir.x * 3;
        c.vz = dz * game.speed * 0.8 + game.heroDir.z * 3;
        c.vy = 5;
        c.spin = 8;
        sfx.pop();
      }
      if (c.vy !== 0 || c.y > 0) {
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        c.vy -= 20 * dt;
        c.y += c.vy * dt;
        c.rot += c.spin * dt;
        if (c.y <= 0) {
          c.y = 0;
          c.vy = 0;
          c.vx *= 0.3;
          c.vz *= 0.3;
          c.spin = 0;
        }
      }
      const g = refs.current[i];
      if (g) {
        g.position.set(c.x, c.y, c.z);
        g.rotation.set(c.rot, 0, c.rot * 0.5);
      }
    });
  });
  return (
    <>
      {CONES.map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={p}
        >
          <mesh position-y={0.45} castShadow>
            <coneGeometry args={[0.32, 0.9, 16]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          <mesh position-y={0.5}>
            <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position-y={0.03}>
            <boxGeometry args={[0.75, 0.06, 0.75]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        </group>
      ))}
    </>
  );
}

const arrowShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 1);
  s.lineTo(0.8, 0);
  s.lineTo(0.3, 0);
  s.lineTo(0.3, -0.9);
  s.lineTo(-0.3, -0.9);
  s.lineTo(-0.3, 0);
  s.lineTo(-0.8, 0);
  s.closePath();
  return s;
})();

/** Floating arrow over the kart pointing at the next arch, so the little driver never gets lost. */
function GuideArrow({ next }: { next: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const target = pointAt(CHECKPOINTS[next.current]);
    g.position.set(game.hero.x, game.hero.y + 3.4 + Math.sin(clock.elapsedTime * 4) * 0.15, game.hero.z);
    g.rotation.y = Math.atan2(target.x - game.hero.x, target.z - game.hero.z) + Math.PI;
    g.visible = !game.paused;
  });
  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

const TURBO_COOLDOWN = 3.5;

/** Racing: pass the arches in order; each crossing of the finish line after all of them is a lap. */
function RaceMission({ onScore, onPrompt }: MissionProps) {
  const next = useRef(0);
  const lastTurbo = useRef(-99);
  const lastPad = useRef(-99);
  const lastRamp = useRef(-99);
  const shown = useRef<ActionPrompt | null>(null);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const ms = performance.now();

    const cp = pointAt(CHECKPOINTS[next.current]);
    if (distance2D(game.hero, cp.x, cp.z) < WIDTH / 2 + 1.5) {
      if (next.current === CHECKPOINTS.length - 1) {
        next.current = 0;
        sfx.fanfare();
        onScore();
      } else {
        next.current += 1;
        sfx.star();
      }
    }

    // Turbo pads and the jump ramp.
    for (const t of BOOSTS) {
      const p = pointAt(t);
      if (distance2D(game.hero, p.x, p.z) < 2.4 && now - lastPad.current > 1) {
        lastPad.current = now;
        game.boostUntil = ms + 1400;
        sfx.whoosh();
      }
    }
    const ramp = pointAt(RAMP_T);
    if (distance2D(game.hero, ramp.x, ramp.z) < 2.4 && game.speed > 5 && game.hero.y < 0.05 && now - lastRamp.current > 1) {
      lastRamp.current = now;
      game.vy = 7.5;
      sfx.whoosh();
    }

    const ready = now - lastTurbo.current > TURBO_COOLDOWN;
    const want: ActionPrompt | null = !game.paused && ready ? "turbo" : null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }
    if (game.actionRequest) {
      game.actionRequest = false;
      if (ready) {
        lastTurbo.current = now;
        game.boostUntil = ms + 1600;
        sfx.whoosh();
      }
    }
  });

  return (
    <>
      {CHECKPOINTS.map((t, i) => (
        <Arch key={i} t={t} index={i} next={next} />
      ))}
      <Cones />
      <GuideArrow next={next} />
    </>
  );
}

const colliders: Collider[] = [
  ...TIRES.map((p) => ({ x: p[0], z: p[2], r: 1.3 })),
  ...trees.map((t) => ({ x: t.position[0], z: t.position[2], r: 0.7 })),
  // Pit building and grandstand, approximated by circles along their length.
  ...[-6, -2, 2, 6].map((k) => {
    const d = tangentAt(PIT_T);
    return { x: PIT_AT[0] + d.x * k, z: PIT_AT[2] + d.z * k, r: 2.6 };
  }),
  ...[-12, -6, 0, 6, 12].map((k) => {
    const d = tangentAt(0.9);
    const p = beside(0.9, 16);
    return { x: p[0] + d.x * k, z: p[2] + d.z * k, r: 3.4 };
  }),
];

const spawnT = 0.975;

export const raceway: WorldDef = {
  spawn: vec3(pointAt(spawnT)),
  spawnYaw: yawAt(spawnT),
  bounds: { kind: "rect", minX: -40, maxX: 40, minZ: -32, maxZ: 30 },
  colliders,
  stars: [],
  spots: {
    feux: beside(0.012, 8.5),
    pneus: beside(0.18, 10.5),
    chrono: beside(0.06, -8.5),
    drapeau: beside(0.95, -8.5),
  },
  sky: { top: "#3b82f6", horizon: "#fde7c2", fog: "#eadcc5", fogNear: 70, fogFar: 190 },
  camera: { height: 12, distance: 15 },
  Scene: RacewayScene,
  Mission: RaceMission,
  vehicle: true,
};
