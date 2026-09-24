import { ComponentType } from "react";
import { Collider } from "./game";

export type Vec3 = [number, number, number];

/** The contextual action button shown in the HUD. */
export type ActionPrompt = "spray" | "kick";

export type MissionProps = {
  onScore: () => void;
  onPrompt: (prompt: ActionPrompt | null) => void;
};

export type WorldDef = {
  spawn: Vec3;
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
};
