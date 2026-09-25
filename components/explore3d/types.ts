import { ComponentType } from "react";
import { Collider } from "./game";

export type Vec3 = [number, number, number];

/** The contextual action button shown in the HUD. */
export type ActionPrompt = "spray" | "kick" | "slash" | "climb" | "descend" | "wave" | "turbo";

export type MissionProps = {
  onScore: () => void;
  onPrompt: (prompt: ActionPrompt | null) => void;
  world: WorldDef;
};

export type WorldDef = {
  spawn: Vec3;
  /** Direction the hero faces at the start (radians around Y); defaults to facing north. */
  spawnYaw?: number;
  /** Walkable area: a circle around the origin or an axis-aligned rectangle. */
  bounds: { kind: "circle"; r: number } | { kind: "rect"; minX: number; maxX: number; minZ: number; maxZ: number };
  colliders: Collider[];
  /** Collectible stars; in the kingdom they are the mission itself. */
  stars: Vec3[];
  spots: Record<string, Vec3>;
  sky: { top: string; horizon: string; fog: string; fogNear: number; fogFar: number };
  camera: { height: number; distance: number };
  Scene: ComponentType;
  /** Mission-specific gameplay (fires, ball...). Scored through onScore. */
  Mission?: ComponentType<MissionProps>;
  /** Picking up a star counts towards the mission (the kingdom). */
  starsScore?: boolean;
  /** Places where a mission may randomly put things (the city's fires). */
  eventSpots?: Vec3[];
  /** The hero drives a kart in this world. */
  vehicle?: boolean;
  /** For karts: the heading that follows the track from here, or null when off the track. */
  steerAssist?: (x: number, z: number) => number | null;
};
