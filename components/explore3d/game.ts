import * as THREE from "three";

export type Collider = { x: number; z: number; r: number } | { x: number; z: number; hw: number; hd: number };

export type HeroAction = "cheer" | "kick" | "spray" | "interact" | "slash" | "climb";

/** Walkable area that replaces the world bounds, e.g. a rooftop. */
export type Zone = { minX: number; maxX: number; minZ: number; maxZ: number; y: number };

/**
 * Per-frame game state shared between the hero, camera and gameplay objects.
 * Mutated only from event handlers and useFrame callbacks, never during render.
 */
export const game = {
  hero: new THREE.Vector3(),
  heroDir: new THREE.Vector3(0, 0, 1),
  moving: false,
  target: null as THREE.Vector3 | null,
  keys: { up: false, down: false, left: false, right: false },
  paused: false,
  action: null as { kind: HeroAction; until: number; face?: THREE.Vector3 } | null,
  sprayTarget: null as THREE.Vector3 | null,
  /** Set by the HUD action button, consumed by the world's mission logic. */
  actionRequest: false,
  /** Set by the jump button or the J key, consumed by the hero. */
  jumpRequest: false,
  /** Vertical speed, for jumps and kart ramps. */
  vy: 0,
  /** While set, the hero walks here instead of the world (a rooftop). */
  zone: null as Zone | null,
  /** A mission is moving the hero itself (climbing a ladder). */
  cinematic: false,
  /** Kart turbo lasts until this time (performance.now ms). */
  boostUntil: 0,
  /** Current kart speed, for effects and sounds. */
  speed: 0,
};

export function resetGame(spawn: [number, number, number]) {
  game.hero.set(...spawn);
  game.heroDir.set(0, 0, -1);
  game.moving = false;
  game.target = null;
  game.keys = { up: false, down: false, left: false, right: false };
  game.paused = false;
  game.action = null;
  game.sprayTarget = null;
  game.actionRequest = false;
  game.jumpRequest = false;
  game.vy = 0;
  game.zone = null;
  game.cinematic = false;
  game.boostUntil = 0;
  game.speed = 0;
}

/** Height of the floor under the hero. */
export function groundY() {
  return game.zone?.y ?? 0;
}

export function startAction(kind: HeroAction, seconds: number, face?: THREE.Vector3) {
  game.action = { kind, until: performance.now() + seconds * 1000, face };
}

export function distance2D(a: THREE.Vector3, x: number, z: number) {
  return Math.hypot(a.x - x, a.z - z);
}

/** Deterministic pseudo-random numbers so worlds look the same on every visit. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Pushes a circle of the given radius at p out of every collider. Returns true on contact. */
export function resolveCollisions(p: THREE.Vector3, radius: number, colliders: Collider[]) {
  let hit = false;
  for (const c of colliders) {
    if ("r" in c) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + radius;
      if (d < min && d > 0.0001) {
        p.x = c.x + (dx / d) * min;
        p.z = c.z + (dz / d) * min;
        hit = true;
      }
    } else {
      const cx = THREE.MathUtils.clamp(p.x, c.x - c.hw, c.x + c.hw);
      const cz = THREE.MathUtils.clamp(p.z, c.z - c.hd, c.z + c.hd);
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d = Math.hypot(dx, dz);
      if (d >= radius) continue;
      hit = true;
      if (d > 0.0001) {
        p.x = cx + (dx / d) * radius;
        p.z = cz + (dz / d) * radius;
      } else {
        // Centre is inside the box: leave through the nearest side.
        const left = p.x - (c.x - c.hw);
        const right = c.x + c.hw - p.x;
        const back = p.z - (c.z - c.hd);
        const front = c.z + c.hd - p.z;
        const m = Math.min(left, right, back, front);
        if (m === left) p.x = c.x - c.hw - radius;
        else if (m === right) p.x = c.x + c.hw + radius;
        else if (m === back) p.z = c.z - c.hd - radius;
        else p.z = c.z + c.hd + radius;
      }
    }
  }
  return hit;
}
