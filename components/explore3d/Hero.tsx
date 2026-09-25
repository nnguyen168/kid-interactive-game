"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";
import { ThemeId } from "@/lib/types";
import { game, groundY, HeroAction, resolveCollisions } from "./game";
import { Kart } from "./Kart";
import { dressHero } from "./outfit";
import { WorldDef } from "./types";

const HERO_URL = "/models/characters/Knight.glb";
export const HERO_SCALE = 0.72;
export const HERO_RADIUS = 0.5;
const SPEED = 5.5;
const GRAVITY = 22;
const JUMP_SPEED = 8;

// Kart handling: gentle enough for a five-year-old.
const KART_SPEED = 11;
const KART_TURBO = 17;
const KART_TURN = 2.4; // radians per second at full steering
const KART_REVERSE = 4;
const KART_ACCEL = 9;
const KART_RADIUS = 1.1;

const ACTION_CLIPS: Record<HeroAction, string> = {
  cheer: "Cheer",
  kick: "Unarmed_Melee_Attack_Kick",
  spray: "Spellcasting",
  interact: "Interact",
  slash: "1H_Melee_Attack_Slice_Diagonal",
  climb: "Walking_A",
};

const move = new THREE.Vector3();
const lastPos = new THREE.Vector3();

export function clampToBounds(p: THREE.Vector3, bounds: WorldDef["bounds"], radius = HERO_RADIUS) {
  const zone = game.zone;
  if (zone) {
    p.x = THREE.MathUtils.clamp(p.x, zone.minX + radius, zone.maxX - radius);
    p.z = THREE.MathUtils.clamp(p.z, zone.minZ + radius, zone.maxZ - radius);
    return;
  }
  if (bounds.kind === "circle") {
    const max = bounds.r - radius;
    const len = Math.hypot(p.x, p.z);
    if (len > max) {
      p.x *= max / len;
      p.z *= max / len;
    }
  } else {
    p.x = THREE.MathUtils.clamp(p.x, bounds.minX + radius, bounds.maxX - radius);
    p.z = THREE.MathUtils.clamp(p.z, bounds.minZ + radius, bounds.maxZ - radius);
  }
}

function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Direction the player asks for: arrow keys first, otherwise towards the tapped point. */
function wantedDirection(arrive: number) {
  move.set(0, 0, 0);
  if (game.paused || game.action || game.cinematic) return false;
  const k = game.keys;
  if (k.up || k.down || k.left || k.right) {
    game.target = null;
    move.set((k.right ? 1 : 0) - (k.left ? 1 : 0), 0, (k.down ? 1 : 0) - (k.up ? 1 : 0));
  } else if (game.target) {
    move.subVectors(game.target, game.hero).setY(0);
    if (move.length() < arrive) {
      game.target = null;
      move.set(0, 0, 0);
    }
  }
  if (move.lengthSq() === 0) return false;
  move.normalize();
  return true;
}

export default function Hero({ themeId, world }: { themeId: ThemeId; world: WorldDef }) {
  const { scene, animations } = useGLTF(HERO_URL);
  const model = useMemo(() => dressHero(scene, themeId), [scene, themeId]);
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const driver = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, model);
  const current = useRef<string | null>(null);
  const stuckTime = useRef(0);
  const jumpClipUntil = useRef(0);
  const vehicle = !!world.vehicle;

  useEffect(() => {
    const first = vehicle ? "Sit_Chair_Idle" : "Idle";
    actions[first]?.reset().play();
    current.current = first;
  }, [actions, vehicle]);

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

    // Jumping (also a little hop in the kart).
    const floor = groundY();
    const onGround = game.hero.y <= floor + 0.01;
    if (game.jumpRequest) {
      game.jumpRequest = false;
      if (onGround && !game.cinematic && !game.paused && !game.action) {
        game.vy = vehicle ? 5 : JUMP_SPEED;
        jumpClipUntil.current = now + 700;
        sfx.whoosh();
      }
    }

    let moving = false;
    if (vehicle) {
      // Arcade driving: ↑ accelerates, ↓ brakes then reverses, ← → steer the kart itself.
      const k = game.keys;
      const blocked = game.paused || !!game.action || game.cinematic;
      const usingKeys = k.up || k.down || k.left || k.right;
      if (usingKeys) game.target = null;
      let steer = 0;
      let throttle = 0;
      if (!blocked && usingKeys) {
        steer = (k.left ? 1 : 0) - (k.right ? 1 : 0);
        throttle = k.up ? 1 : k.down ? -1 : 0;
      } else if (!blocked && game.target) {
        // Tap-to-drive: head for the tapped point.
        const dx = game.target.x - game.hero.x;
        const dz = game.target.z - game.hero.z;
        if (Math.hypot(dx, dz) < 2) game.target = null;
        else {
          const turn = shortestAngle(g.rotation.y, Math.atan2(dx, dz));
          steer = THREE.MathUtils.clamp(turn * 2, -1, 1);
          throttle = Math.abs(turn) > 1.6 ? 0.35 : 1;
        }
      }
      // Steering help: going forward without steering, the kart gently follows the track.
      if (steer === 0 && throttle > 0 && world.steerAssist) {
        const yawTrack = world.steerAssist(game.hero.x, game.hero.z);
        if (yawTrack !== null) {
          const d = shortestAngle(g.rotation.y, yawTrack);
          if (Math.abs(d) < 1.2) steer = THREE.MathUtils.clamp(d * 1.6, -0.7, 0.7);
        }
      }

      game.steer += (steer - game.steer) * Math.min(1, delta * 10);
      const turbo = now < game.boostUntil;
      const top = turbo ? KART_TURBO : KART_SPEED;
      if (throttle > 0) game.speed += (top * throttle - game.speed) * Math.min(1, delta * (KART_ACCEL / 4));
      else if (throttle < 0) game.speed = game.speed > 0 ? Math.max(0, game.speed - 18 * delta) : Math.max(-KART_REVERSE, game.speed - 6 * delta);
      else {
        game.speed *= Math.exp(-delta * (turbo ? 0.5 : 1.5));
        if (Math.abs(game.speed) < 0.05) game.speed = 0;
      }
      if (turbo) game.speed = Math.max(game.speed, KART_SPEED);

      // A kart only turns while rolling, and steering flips when reversing.
      const grip = THREE.MathUtils.clamp(Math.abs(game.speed) / 4, 0, 1) * Math.sign(game.speed || 1);
      g.rotation.y += steer * KART_TURN * grip * delta;
      if (body.current) body.current.rotation.z = THREE.MathUtils.lerp(body.current.rotation.z, -steer * 0.08 * grip, delta * 6);

      moving = Math.abs(game.speed) > 0.3;
      if (game.speed !== 0) {
        game.hero.x += Math.sin(g.rotation.y) * game.speed * delta;
        game.hero.z += Math.cos(g.rotation.y) * game.speed * delta;
        if (resolveCollisions(game.hero, KART_RADIUS, world.colliders)) game.speed *= 0.6;
        clampToBounds(game.hero, world.bounds, KART_RADIUS);
      }
      game.heroDir.set(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
    } else if (!game.cinematic) {
      moving = wantedDirection(0.2);
      if (moving) {
        game.heroDir.copy(move);
        lastPos.copy(game.hero);
        game.hero.x += move.x * SPEED * delta;
        game.hero.z += move.z * SPEED * delta;
        if (!game.zone) resolveCollisions(game.hero, HERO_RADIUS, world.colliders);
        clampToBounds(game.hero, world.bounds);

        // Give up on a tap target the hero cannot reach (e.g. behind a house).
        const progress = Math.hypot(lastPos.x - game.hero.x, lastPos.z - game.hero.z);
        stuckTime.current = progress < SPEED * delta * 0.25 ? stuckTime.current + delta : 0;
        if (stuckTime.current > 0.35) {
          game.target = null;
          stuckTime.current = 0;
        }
      }
    }
    game.moving = moving;

    // Gravity (a mission moves the hero itself while climbing).
    if (!game.cinematic) {
      game.vy -= GRAVITY * delta;
      game.hero.y += game.vy * delta;
      if (game.hero.y <= floor) {
        game.hero.y = floor;
        game.vy = 0;
      }
    }

    if (!vehicle) {
      // Face the direction of travel, or whatever the current action points at.
      const face = game.action?.face;
      let targetYaw: number | null = null;
      if (face) targetYaw = Math.atan2(face.x - game.hero.x, face.z - game.hero.z);
      else if (moving) targetYaw = Math.atan2(move.x, move.z);
      if (targetYaw !== null) g.rotation.y += shortestAngle(g.rotation.y, targetYaw) * Math.min(1, delta * 12);
    }
    g.position.copy(game.hero);

    if (vehicle) {
      // In the driver's view the camera sits where the driver's head is.
      if (driver.current) driver.current.visible = game.view !== "cockpit";
      play(game.action ? ACTION_CLIPS[game.action.kind] : "Sit_Chair_Idle");
      return;
    }
    if (game.action) play(ACTION_CLIPS[game.action.kind]);
    else if (now < jumpClipUntil.current) play("Jump_Full_Short");
    else play(moving ? "Running_A" : "Idle");
  });

  if (vehicle) {
    return (
      <group ref={group} position={world.spawn} rotation={[0, world.spawnYaw ?? Math.PI, 0]}>
        <group ref={body}>
          <Kart />
          <group ref={driver}>
            <primitive object={model} scale={HERO_SCALE * 0.85} position={[0, 0.05, -0.2]} />
          </group>
        </group>
      </group>
    );
  }

  return (
    <group ref={group} position={world.spawn} rotation={[0, world.spawnYaw ?? Math.PI, 0]}>
      <primitive object={model} scale={HERO_SCALE} />
    </group>
  );
}

useGLTF.preload(HERO_URL);
