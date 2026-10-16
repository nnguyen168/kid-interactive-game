"use client";

import { Stars as StarField } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { distance2D, game, seeded, startAction } from "../game";
import { ActionPrompt, MissionProps, Vec3, WorldDef } from "../types";

const ROCKET_AT: Vec3 = [0, 0, -12];
const PAD_R = 3.2;
/** Energy cells for the rocket; two float high and need a big Moon jump. */
const CELLS: Vec3[] = [
  [-9, 0.9, 4],
  [10, 0.9, 2],
  [-14, 3.2, -9],
  [13, 3.4, -10],
  [4, 0.9, 13],
];
const LAUNCH_REACH = 5.5;

function moonRock(seed: number) {
  // A lumpy, low-poly boulder.
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.getAttribute("position");
  const rand = seeded(seed);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(0.8 + rand() * 0.4);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const rocks = (() => {
  const rand = seeded(8);
  const list: { p: Vec3; s: number; geo: number }[] = [];
  while (list.length < 26) {
    const a = rand() * Math.PI * 2;
    const d = 6 + rand() * 18;
    const p: Vec3 = [Math.cos(a) * d, 0, Math.sin(a) * d];
    if (Math.hypot(p[0] - ROCKET_AT[0], p[2] - ROCKET_AT[2]) < 6 || Math.hypot(p[0], p[2] - 10) < 4) continue;
    list.push({ p, s: 0.4 + rand() * 1.1, geo: list.length % 4 });
  }
  return list;
})();

const CRATERS: { p: Vec3; r: number }[] = [
  { p: [-8, 0, -2], r: 3.2 },
  { p: [9, 0, 8], r: 2.4 },
  { p: [15, 0, -2], r: 2 },
  { p: [-15, 0, 9], r: 2.8 },
  { p: [3, 0, 3], r: 1.4 },
];

function Earth() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 0, 512, 256);
      const rand = seeded(4);
      ctx.fillStyle = "#22c55e";
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(rand() * 512, 40 + rand() * 176, 30 + rand() * 50, 18 + rand() * 30, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.ellipse(rand() * 512, rand() * 256, 20 + rand() * 40, 5 + rand() * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  return (
    <group position={[-40, 34, -110]}>
      <mesh ref={ref}>
        <sphereGeometry args={[14, 48, 32]} />
        <meshBasicMaterial map={texture} fog={false} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[14, 32, 24]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.18} fog={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function Rocket({ launch }: { launch: React.MutableRefObject<{ at: number | null; ready: boolean }> }) {
  const ship = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Group>(null);
  const lights = useRef<THREE.MeshStandardMaterial>(null);
  const smoke = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const L = launch.current;
    const lift = L.at === null ? -1 : t - L.at;
    if (lights.current) lights.current.emissiveIntensity = L.ready ? 1.5 + Math.sin(t * 6) * 1 : 0.1;
    // Ignition after a three-second countdown, then lift-off.
    const burning = lift > 2.6;
    if (flame.current) {
      flame.current.visible = burning;
      flame.current.scale.set(1, 0.8 + Math.sin(t * 40) * 0.25 + Math.min(1.2, Math.max(0, lift - 3)), 1);
    }
    if (ship.current) {
      const up = lift > 3.2 ? 0.9 * (lift - 3.2) ** 2 : 0;
      ship.current.position.y = up;
      ship.current.position.x = burning && lift < 3.4 ? Math.sin(t * 60) * 0.04 : 0;
    }
    smoke.current.forEach((m, i) => {
      if (!m) return;
      const k = burning ? ((t * 0.6 + i / 10) % 1) : 0;
      m.visible = burning;
      const a = (i / 10) * Math.PI * 2;
      m.position.set(Math.cos(a) * (1 + k * 5), 0.4 + k * 1.2, Math.sin(a) * (1 + k * 5));
      m.scale.setScalar(0.6 + k * 1.8);
      (m.material as THREE.MeshStandardMaterial).opacity = (1 - k) * 0.7;
    });
  });
  const white = <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.1} />;
  const red = <meshStandardMaterial color="#ef4444" roughness={0.4} />;
  return (
    <group position={ROCKET_AT}>
      {/* launch pad and tower */}
      <mesh position-y={0.25} receiveShadow castShadow>
        <cylinderGeometry args={[PAD_R, PAD_R + 0.3, 0.5, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      <mesh position-y={0.52} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.3, 2.6, 32]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.4} />
      </mesh>
      <group position={[3.2, 0, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position-y={0.9 + i * 1.6} castShadow>
            <boxGeometry args={[1, 0.15, 1]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        ))}
        {[-0.45, 0.45].flatMap((x) =>
          [-0.45, 0.45].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 5, z]} castShadow>
              <boxGeometry args={[0.12, 10, 0.12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
            </mesh>
          )),
        )}
      </group>
      <group ref={ship} >
        <group position-y={0.5}>
          <mesh position-y={3} castShadow>
            <cylinderGeometry args={[1.1, 1.25, 5, 32]} />
            {white}
          </mesh>
          <mesh position-y={6.6} castShadow>
            <coneGeometry args={[1.1, 2.2, 32]} />
            {red}
          </mesh>
          <mesh position-y={5.2}>
            <cylinderGeometry args={[1.12, 1.12, 0.3, 32]} />
            {red}
          </mesh>
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 1.3, 1.1, Math.sin(a) * 1.3]} rotation-y={-a} castShadow>
                <boxGeometry args={[0.9, 1.8, 0.16]} />
                {red}
              </mesh>
            );
          })}
          {/* porthole */}
          <mesh position={[0, 4, 1.13]}>
            <circleGeometry args={[0.45, 24]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.1} />
          </mesh>
          <mesh position={[0, 4, 1.12]}>
            <ringGeometry args={[0.45, 0.58, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} />
          </mesh>
          {/* status lights, on once the energy cells are in */}
          <mesh position={[0, 2.2, 1.24]}>
            <boxGeometry args={[1, 0.25, 0.05]} />
            <meshStandardMaterial ref={lights} color="#22c55e" emissive="#22c55e" emissiveIntensity={0.1} toneMapped={false} />
          </mesh>
          <mesh position-y={0.2}>
            <cylinderGeometry args={[0.7, 0.9, 0.5, 20]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>
          <group ref={flame} position-y={-0.6} visible={false}>
            <mesh rotation-x={Math.PI}>
              <coneGeometry args={[0.75, 2.6, 20]} />
              <meshBasicMaterial color={new THREE.Color("#f97316").multiplyScalar(1.6)} />
            </mesh>
            <mesh rotation-x={Math.PI} position-y={0.3}>
              <coneGeometry args={[0.4, 1.6, 16]} />
              <meshBasicMaterial color={new THREE.Color("#fde047").multiplyScalar(1.8)} />
            </mesh>
          </group>
        </group>
      </group>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            smoke.current[i] = el;
          }}
          visible={false}
        >
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} depthWrite={false} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Dome({ position, r = 2.6 }: { position: Vec3; r?: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>
      {[0.4, 0.75].map((h) => (
        <mesh key={h} position-y={r * h * 0.85}>
          <torusGeometry args={[r * Math.sqrt(1 - (h * 0.85) ** 2) + 0.02, 0.05, 6, 40]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      <mesh position={[0, 0.7, r - 0.05]}>
        <boxGeometry args={[1, 1.4, 0.3]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 1.6, r * 0.62]} rotation-x={-0.6}>
        <circleGeometry args={[0.35, 20]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SolarPanel({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.7}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position-y={1.45} rotation-x={-0.6} castShadow>
        <boxGeometry args={[2.4, 0.06, 1.4]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.6} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Flag({ position }: { position: Vec3 }) {
  const cloth = useRef<THREE.Mesh>(null);
  return (
    <group position={position}>
      <mesh position-y={1.4}>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.6} />
      </mesh>
      <mesh ref={cloth} position={[0.65, 2.4, 0]}>
        <planeGeometry args={[1.3, 0.8]} />
        <meshStandardMaterial color="#4f46e5" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.65, 2.4, 0.01]}>
        <circleGeometry args={[0.22, 5]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
    </group>
  );
}

/** A friendly little green alien who bounces happily when the astronaut visits. */
function Alien({ position }: { position: Vec3 }) {
  const body = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const greeted = useRef(false);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const near = distance2D(game.hero, position[0], position[2]) < 3.5;
    if (near && !greeted.current) {
      greeted.current = true;
      sfx.correct();
      speak("Bip bip ! Bonjour Loukas !");
    }
    if (!near && distance2D(game.hero, position[0], position[2]) > 6) greeted.current = false;
    if (body.current) {
      body.current.position.y = near ? Math.abs(Math.sin(t * 6)) * 0.9 : Math.sin(t * 2) * 0.08;
      body.current.rotation.y = Math.atan2(game.hero.x - position[0], game.hero.z - position[2]);
    }
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 3) * 0.05;
  });
  const green = <meshStandardMaterial color="#4ade80" roughness={0.5} />;
  return (
    <group position={position}>
      <group ref={body}>
        <mesh position-y={0.55} castShadow>
          <capsuleGeometry args={[0.32, 0.4, 6, 12]} />
          {green}
        </mesh>
        <mesh position-y={1.3} castShadow>
          <sphereGeometry args={[0.45, 20, 16]} />
          {green}
        </mesh>
        {[-0.17, 0.17].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.35, 0.36]} scale={[1, 1.4, 0.6]}>
              <sphereGeometry args={[0.12, 12, 10]} />
              <meshStandardMaterial color="#111827" roughness={0.1} />
            </mesh>
            <mesh position={[x * 1.3, 1.85, 0]} rotation-z={-x * 2}>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
              {green}
            </mesh>
            <mesh position={[x * 2, 2.1, 0]}>
              <sphereGeometry args={[0.08, 10, 8]} />
              <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1} />
            </mesh>
          </group>
        ))}
      </group>
      {/* its little flying saucer, hovering above */}
      <group position={[2.2, 3.6, -1]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.4, 0.4, 0.35, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position-y={0.3}>
          <sphereGeometry args={[0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#67e8f9" transparent opacity={0.7} />
        </mesh>
        <mesh ref={beam} position-y={-1.9}>
          <cylinderGeometry args={[0.4, 1.4, 3.4, 24, 1, true]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

const ROCK_GEOS = [0, 1, 2, 3].map((i) => moonRock(20 + i));

function MoonScene() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[300, 64]} />
        <meshStandardMaterial color="#b8bcc6" roughness={1} />
      </mesh>
      {CRATERS.map((c, i) => (
        <group key={i} position={c.p}>
          <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
            <circleGeometry args={[c.r, 32]} />
            <meshStandardMaterial color="#9ca3af" roughness={1} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.04} receiveShadow castShadow>
            <torusGeometry args={[c.r, 0.28, 8, 32]} />
            <meshStandardMaterial color="#cbd0d8" roughness={1} />
          </mesh>
        </group>
      ))}
      {rocks.map((r, i) => (
        <mesh key={i} geometry={ROCK_GEOS[r.geo]} position={[r.p[0], r.s * 0.5, r.p[2]]} scale={r.s} castShadow receiveShadow>
          <meshStandardMaterial color="#a1a7b3" roughness={1} flatShading />
        </mesh>
      ))}
      {/* distant hills */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} geometry={ROCK_GEOS[i % 4]} position={[Math.cos(a) * 60, 0, Math.sin(a) * 60]} scale={[12, 5 + (i % 3) * 2, 12]}>
            <meshStandardMaterial color="#9aa0ab" roughness={1} flatShading />
          </mesh>
        );
      })}
      <Dome position={[-12, 0, -4]} />
      <Dome position={[-15.5, 0, 1]} r={1.8} />
      <mesh position={[-13.8, 0.6, -1.4]} rotation={[0, -0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 2.6, 16]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <SolarPanel position={[12, 0, -6]} rotation={-0.4} />
      <SolarPanel position={[14.5, 0, -4]} rotation={-0.4} />
      <SolarPanel position={[11, 0, -3]} rotation={-0.4} />
      <Flag position={[5, 0, -7]} />
      {/* telescope on its tripod */}
      <group position={[-5, 0, 8]} rotation-y={0.6}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.35, 0.6, Math.sin(i * 2.1) * 0.35]} rotation={[Math.sin(i * 2.1) * 0.35, 0, -Math.cos(i * 2.1) * 0.35]}>
            <cylinderGeometry args={[0.04, 0.04, 1.3, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
        <mesh position-y={1.4} rotation-x={-0.9}>
          <cylinderGeometry args={[0.18, 0.24, 1.6, 16]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      </group>
      <StarField radius={150} depth={40} count={3000} factor={6} saturation={0} fade speed={0.5} />
      <Earth />
    </>
  );
}

const cellGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.8, 16);

/** Collect the energy cells, then get in the rocket and launch it. */
function MoonMission({ onScore, onPrompt }: MissionProps) {
  const taken = useRef(CELLS.map(() => false));
  const count = useRef(0);
  const cells = useRef<(THREE.Group | null)[]>([]);
  const launch = useRef<{ at: number | null; ready: boolean }>({ at: null, ready: false });
  const shown = useRef<ActionPrompt | null>(null);
  const said = useRef(-1);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    CELLS.forEach((c, i) => {
      const g = cells.current[i];
      if (!g) return;
      if (!taken.current[i]) {
        g.position.y = c[1] + Math.sin(t * 2 + i) * 0.15;
        g.rotation.y = t * 1.5;
        const dy = Math.abs(game.hero.y + 0.9 - g.position.y);
        if (distance2D(game.hero, c[0], c[2]) < 1.3 && dy < 1.6) {
          taken.current[i] = true;
          count.current += 1;
          g.visible = false;
          sfx.star();
          onScore();
          if (count.current === CELLS.length) {
            launch.current.ready = true;
            sfx.fanfare();
            speak("Toutes les piles sont là ! Va vite à la fusée et appuie sur Décoller !");
          }
        }
      }
    });

    const L = launch.current;
    const nearRocket = distance2D(game.hero, ROCKET_AT[0], ROCKET_AT[2]) < LAUNCH_REACH;
    const want: ActionPrompt | null = L.ready && L.at === null && nearRocket && !game.paused ? "launch" : null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }
    if (game.actionRequest) {
      game.actionRequest = false;
      if (want === "launch") {
        L.at = t;
        game.target = null;
        game.cinematic = true;
        startAction("interact", 0.6);
        speak("Trois… deux… un… décollage !");
      }
    }
    if (L.at !== null) {
      const e = t - L.at;
      // Climb aboard: the hero disappears into the rocket, the camera follows the flight.
      if (e > 0.6) game.hidden = true;
      const second = Math.floor(e);
      if (second !== said.current && second <= 2) {
        said.current = second;
        sfx.count();
      }
      if (e > 2.6 && e < 2.7) sfx.whoosh();
      const up = e > 3.2 ? 0.9 * (e - 3.2) ** 2 : 0;
      game.hero.set(ROCKET_AT[0], 3 + up, ROCKET_AT[2] + 0.5);
      if (e > 6.5 && e < 6.6) {
        L.at = t - 6.6;
        onScore();
      }
    }
  });

  return (
    <>
      <Rocket launch={launch} />
      {CELLS.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            cells.current[i] = el;
          }}
          position={c}
        >
          <mesh geometry={cellGeo}>
            <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          {[-0.45, 0.45].map((y) => (
            <mesh key={y} position-y={y}>
              <cylinderGeometry args={[0.36, 0.36, 0.12, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          <pointLight color="#22d3ee" intensity={6} distance={5} />
        </group>
      ))}
      <Alien position={[8, 0, -14]} />
    </>
  );
}

export const moon: WorldDef = {
  spawn: [0, 0, 10],
  bounds: { kind: "circle", r: 22 },
  colliders: [
    { x: ROCKET_AT[0], z: ROCKET_AT[2], r: PAD_R },
    { x: ROCKET_AT[0] + 3.2, z: ROCKET_AT[2], r: 0.9 },
    { x: -12, z: -4, r: 2.6 },
    { x: -15.5, z: 1, r: 1.8 },
    { x: 8, z: -14, r: 0.6 },
    ...rocks.filter((r) => r.s > 0.7).map((r) => ({ x: r.p[0], z: r.p[2], r: r.s * 0.9 })),
  ],
  stars: [],
  spots: {
    lune: [-8, 0, -2],
    fusee: [-4.5, 0, -8],
    terre: [-5, 0, 10.5],
    soleil: [12.5, 0, -1],
  },
  sky: { top: "#02030f", horizon: "#1e1b4b", fog: "#0c0e26", fogNear: 60, fogFar: 170 },
  camera: { height: 8, distance: 12 },
  Scene: MoonScene,
  Mission: MoonMission,
  gravity: 0.3,
  light: { sun: "#f8fafc", intensity: 3 },
};
