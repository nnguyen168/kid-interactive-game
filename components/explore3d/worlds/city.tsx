"use client";

import { CITY, MED } from "../Prop";
import { seeded } from "../game";
import { Vec3, WorldDef } from "../types";
import { Clouds, collidersOf, Instanced, Placed, Props } from "./common";
import { FireStation, FireTruck, Ladder } from "./firehouse";
import { FireMission } from "./fires";

const T = 5; // tile size in world units
const C = 2.5; // City Builder Bits tiles are 2 units wide
const HALF = T / 2;
const BUILDINGS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const at = (i: number, j: number): Vec3 => [i * T, 0, j * T];

const roads: Placed[] = [];
for (let i = -6; i <= 6; i++) {
  if (i === 0) roads.push({ model: CITY("road_tsplit"), position: at(0, 0), rotation: Math.PI, scale: C });
  else roads.push({ model: CITY(Math.abs(i) === 1 ? "road_straight_crossing" : "road_straight"), position: at(i, 0), rotation: Math.PI / 2, scale: C });
}
for (let j = -3; j <= -1; j++) roads.push({ model: CITY("road_straight"), position: at(0, j), scale: C });

const pavement: Placed[] = [];
for (const [i, j] of [
  [-2, -2], [-1, -2], [-2, -1], [-1, -1],
  [1, -2], [2, -2], [1, -1], [2, -1],
]) {
  pavement.push({ model: CITY("base"), position: at(i, j), scale: C });
}

const rand = seeded(11);
const buildings: Placed[] = [];
function building(i: number, j: number, collide: boolean) {
  const name = BUILDINGS[Math.floor(rand() * BUILDINGS.length)];
  buildings.push({
    model: CITY(`building_${name}`),
    position: at(i, j),
    rotation: Math.floor(rand() * 4) * (Math.PI / 2),
    scale: C,
    collide: collide ? [HALF, HALF] : undefined,
  });
}
for (let j = -4; j <= -1; j++) {
  building(-3, j, true);
  building(3, j, true);
  for (const i of [-5, -4, 4, 5]) building(i, j, false);
}
for (const i of [-2, -1, 1, 2]) building(i, -3, true);
for (let i = -2; i <= 2; i++) building(i, -4, i === 0);
for (let i = -5; i <= 5; i++) building(i, -5, false);

const props: Placed[] = [
  { model: CITY("firehydrant"), position: [4.5, 0, 4], scale: C, collide: 0.3 },
  { model: CITY("car_police"), position: [4.4, 0, -10.6], rotation: 0.35, scale: C, collide: 1.1 },
  { model: CITY("car_taxi"), position: [-0.9, 0, -12.5], rotation: 0.1, scale: C, collide: 1.1 },
  { model: CITY("car_sedan"), position: [-20, 0, 1.2], rotation: Math.PI / 2, scale: C },
  { model: CITY("car_hatchback"), position: [19, 0, -1.2], rotation: -Math.PI / 2, scale: C },
  { model: CITY("dumpster"), position: [11.7, 0, -9], rotation: -Math.PI / 2, scale: C, collide: [0.5, 0.75] },
  { model: CITY("trash_A"), position: [3.2, 0, -3.2], scale: C },
  { model: CITY("box_A"), position: [11.8, 0, -7.6], rotation: 0.3, scale: C, collide: 0.3 },
  { model: CITY("box_A"), position: [12, 0, -7], rotation: 0.9, scale: C * 0.8 },
  { model: CITY("bench"), position: [7, 0, -3.1], scale: C, collide: [0.55, 0.25] },
  { model: CITY("bench"), position: [-6, 0, 5.5], scale: C, collide: [0.55, 0.25] },
  { model: CITY("bench"), position: [8, 0, 5.5], scale: C, collide: [0.55, 0.25] },
  { model: CITY("watertower"), position: [-15, 7.45, -15], scale: C },
  { model: CITY("watertower"), position: [15, 7.45, -20], scale: C },
  { model: CITY("trafficlight_A"), position: [2.9, 0, 2.9], rotation: Math.PI, scale: C, collide: 0.25 },
  { model: CITY("trafficlight_A"), position: [-2.9, 0, -2.9], scale: C, collide: 0.25 },
];
for (const x of [-11, -6.5, 6.5, 11]) {
  props.push({ model: CITY("streetlight"), position: [x, 0, 2.8], rotation: Math.PI / 2, scale: C, collide: 0.2 });
}
for (const z of [-6, -11]) {
  props.push({ model: CITY("streetlight"), position: [2.8, 0, z], scale: C, collide: 0.2 });
}

const greenery: Placed[] = [];
for (const [x, z, s] of [
  [-15, 6, 2.8], [-9, 7.4, 2.5], [-3.5, 7, 2.7], [2.5, 7.6, 2.4], [12.5, 6.4, 2.8], [16.5, 7.6, 2.4],
  [-20, 9, 3], [21, 9, 3], [-12, 10, 2.6], [9, 10.5, 2.6],
] as [number, number, number][]) {
  greenery.push({ model: MED(rand() > 0.5 ? "tree_single_A" : "tree_single_B"), position: [x, 0, z], rotation: rand() * 6, scale: s, collide: z < 8.5 ? 0.6 : undefined });
}
for (const [x, z] of [[-13, 4], [-1, 4.2], [10, 4.4], [15, 4.2], [-7.5, 3.6]]) {
  greenery.push({ model: CITY("bush"), position: [x, 0, z], rotation: rand() * 6, scale: C * 1.4 });
}

const TRUCK_AT: Vec3 = [-7.3, 0, -4.2];
const STATION_AT: Vec3 = [-8.2, 0, -10.3];

function CityScene() {
  return (
    <group position-y={-0.25}>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#86c46a" roughness={1} />
      </mesh>
      <Instanced items={roads} />
      <Instanced items={pavement} />
      <Instanced items={buildings} />
      <group position-y={0.25}>
        <FireStation position={STATION_AT} />
        <FireTruck position={TRUCK_AT} />
        <Ladder position={[1.8, 0, -17.2]} />
        <Props items={props} />
        <Instanced items={greenery} />
      </group>
      <Clouds seed={5} height={24} />
    </group>
  );
}

export const city: WorldDef = {
  spawn: [0, 0, 4],
  bounds: { kind: "rect", minX: -12.5, maxX: 12.5, minZ: -17.5, maxZ: 8 },
  colliders: [
    ...collidersOf(buildings),
    ...collidersOf(props),
    ...collidersOf(greenery),
    { x: STATION_AT[0], z: STATION_AT[2], hw: 4.3, hd: 2.25 },
    { x: STATION_AT[0] + 5.6, z: STATION_AT[2] - 0.6, hw: 1.2, hd: 1.2 },
    { x: TRUCK_AT[0], z: TRUCK_AT[2] + 0.3, hw: 1.25, hd: 3.1 },
  ],
  stars: [],
  spots: {
    camion: [-4.3, 0, -5.8],
    caserne: [-11, 0, -6.6],
    bouche: [4.5, 0, 4],
    echelle: [0.4, 0, -15.6],
  },
  sky: { top: "#4b8fe0", horizon: "#ffe2b8", fog: "#f2dcc2", fogNear: 40, fogFar: 130 },
  camera: { height: 8.5, distance: 11.5 },
  Scene: CityScene,
  Mission: FireMission,
};
