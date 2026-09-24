"use client";

import { Sparkles, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { MED } from "../Prop";
import { distance2D, game, startAction } from "../game";
import { MissionProps, Vec3 } from "../types";

/** Barrels with a star inside: the knight breaks them with his sword. */
export const BARRELS: Vec3[] = [
  [3.5, 0, 6.5],
  [-12, 0, 4.2],
  [16.5, 0, -9.3],
  [-16.8, 0, -8.6],
];
/** Straw training dummies that wobble when hit. */
export const DUMMIES: Vec3[] = [
  [-6.5, 0, 10.3],
  [-4.6, 0, 12.4],
  [10.6, 0, 10.8],
];

const HIT_RANGE = 2.1;
const SWING_TIME = 0.75;
const HIT_DELAY = 0.3;

type Hits = MutableRefObject<number[]>;

const planks = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2;
  return { vx: Math.cos(a) * 3, vy: 5 + (i % 3), vz: Math.sin(a) * 3, spin: 4 + i };
});

function Barrel({ position, index, broken }: { position: Vec3; index: number; broken: Hits }) {
  const { scene } = useGLTF(MED("barrel"));
  const barrel = useMemo(() => scene.clone(true), [scene]);
  const whole = useRef<THREE.Group>(null);
  const pieces = useRef<THREE.Group>(null);
  const star = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const at = broken.current[index];
    if (whole.current) whole.current.visible = at === 0;
    const t = at ? (performance.now() - at) / 1000 : 0;
    if (pieces.current) {
      pieces.current.visible = at > 0 && t < 1.6;
      pieces.current.children.forEach((c, i) => {
        const p = planks[i];
        c.position.set(p.vx * t, Math.max(0.1, 0.6 + p.vy * t - 9 * t * t), p.vz * t);
        c.rotation.set(t * p.spin, t * p.spin * 0.6, 0);
      });
    }
    if (star.current) {
      star.current.visible = at > 0 && t < 1.2;
      star.current.position.y = 1 + t * 4;
      star.current.rotation.y = t * 12;
      star.current.scale.setScalar(Math.max(0.01, 1 - t * 0.6));
    }
  });

  return (
    <group position={position}>
      <group ref={whole}>
        <primitive object={barrel} scale={4} />
        <Sparkles count={8} scale={[1.2, 1.4, 1.2]} position={[0, 1.2, 0]} size={4} speed={0.6} color="#fff3a0" />
      </group>
      <group ref={pieces} visible={false}>
        {planks.map((_, i) => (
          <mesh key={i} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.25]} />
            <meshStandardMaterial color={i % 2 ? "#8b5a2b" : "#a0522d"} />
          </mesh>
        ))}
      </group>
      <mesh ref={star} visible={false}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#ffd23f" emissive="#ffae00" emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Dummy({ position, index, hits }: { position: Vec3; index: number; hits: Hits }) {
  const body = useRef<THREE.Group>(null);
  useFrame(() => {
    const at = hits.current[index];
    if (!body.current) return;
    const t = at ? (performance.now() - at) / 1000 : 99;
    // A damped wobble after each hit.
    body.current.rotation.z = Math.sin(t * 14) * Math.exp(-t * 3) * 0.6;
    body.current.rotation.x = Math.sin(t * 11) * Math.exp(-t * 3) * 0.3;
  });
  const straw = <meshStandardMaterial color="#e2b457" roughness={0.9} />;
  return (
    <group position={position}>
      <mesh position-y={0.6} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#7c4a21" />
      </mesh>
      <group ref={body} position-y={1.1}>
        <mesh position-y={0.35} castShadow>
          <capsuleGeometry args={[0.38, 0.5, 6, 12]} />
          {straw}
        </mesh>
        <mesh position-y={1.12} castShadow>
          <sphereGeometry args={[0.3, 16, 12]} />
          <meshStandardMaterial color="#d6b88a" roughness={0.9} />
        </mesh>
        <mesh position-y={0.55} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
          {straw}
        </mesh>
        <mesh position={[0, 0.45, 0.4]}>
          <circleGeometry args={[0.22, 20]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, 0.45, 0.41]}>
          <circleGeometry args={[0.1, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

const toThing = new THREE.Vector3();

/** The knight can swing his sword at any time; barrels hide stars. */
export function KnightMission({ onScore, onPrompt }: MissionProps) {
  const broken = useRef<number[]>(BARRELS.map(() => 0));
  const hits = useRef<number[]>(DUMMIES.map(() => 0));
  const hitAt = useRef<number | null>(null);
  const shown = useRef(false);

  useFrame(() => {
    const want = !game.paused;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want ? "slash" : null);
    }
    const now = performance.now();
    if (game.actionRequest) {
      game.actionRequest = false;
      if (!game.action) {
        startAction("slash", SWING_TIME);
        hitAt.current = now + HIT_DELAY * 1000;
        sfx.whoosh();
      }
    }
    if (hitAt.current !== null && now >= hitAt.current) {
      hitAt.current = null;
      // Hit whatever is in front of the knight.
      const inFront = (p: Vec3) => {
        if (distance2D(game.hero, p[0], p[2]) > HIT_RANGE) return false;
        toThing.set(p[0] - game.hero.x, 0, p[2] - game.hero.z).normalize();
        return toThing.dot(game.heroDir) > -0.2;
      };
      BARRELS.forEach((p, i) => {
        if (broken.current[i] === 0 && inFront(p)) {
          broken.current[i] = now;
          sfx.kick();
          setTimeout(() => sfx.star(), 250);
          onScore();
        }
      });
      DUMMIES.forEach((p, i) => {
        if (inFront(p)) {
          hits.current[i] = now;
          sfx.kick();
        }
      });
    }
  });

  return (
    <>
      {BARRELS.map((p, i) => (
        <Barrel key={i} position={p} index={i} broken={broken} />
      ))}
      {DUMMIES.map((p, i) => (
        <Dummy key={i} position={p} index={i} hits={hits} />
      ))}
    </>
  );
}

/** Dummies are solid; barrels are not, so a broken barrel never leaves an invisible wall. */
export const KNIGHT_COLLIDERS = DUMMIES.map((p) => ({ x: p[0], z: p[2], r: 0.45 }));
