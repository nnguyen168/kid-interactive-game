"use client";

import { MED } from "../Prop";
import { seeded } from "../game";
import { Vec3, WorldDef } from "../types";
import { Clouds, collidersOf, Instanced, Path, Placed, Props } from "./common";

const S = 3; // KayKit hex tiles are 2 units wide; the kingdom is built at 3x.

function hexToWorld(q: number, r: number): [number, number] {
  return [2 * S * (q + r / 2), Math.sqrt(3) * S * r];
}

function hexDistance(q: number, r: number) {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

const grass: Placed[] = [];
const water: Placed[] = [];
for (let q = -8; q <= 8; q++) {
  for (let r = -8; r <= 8; r++) {
    const d = hexDistance(q, r);
    if (d > 8) continue;
    const [x, z] = hexToWorld(q, r);
    (d <= 4 ? grass : water).push({ model: MED(d <= 4 ? "hex_grass" : "hex_water"), position: [x, 0, z], scale: S });
  }
}

const buildings: Placed[] = [
  // The castle and its guard towers.
  { model: MED("building_castle_blue"), position: [0, 0, -14], scale: 3.6, collide: 3.8 },
  { model: MED("building_tower_A_blue"), position: [-7.5, 0, -12.5], scale: 3, collide: 1.7 },
  { model: MED("building_tower_A_blue"), position: [7.5, 0, -12.5], scale: 3, collide: 1.7 },
  { model: MED("wall_straight"), position: [-4.8, 0, -13], scale: 2.6, collide: 1.3 },
  { model: MED("wall_straight"), position: [4.8, 0, -13], scale: 2.6, collide: 1.3 },
  { model: MED("flag_red"), position: [-7.5, 6.5, -12.5], scale: 3 },
  { model: MED("flag_red"), position: [7.5, 6.5, -12.5], scale: 3 },
  // Village.
  { model: MED("building_windmill_blue"), position: [-15, 0, -3], rotation: 0.5, scale: 3.2, collide: 2 },
  { model: MED("building_blacksmith_blue"), position: [14, 0, -4], rotation: -0.6, scale: 3, collide: 2.2 },
  { model: MED("building_barracks_blue"), position: [-13, 0, 8], rotation: 0.9, scale: 3, collide: 2.4 },
  { model: MED("building_archeryrange_blue"), position: [14.5, 0, 7], rotation: -0.9, scale: 3, collide: 2.6 },
  { model: MED("building_market_blue"), position: [-6.5, 0, -4], rotation: 0.25, scale: 2.6, collide: 2.3 },
  { model: MED("building_well_blue"), position: [5, 0, -2.5], scale: 2.6, collide: 1 },
  { model: MED("building_church_blue"), position: [-14.5, 0, -12.5], rotation: 0.6, scale: 3, collide: 1.8 },
  { model: MED("building_tavern_blue"), position: [15, 0, -13], rotation: -0.5, scale: 3, collide: 2 },
  { model: MED("building_home_A_blue"), position: [-19, 0, 2.5], rotation: 1.2, scale: 3, collide: 1.4 },
  { model: MED("building_home_B_blue"), position: [19.5, 0, 0.5], rotation: -1.3, scale: 3, collide: 1.5 },
  // Little props that make the place feel lived in.
  { model: MED("weaponrack"), position: [11, 0, -1.5], rotation: -0.4, scale: 3, collide: 0.4 },
  { model: MED("barrel"), position: [11.2, 0, -5.8], scale: 3, collide: 0.35 },
  { model: MED("barrel"), position: [12, 0, -6.5], scale: 3, collide: 0.35 },
  { model: MED("crate_A_big"), position: [-9.3, 0, -6], rotation: 0.3, scale: 3, collide: 0.4 },
  { model: MED("sack"), position: [-9.2, 0, -2.4], scale: 3 },
  { model: MED("wheelbarrow"), position: [-11.5, 0, -1], rotation: 1, scale: 3, collide: 0.5 },
  { model: MED("resource_lumber"), position: [-16.5, 0, 4.2], rotation: 0.4, scale: 3, collide: 0.6 },
  { model: MED("target"), position: [17, 0, 11.5], rotation: -2.4, scale: 3.4, collide: 0.4 },
  { model: MED("target"), position: [18.5, 0, 9], rotation: -2.2, scale: 3.4, collide: 0.4 },
  { model: MED("tent"), position: [-9, 0, 13.5], rotation: 0.5, scale: 3, collide: 0.9 },
  { model: MED("tent"), position: [-14.5, 0, 14], rotation: -0.3, scale: 3, collide: 0.9 },
  { model: MED("bucket_water"), position: [6.4, 0, -1.2], scale: 3 },
];

const rand = seeded(42);
const nature: Placed[] = [];
// Woods hugging the northern shore and the flanks.
const forest: [string, number, number][] = [
  ["trees_A_large", -21, -8],
  ["trees_B_large", -8, -21],
  ["trees_A_medium", 8, -21],
  ["trees_B_medium", 21, -8],
  ["trees_A_small", -22, 9],
  ["trees_B_medium", 22, 11],
  ["trees_A_medium", -19, -16],
  ["trees_B_large", 19, -17],
  ["trees_A_small", 3, -21],
  ["trees_A_small", -3, -21.5],
];
for (const [name, x, z] of forest) {
  nature.push({ model: MED(name), position: [x, 0, z], rotation: rand() * Math.PI * 2, scale: 3, collide: 2.3 });
}
const singles: [number, number][] = [
  [-4, 9], [9, 12.5], [-17, 18], [4, 19], [-4, 20], [12, 17.5], [-10, 18.5], [21, 5], [-22, -2],
];
for (const [x, z] of singles) {
  nature.push({
    model: MED(rand() > 0.5 ? "tree_single_A" : "tree_single_B"),
    position: [x, 0, z],
    rotation: rand() * 6,
    scale: 2.6 + rand() * 0.8,
    collide: 0.7,
  });
}
const rocks: Placed[] = [];
for (let i = 0; i < 26; i++) {
  const a = rand() * Math.PI * 2;
  const d = 12 + rand() * 11;
  rocks.push({
    model: MED(["rock_single_A", "rock_single_B", "rock_single_C"][i % 3]),
    position: [Math.cos(a) * d, 0, Math.sin(a) * d],
    rotation: rand() * 6,
    scale: 2.4 + rand() * 1.4,
  });
}
const lilies: Placed[] = [];
for (let i = 0; i < 30; i++) {
  const a = rand() * Math.PI * 2;
  const d = 29 + rand() * 12;
  lilies.push({
    model: MED(i % 3 === 0 ? "waterplant_A" : "waterlily_A"),
    position: [Math.cos(a) * d, -0.2, Math.sin(a) * d],
    rotation: rand() * 6,
    scale: 4,
  });
}
const backdrop: Placed[] = [
  { model: MED("mountain_B_grass_trees"), position: [-42, -2, -78], scale: 13, rotation: 0.4 },
  { model: MED("mountain_A_grass_trees"), position: [0, -2, -92], scale: 16, rotation: 2 },
  { model: MED("mountain_B_grass_trees"), position: [46, -2, -76], scale: 12, rotation: 1.2 },
  { model: MED("hills_A_trees"), position: [-75, -2, -40], scale: 12 },
  { model: MED("hills_A_trees"), position: [78, -2, -38], scale: 12, rotation: 2 },
];

function KingdomScene() {
  return (
    <>
      <Instanced items={grass} tint="#b0dca8" />
      <Instanced items={water} shadows={false} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.35} receiveShadow>
        <circleGeometry args={[320, 48]} />
        <meshStandardMaterial color="#5fb8d6" roughness={0.35} />
      </mesh>
      <Path points={[[0, 16], [0, 8], [1.5, 1], [0, -5], [0, -10]]} />
      <Path points={[[1.5, 1], [7, 1.5], [11, 0.5], [15, 3]]} width={1.8} />
      <Path points={[[0, -5], [-6, -0.5], [-11, 2], [-15, 1]]} width={1.8} />
      <Props items={buildings} />
      <Instanced items={nature} />
      <Instanced items={rocks} />
      <Instanced items={lilies} shadows={false} />
      <Props items={backdrop} />
      <Clouds seed={3} />
    </>
  );
}

const stars: Vec3[] = [
  [0, 0, 4],
  [-4, 0, 2],
  [9, 0, 4],
  [-9, 0, 3],
  [3, 0, -8],
  [-3, 0, -8.5],
  [18, 0, -7],
  [-18.5, 0, -6.5],
  [6, 0, 14],
  [-6, 0, 16],
];

export const kingdom: WorldDef = {
  spawn: [0, 0, 11],
  bounds: { kind: "circle", r: 23 },
  colliders: [...collidersOf(buildings), ...collidersOf(nature)],
  stars,
  spots: {
    tour: [0, 0, -8.8],
    epee: [9.5, 0, -2.5],
    bouclier: [-9, 0, 7],
    pont: [-10.5, 0, -4],
  },
  sky: { top: "#4fa8f0", horizon: "#d9f1ff", fog: "#cfeaf7", fogNear: 45, fogFar: 140 },
  camera: { height: 7.5, distance: 11 },
  Scene: KingdomScene,
};
