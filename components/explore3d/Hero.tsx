"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ThemeId } from "@/lib/types";
import { game, HeroAction, resolveCollisions } from "./game";
import { dressHero } from "./outfit";
import { WorldDef } from "./types";

const HERO_URL = "/models/characters/Knight.glb";
export const HERO_SCALE = 0.72;
export const HERO_RADIUS = 0.5;
const SPEED = 5.5;

const ACTION_CLIPS: Record<HeroAction, string> = {
  cheer: "Cheer",
  kick: "Unarmed_Melee_Attack_Kick",
  spray: "Spellcasting",
  interact: "Interact",
};

const move = new THREE.Vector3();
const lastPos = new THREE.Vector3();

export function clampToBounds(p: THREE.Vector3, bounds: WorldDef["bounds"]) {
  if (bounds.kind === "circle") {
    const max = bounds.r - HERO_RADIUS;
    const len = Math.hypot(p.x, p.z);
    if (len > max) {
      p.x *= max / len;
      p.z *= max / len;
    }
  } else {
    p.x = THREE.MathUtils.clamp(p.x, bounds.minX + HERO_RADIUS, bounds.maxX - HERO_RADIUS);
    p.z = THREE.MathUtils.clamp(p.z, bounds.minZ + HERO_RADIUS, bounds.maxZ - HERO_RADIUS);
  }
}

function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export default function Hero({ themeId, world }: { themeId: ThemeId; world: WorldDef }) {
  const { scene, animations } = useGLTF(HERO_URL);
  const model = useMemo(() => dressHero(scene, themeId), [scene, themeId]);
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, model);
  const current = useRef<string | null>(null);
  const stuckTime = useRef(0);

  useEffect(() => {
    actions.Idle?.reset().play();
    current.current = "Idle";
  }, [actions]);

  function play(name: string) {
    if (current.current === name) return;
    const next = actions[name];
    if (!next) return;
    const prev = current.current ? actions[current.current] : null;
    next.reset().setEffectiveWeight(1).fadeIn(0.18).play();
    prev?.fadeOut(0.18);
    current.current = name;
  }

  useFrame((_, rawDelta) => {
    const g = group.current;
    if (!g) return;
    const delta = Math.min(rawDelta, 0.1);
    const now = performance.now();

    if (game.action && now > game.action.until) game.action = null;

    move.set(0, 0, 0);
    if (!game.paused && !game.action) {
      const k = game.keys;
      if (k.up || k.down || k.left || k.right) {
        game.target = null;
        move.set((k.right ? 1 : 0) - (k.left ? 1 : 0), 0, (k.down ? 1 : 0) - (k.up ? 1 : 0));
      } else if (game.target) {
        move.subVectors(game.target, game.hero).setY(0);
        if (move.length() < 0.2) {
          game.target = null;
          move.set(0, 0, 0);
        }
      }
    }

    const moving = move.lengthSq() > 0;
    if (moving) {
      move.normalize();
      game.heroDir.copy(move);
      lastPos.copy(game.hero);
      game.hero.addScaledVector(move, SPEED * delta);

      resolveCollisions(game.hero, HERO_RADIUS, world.colliders);
      clampToBounds(game.hero, world.bounds);

      // Give up on a tap target the hero cannot reach (e.g. behind a house).
      const progress = lastPos.distanceTo(game.hero);
      stuckTime.current = progress < SPEED * delta * 0.25 ? stuckTime.current + delta : 0;
      if (stuckTime.current > 0.35) {
        game.target = null;
        stuckTime.current = 0;
      }
    }
    game.moving = moving;

    // Face the direction of travel, or whatever the current action points at.
    const face = game.action?.face;
    let targetYaw: number | null = null;
    if (face) targetYaw = Math.atan2(face.x - game.hero.x, face.z - game.hero.z);
    else if (moving) targetYaw = Math.atan2(move.x, move.z);
    if (targetYaw !== null) {
      g.rotation.y += shortestAngle(g.rotation.y, targetYaw) * Math.min(1, delta * 12);
    }
    g.position.copy(game.hero);

    if (game.action) play(ACTION_CLIPS[game.action.kind]);
    else play(moving ? "Running_A" : "Idle");
  });

  return (
    <group ref={group} position={world.spawn} rotation={[0, Math.PI, 0]}>
      <primitive object={model} scale={HERO_SCALE} />
    </group>
  );
}

useGLTF.preload(HERO_URL);
