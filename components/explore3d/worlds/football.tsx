"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
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

function Keeper({ keeperXRef }: { keeperXRef: React.MutableRefObject<number> }) {
  const { scene, animations } = useGLTF("/models/characters/Knight.glb");
  const model = useMemo(() => dressHero(scene, "foot", KEEPER_PAINT), [scene]);
  const { actions } = useAnimations(animations, model);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    actions.Unarmed_Idle?.reset().play();
  }, [actions]);
  useFrame(({ clock }) => {
    const x = Math.sin(clock.elapsedTime * 0.8) * KEEPER_SWAY;
    keeperXRef.current = x;
    if (ref.current) ref.current.position.x = x;
  });
  return (
    <group ref={ref} position={[0, 0, GOAL_LINE + 0.6]}>
      <primitive object={model} scale={HERO_SCALE} />
    </group>
  );
}

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
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]} frustumCulled={false} visible={false}>
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
  const keeperX = useRef(0);
  const shown = useRef<ActionPrompt | null>(null);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const now = clock.elapsedTime;
    const p = pos.current;
    const v = vel.current;

    // Respawn at the centre spot after a goal.
    if (scoredAt.current !== null && now - scoredAt.current > 2.2) {
      scoredAt.current = null;
      p.set(0, 6, 0);
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
      const aimX = keeperX.current > 0 ? -GOAL_HALF * 0.55 : GOAL_HALF * 0.55;
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
        stadiumFx.cheerUntil = performance.now() + 2600;
        sfx.cheer();
        sfx.fanfare();
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
      for (const [cx, cz, cr] of [
        [-GOAL_HALF, GOAL_LINE, 0.15],
        [GOAL_HALF, GOAL_LINE, 0.15],
        [keeperX.current, GOAL_LINE + 0.6, 0.55],
      ]) {
        const dx = p.x - cx;
        const dz = p.z - cz;
        const dd = Math.hypot(dx, dz);
        if (dd < cr + R && dd > 0.0001 && p.y < 2) {
          p.x = cx + (dx / dd) * (cr + R);
          p.z = cz + (dz / dd) * (cr + R);
          const vn = (v.x * dx + v.z * dz) / dd;
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
      <Keeper keeperXRef={keeperX} />
      <GoalConfetti goalAt={goalAt} />
    </>
  );
}
