"use client";

import { Billboard, RoundedBox, useAnimations, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ArtKey } from "@/lib/art";
import { shuffle } from "@/lib/random";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { useLazyGenerated } from "@/lib/useLazyGenerated";
import { HERO_SCALE } from "../Hero";
import { CITY, MED } from "../Prop";
import { Collider, distance2D, game, seeded, startAction } from "../game";
import { dressKid } from "../outfit";
import { ActionPrompt, MissionProps, Vec3, WorldDef } from "../types";
import { Clouds, collidersOf, Instanced, Path, Placed, Props } from "./common";
import { Bush, Hedges, useSignTexture } from "./police";

const BOUNDS = { minX: -16, maxX: 16, minZ: -15, maxZ: 13 };
const SPAWN: Vec3 = [0, 0, 9];
const HOSPITAL_AT: Vec3 = [0, 0, -13];
/** The ambulance waits on the side street, nose towards the hospital. */
const AMBULANCE_AT: Vec3 = [12.5, 0, 8];
const PLAYGROUND_AT: Vec3 = [0, 0, 0.5];
const SWINGS_AT: Vec3 = [-9.5, 0, 1.5];
const SEESAW_AT: Vec3 = [5.5, 0, 0.5];

const HEAL_RANGE = 2.6;
const CARE_TIME = 1.5;
const DRIVE_TIME = 6.2;
const SIREN_TIME = 3.6;

type Problem = { art: ArtKey; say: string; care: string; cured: string };

/** Little everyday bobos, each with what the doctor does about it. */
const PROBLEMS: Problem[] = [
  {
    art: "adhesive-bandage",
    say: "Aïe ! Je suis tombé, j'ai mal au genou !",
    care: "Je nettoie bien, et je mets un pansement.",
    cured: "Voilà un beau pansement ! Merci docteur !",
  },
  {
    art: "thermometer",
    say: "J'ai très chaud… Je crois que j'ai de la fièvre.",
    care: "Je prends ta température avec le thermomètre.",
    cured: "Un peu de fièvre : il faut boire de l'eau et te reposer. Merci docteur !",
  },
  {
    art: "ice",
    say: "Aïe, je me suis cogné la tête !",
    care: "Je pose un glaçon sur ta bosse.",
    cured: "Le froid fait dégonfler la bosse. Ça va mieux ! Merci docteur !",
  },
  {
    art: "tooth",
    say: "Ouille, j'ai mal à une dent !",
    care: "Ouvre grand la bouche… Je regarde tes dents.",
    cured: "Il faudra aller chez le dentiste, et bien te brosser les dents ! Merci docteur !",
  },
  {
    art: "stethoscope",
    say: "Keuf, keuf ! Je tousse beaucoup…",
    care: "J'écoute tes poumons avec mon stéthoscope. Respire fort !",
    cured: "C'est juste un petit rhume. Tousse dans ton coude ! Merci docteur !",
  },
];
const PATIENTS = 3;
const SHIRTS = ["#f97316", "#ec4899", "#22c55e", "#a855f7", "#eab308"];
const HAIR = ["#facc15", "#7c4a21", "#1f2937", "#b45309"];

/** Where the children may be waiting; each game picks three. */
const PATIENT_SPOTS: Vec3[] = [
  [-11, 0, -3],
  [-7.5, 0, 5.5],
  [6.5, 0, 4.5],
  [-12.5, 0, 10.5],
  [-4, 0, -5],
  [5, 0, -4.5],
  [-12, 0, -10.5],
  [4.5, 0, 11.5],
  [-6, 0, -0.5],
];

type PatientState = "sick" | "care" | "well";
type Patient = { pos: THREE.Vector3; yaw: number; state: PatientState; at: number; greeted: boolean };
type Ward = {
  patients: Patient[];
  sirenUntil: number;
  /** When the drive to the hospital started (clock seconds). */
  driveAt: number | null;
  arrived: boolean;
  /** Where the ambulance is now. */
  ambulance: { x: number; z: number; yaw: number };
};

/** The ambulance route: up the side street, then along the hospital road to the door. */
const ROUTE = new THREE.CatmullRomCurve3(
  [
    [12.5, 8],
    [12.5, -2],
    [12.2, -6.6],
    [10, -8.6],
    [6, -8.8],
    [2.6, -8.8],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
);

/* ---------- the children ---------- */

function PatientActor({
  index,
  wardRef,
  shirt,
  hair,
  sick,
  heart,
}: {
  index: number;
  wardRef: React.MutableRefObject<Ward>;
  shirt: string;
  hair: string;
  sick: THREE.Texture;
  heart: THREE.Texture;
}) {
  const { scene, animations } = useGLTF("/models/characters/Knight.glb");
  const model = useMemo(() => dressKid(scene, shirt, hair), [scene, shirt, hair]);
  const { actions } = useAnimations(animations, model);
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const sign = useRef<THREE.Group>(null);
  const sickPic = useRef<THREE.Mesh>(null);
  const heartPic = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const current = useRef<string | null>(null);

  useEffect(() => {
    actions.Unarmed_Idle?.reset().play();
    current.current = "Unarmed_Idle";
  }, [actions]);

  useFrame(({ clock }) => {
    const p = wardRef.current.patients[index];
    const g = group.current;
    if (!p || !g) return;
    const t = clock.elapsedTime;
    g.position.set(p.pos.x, 0, p.pos.z);
    g.rotation.y = p.yaw;
    const cheering = p.state === "well" && t - p.at < 3;
    const clip = cheering ? "Cheer" : "Unarmed_Idle";
    if (clip !== current.current) {
      actions[clip]?.reset().fadeIn(0.2).play();
      if (current.current) actions[current.current]?.fadeOut(0.2);
      current.current = clip;
    }
    // A sad little sway while waiting for the doctor.
    if (body.current) body.current.rotation.z = p.state === "sick" ? Math.sin(t * 1.6 + index) * 0.08 : 0;
    if (sign.current) {
      sign.current.position.y = (p.state === "well" ? 2.2 : 2.35) + Math.sin(t * 2.2 + index) * 0.1;
      sign.current.scale.setScalar(p.state === "care" ? 1 + Math.sin(t * 12) * 0.08 : p.state === "well" ? 0.7 : 1);
    }
    if (sickPic.current) sickPic.current.visible = p.state !== "well";
    if (heartPic.current) heartPic.current.visible = p.state === "well";
    if (ring.current) {
      ring.current.visible = p.state === "sick";
      ring.current.scale.setScalar(1 + Math.sin(t * 3 + index) * 0.08);
    }
  });

  return (
    <group ref={group}>
      <group ref={body}>
        <primitive object={model} scale={HERO_SCALE * 0.85} />
      </group>
      <group ref={sign}>
        <Billboard>
          <mesh ref={sickPic}>
            <planeGeometry args={[0.95, 0.95]} />
            <meshBasicMaterial map={sick} color="#ebebeb" transparent alphaTest={0.05} toneMapped={false} />
          </mesh>
          <mesh ref={heartPic} visible={false}>
            <planeGeometry args={[0.95, 0.95]} />
            <meshBasicMaterial map={heart} color="#ebebeb" transparent alphaTest={0.05} toneMapped={false} />
          </mesh>
        </Billboard>
      </group>
      <mesh ref={ring} position-y={0.04} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.85, 1.05, 32]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- the ambulance ---------- */

function Wheel({ position }: { position: Vec3 }) {
  return (
    <mesh position={position} rotation-z={Math.PI / 2} castShadow>
      <cylinderGeometry args={[0.45, 0.45, 0.36, 20]} />
      <meshStandardMaterial color="#1f2328" roughness={0.9} />
    </mesh>
  );
}

function RedCross({ position, rotation = 0, size = 0.9 }: { position: Vec3; rotation?: number; size?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh>
        <boxGeometry args={[size * 0.32, size, 0.04]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh>
        <boxGeometry args={[size, size * 0.32, 0.04]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

/** A chunky toy ambulance: white van, red stripe and crosses, flashing light bar. Faces +z. */
function Ambulance({ wardRef }: { wardRef: React.MutableRefObject<Ward> }) {
  const group = useRef<THREE.Group>(null);
  const red = useRef<THREE.MeshStandardMaterial>(null);
  const blue = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const w = wardRef.current;
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.position.set(w.ambulance.x, 0, w.ambulance.z);
      group.current.rotation.y = w.ambulance.yaw;
    }
    const on = t < w.sirenUntil;
    const flip = Math.sin(t * 14) > 0;
    if (red.current) red.current.emissiveIntensity = on ? (flip ? 5 : 0.3) : 0.6;
    if (blue.current) blue.current.emissiveIntensity = on ? (flip ? 0.3 : 5) : 0.6;
    if (glow.current) {
      glow.current.intensity = on ? 18 : 0;
      glow.current.color.set(flip ? "#ef4444" : "#3b82f6");
    }
  });
  return (
    <group ref={group}>
      <RoundedBox args={[2.1, 2.1, 3.3]} radius={0.16} position={[0, 1.45, -0.45]} castShadow receiveShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[2.1, 1.5, 1.5]} radius={0.22} position={[0, 1.15, 1.85]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 1.5, 2.61]}>
        <boxGeometry args={[1.8, 0.7, 0.04]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.4} roughness={0.1} />
      </mesh>
      {[-1.06, 1.06].map((x) => (
        <mesh key={x} position={[x, 1.5, 1.9]}>
          <boxGeometry args={[0.04, 0.6, 0.9]} />
          <meshStandardMaterial color="#1e3a5f" metalness={0.4} roughness={0.1} />
        </mesh>
      ))}
      {/* red stripe all round */}
      <mesh position={[0, 0.95, 0.1]}>
        <boxGeometry args={[2.14, 0.3, 4.62]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <RedCross position={[1.08, 1.85, -0.45]} rotation={Math.PI / 2} />
      <RedCross position={[-1.08, 1.85, -0.45]} rotation={-Math.PI / 2} />
      <RedCross position={[0, 1.85, -2.12]} rotation={Math.PI} size={0.7} />
      <RedCross position={[0, 2.52, -0.45]} rotation={0} size={0.9} />
      {/* headlights */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.75, 2.61]}>
          <boxGeometry args={[0.36, 0.2, 0.04]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {/* light bar */}
      <group position={[0, 1.98, 1.85]}>
        <mesh position-x={-0.36}>
          <boxGeometry args={[0.6, 0.22, 0.36]} />
          <meshStandardMaterial ref={red} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
        <mesh position-x={0.36}>
          <boxGeometry args={[0.6, 0.22, 0.36]} />
          <meshStandardMaterial ref={blue} color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
        <pointLight ref={glow} position-y={0.6} intensity={0} distance={14} decay={1.4} />
      </group>
      <Wheel position={[1.0, 0.45, 1.55]} />
      <Wheel position={[-1.0, 0.45, 1.55]} />
      <Wheel position={[1.0, 0.45, -1.35]} />
      <Wheel position={[-1.0, 0.45, -1.35]} />
    </group>
  );
}

/* ---------- the mission ---------- */

function HospitalMission({ onScore, onPrompt }: MissionProps) {
  const art = useTexture(
    Object.fromEntries([...PROBLEMS.map((p) => p.art), "heart"].map((a) => [a, `/art/${a}.png`])),
    (loaded) => {
      for (const t of Object.values(loaded as Record<string, THREE.Texture>)) t.colorSpace = THREE.SRGBColorSpace;
    },
  ) as Record<string, THREE.Texture>;
  // Each game: three children with different bobos, in new places.
  const [setup] = useLazyGenerated(true, () => ({
    spots: shuffle(PATIENT_SPOTS).slice(0, PATIENTS),
    problems: shuffle(PROBLEMS).slice(0, PATIENTS),
    shirts: shuffle(SHIRTS),
    hair: shuffle(HAIR),
  }));
  const ward = useRef<Ward>({
    patients: [],
    sirenUntil: 0,
    driveAt: null,
    arrived: false,
    ambulance: { x: AMBULANCE_AT[0], z: AMBULANCE_AT[2], yaw: Math.PI },
  });
  const shown = useRef<ActionPrompt | null>(null);
  const said = useRef(0);
  const point = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!setup) return;
    const t = clock.elapsedTime;
    const w = ward.current;
    if (w.patients.length === 0) {
      w.patients = setup.spots.map((s) => ({ pos: new THREE.Vector3(s[0], 0, s[2]), yaw: Math.atan2(-s[0], -s[2]), state: "sick", at: 0, greeted: false }));
    }
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __hospital: w });

    let nearest: Patient | null = null;
    let nearestD = Infinity;
    w.patients.forEach((p, i) => {
      const d = distance2D(game.hero, p.pos.x, p.pos.z);
      if (p.state === "sick") {
        if (d < 9) p.yaw = Math.atan2(game.hero.x - p.pos.x, game.hero.z - p.pos.z);
        if (!p.greeted && d < 5.5 && !game.paused) {
          p.greeted = true;
          speak(setup.problems[i].say);
        }
        if (d < nearestD) {
          nearest = p;
          nearestD = d;
        }
      }
      if (p.state === "care" && t - p.at > CARE_TIME) {
        p.state = "well";
        p.at = t;
        sfx.correct();
        speak(setup.problems[i].cured);
        onScore();
        if (w.patients.every((x) => x.state === "well")) {
          setTimeout(() => {
            sfx.fanfare();
            speak("Tout le monde est soigné ! Maintenant, va à l'ambulance et ramène-la à l'hôpital !");
          }, 3600);
        }
      }
    });

    const allWell = w.patients.every((p) => p.state === "well");
    const nearAmbulance = distance2D(game.hero, w.ambulance.x, w.ambulance.z) < 3.8;
    let want: ActionPrompt | null = null;
    if (!game.paused && w.driveAt === null) {
      if (nearest && nearestD < HEAL_RANGE) want = "heal";
      else if (nearAmbulance && allWell) want = "drive";
      else if (nearAmbulance && t > w.sirenUntil) want = "siren";
    }
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }

    if (game.actionRequest) {
      game.actionRequest = false;
      if (want === "heal" && nearest) {
        const p: Patient = nearest;
        const i = w.patients.indexOf(p);
        p.state = "care";
        p.at = t;
        game.target = null;
        startAction("interact", CARE_TIME, p.pos.clone());
        sfx.pop();
        speak(setup.problems[i].care);
      } else if (want === "siren") {
        w.sirenUntil = t + SIREN_TIME;
        game.target = null;
        startAction("interact", 0.8, new THREE.Vector3(w.ambulance.x, 0, w.ambulance.z));
        sfx.siren();
      } else if (want === "drive") {
        w.driveAt = t;
        w.sirenUntil = t + DRIVE_TIME + 1.5;
        game.target = null;
        game.cinematic = true;
        startAction("interact", 0.5, new THREE.Vector3(w.ambulance.x, 0, w.ambulance.z));
        sfx.siren();
        said.current = 0;
        speak("En route pour l'hôpital ! Pin-pon, pin-pon !");
      }
    }

    // The drive: Loukas hops in, the ambulance follows its route and the camera follows him.
    if (w.driveAt !== null && !w.arrived) {
      const e = t - w.driveAt;
      if (e > 0.5) game.hidden = true;
      if (e > 3.4 && said.current === 0) {
        said.current = 1;
        sfx.siren();
      }
      const a = THREE.MathUtils.clamp((e - 0.7) / DRIVE_TIME, 0, 1);
      const u = a * a * (3 - 2 * a);
      ROUTE.getPointAt(u, point);
      ROUTE.getTangentAt(u, tangent);
      w.ambulance.x = point.x;
      w.ambulance.z = point.z;
      w.ambulance.yaw = Math.atan2(tangent.x, tangent.z);
      game.hero.set(point.x, 0, point.z);
      if (e > DRIVE_TIME + 1) {
        w.arrived = true;
        game.hero.set(point.x, 0, point.z + 2.2);
        game.hidden = false;
        game.cinematic = false;
        startAction("cheer", 2);
        sfx.fanfare();
        onScore();
      }
    }
  });

  if (!setup) return null;
  return (
    <>
      <Ambulance wardRef={ward} />
      {setup.spots.map((_, i) => (
        <PatientActor
          key={i}
          index={i}
          wardRef={ward}
          shirt={setup.shirts[i]}
          hair={setup.hair[i]}
          sick={art[setup.problems[i].art]}
          heart={art.heart}
        />
      ))}
    </>
  );
}

/* ---------- the hospital and the park ---------- */

function RoofBeacon({ position }: { position: Vec3 }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.emissiveIntensity = Math.sin(clock.elapsedTime * 3) > 0 ? 3 : 0.5;
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.3, 16, 10]} />
      <meshStandardMaterial ref={mat} color="#ef4444" emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
    </mesh>
  );
}

/** The hospital: white building, big red crosses, the URGENCES door and a helipad on the roof. */
function Hospital() {
  const sign = useSignTexture("HÔPITAL", "#0d9488");
  const urgent = useSignTexture("URGENCES", "#dc2626");
  return (
    <group position={HOSPITAL_AT}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[12, 0.2, 5.2]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.4, 6, 4.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 6.15, 0]} castShadow>
        <boxGeometry args={[11.9, 0.3, 4.9]} />
        <meshStandardMaterial color="#0f766e" />
      </mesh>
      {/* sign */}
      {sign && (
        <mesh position={[0, 5.2, 2.22]}>
          <planeGeometry args={[4.6, 1.15]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      )}
      <group position={[-4.3, 5, 2.22]}>
        <mesh>
          <boxGeometry args={[1.4, 1.4, 0.06]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <RedCross position={[0, 0, 0.05]} size={1.1} />
      </group>
      <group position={[4.3, 5, 2.22]}>
        <mesh>
          <boxGeometry args={[1.4, 1.4, 0.06]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <RedCross position={[0, 0, 0.05]} size={1.1} />
      </group>
      {/* emergency doors */}
      <mesh position={[0, 1.45, 2.22]}>
        <boxGeometry args={[2.8, 2.7, 0.08]} />
        <meshStandardMaterial color="#99f6e4" metalness={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.45, 2.27]}>
        <boxGeometry args={[0.08, 2.7, 0.04]} />
        <meshStandardMaterial color="#0f766e" />
      </mesh>
      {urgent && (
        <mesh position={[0, 3.35, 2.24]}>
          <planeGeometry args={[3, 0.75]} />
          <meshBasicMaterial map={urgent} toneMapped={false} />
        </mesh>
      )}
      {/* windows */}
      {[-4.3, -2.5, 2.5, 4.3].flatMap((x) =>
        [1.6, 3.4].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 2.22]}>
            <boxGeometry args={[1.2, 1.1, 0.08]} />
            <meshStandardMaterial color="#cffafe" metalness={0.3} roughness={0.1} />
          </mesh>
        )),
      )}
      {/* helipad */}
      <mesh position={[0, 6.32, -0.2]}>
        <cylinderGeometry args={[1.9, 1.9, 0.06, 32]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 6.37, -0.2]}>
          <boxGeometry args={[0.24, 0.02, 1.4]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      <mesh position={[0, 6.37, -0.2]}>
        <boxGeometry args={[1.1, 0.02, 0.24]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <RoofBeacon position={[5.4, 6.5, 2]} />
      <RoofBeacon position={[-5.4, 6.5, 2]} />
    </group>
  );
}

/** A slide on a sandpit, in the middle of the park. */
function Playground() {
  return (
    <group position={PLAYGROUND_AT}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} receiveShadow>
        <circleGeometry args={[2.6, 40]} />
        <meshStandardMaterial color="#fde68a" roughness={1} />
      </mesh>
      {/* ladder tower */}
      <mesh position={[-0.9, 1.1, 0]} castShadow>
        <boxGeometry args={[1, 0.12, 1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      {[-0.42, 0.42].flatMap((z) =>
        [-1.38, -0.42].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.85, z]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.7, 8]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        )),
      )}
      <mesh position={[-0.9, 1.75, 0]} castShadow>
        <coneGeometry args={[0.85, 0.8, 4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* the slide */}
      <mesh position={[0.45, 0.62, 0]} rotation-z={-0.58} castShadow>
        <boxGeometry args={[2.1, 0.08, 0.8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

function Swings() {
  return (
    <group position={SWINGS_AT}>
      {[-1.5, 1.5].map((x) => (
        <group key={x} position-x={x}>
          {[-0.5, 0.5].map((z) => (
            <mesh key={z} position={[0, 1.2, z]} rotation-x={z * 0.5} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 2.5, 8]} />
              <meshStandardMaterial color="#f97316" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 2.35, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <group key={x} position-x={x}>
          {[-0.18, 0.18].map((dx) => (
            <mesh key={dx} position={[dx, 1.6, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 1.5, 4]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
          ))}
          <mesh position={[0, 0.85, 0]} castShadow>
            <boxGeometry args={[0.5, 0.06, 0.28]} />
            <meshStandardMaterial color={x < 0 ? "#3b82f6" : "#ec4899"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Seesaw() {
  return (
    <group position={SEESAW_AT} rotation-y={0.4}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.3, 0.5, 4]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation-z={0.18} castShadow>
        <boxGeometry args={[3, 0.1, 0.4]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
    </group>
  );
}

const C = 2.5;
const rand = seeded(57);

const town: Placed[] = [];
for (let i = -5; i <= 5; i++) {
  if (Math.abs(i) <= 1) continue;
  town.push({ model: CITY(`building_${"ABCDEFGH"[Math.floor(rand() * 8)]}`), position: [i * 5, 0, -21], scale: C });
}
for (const x of [-23, 23]) {
  for (let j = -3; j <= 2; j++) {
    town.push({ model: CITY(`building_${"ABCDEFGH"[Math.floor(rand() * 8)]}`), position: [x, 0, j * 5], rotation: Math.floor(rand() * 4) * (Math.PI / 2), scale: C });
  }
}

const trees: Placed[] = [];
for (const [x, z] of [
  [-14.5, -6], [-9, 11.5], [-15, 4], [8, -2.5], [0, 12.8], [-2.5, -2.6], [8.5, 11.8],
] as [number, number][]) {
  trees.push({ model: MED(rand() > 0.5 ? "tree_single_A" : "tree_single_B"), position: [x, 0, z], rotation: rand() * 6, scale: 2.6 + rand() * 0.6, collide: 0.6 });
}
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const d = 30 + rand() * 6;
  trees.push({ model: MED("tree_single_A"), position: [Math.cos(a) * d, 0, Math.sin(a) * d + 6], rotation: rand() * 6, scale: 3 + rand() });
}

const BUSHES: Vec3[] = [
  [-15, -1.5], [-14.5, 8], [-3.5, 7.5], [3.5, 7.5], [8.5, 8.5], [-8.5, -8], [7.5, -6.5], [15.3, -12.5],
].map(([x, z]) => [x, 0, z] as Vec3);

const props: Placed[] = [
  { model: CITY("bench"), position: [-3.6, 0, 4.2], rotation: Math.PI / 4, scale: C * 1.3, collide: 0.6 },
  { model: CITY("bench"), position: [3.8, 0, 4], rotation: -Math.PI / 4, scale: C * 1.3, collide: 0.6 },
  { model: CITY("streetlight"), position: [-6.5, 0, -6.6], scale: C, collide: 0.2 },
  { model: CITY("streetlight"), position: [6.5, 0, -6.6], scale: C, collide: 0.2 },
  { model: CITY("streetlight"), position: [-5, 0, 8], rotation: Math.PI, scale: C, collide: 0.2 },
  { model: CITY("trash_A"), position: [2.5, 0, 6.2], scale: C },
  { model: CITY("car_sedan"), position: [-9, 0.3, -8.6], rotation: Math.PI / 2, scale: 4.2, collide: [2, 1] },
];

function HospitalScene() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#86c46a" roughness={1} />
      </mesh>
      {/* the hospital road, and the side street where the ambulance waits */}
      <mesh rotation-x={-Math.PI / 2} position={[-1, 0.012, -8.8]} receiveShadow>
        <planeGeometry args={[36, 4.4]} />
        <meshStandardMaterial color="#64748b" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[12.5, 0.011, 6]} receiveShadow>
        <planeGeometry args={[4.4, 34]} />
        <meshStandardMaterial color="#64748b" roughness={1} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`h${i}`} rotation-x={-Math.PI / 2} position={[-17 + i * 4, 0.02, -8.8]}>
          <planeGeometry args={[1.8, 0.18]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`v${i}`} rotation-x={-Math.PI / 2} position={[12.5, 0.02, -3 + i * 4]}>
          <planeGeometry args={[0.18, 1.8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -21]} receiveShadow>
        <planeGeometry args={[60, 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={1} />
      </mesh>
      <Path points={[[0, 14], [0, 7], [0, 3.4]]} width={2.6} />
      <Path points={[[0, -2.4], [0, -6.5]]} width={2.6} />
      <Path points={[[-15, 1.2], [-11.5, 0], [-2.8, 0.5]]} width={2.4} />
      <Path points={[[2.8, 0.5], [7, 1], [10.3, 1]]} width={2.4} />
      <Hospital />
      <Playground />
      <Swings />
      <Seesaw />
      <Hedges bounds={BOUNDS} />
      <Instanced items={town} />
      <Instanced items={trees} />
      {BUSHES.map((b, i) => (
        <Bush key={i} position={b} seed={i + 11} />
      ))}
      <Props items={props} />
      <Clouds seed={37} height={24} />
    </>
  );
}

const COLLIDERS: Collider[] = [
  { x: HOSPITAL_AT[0], z: HOSPITAL_AT[2], hw: 5.8, hd: 2.4 },
  { x: AMBULANCE_AT[0], z: AMBULANCE_AT[2], hw: 1.2, hd: 2.4 },
  { x: PLAYGROUND_AT[0] - 0.9, z: PLAYGROUND_AT[2], hw: 0.6, hd: 0.6 },
  { x: SWINGS_AT[0], z: SWINGS_AT[2], hw: 1.7, hd: 0.7 },
  { x: SEESAW_AT[0], z: SEESAW_AT[2], r: 0.5 },
  ...collidersOf(trees.filter((t) => t.collide)),
  ...collidersOf(props),
];

export const hospitalPark: WorldDef = {
  spawn: SPAWN,
  bounds: { kind: "rect", ...BOUNDS },
  colliders: COLLIDERS,
  stars: [],
  spots: {
    quinze: [9, 0, 10.2],
    savon: [-3.6, 0, -9.8],
    coeur: [-13, 0, 3],
    dents: [13.2, 0, -12.2],
  },
  sky: { top: "#4fa8f0", horizon: "#e0f7fa", fog: "#dff3f5", fogNear: 45, fogFar: 140 },
  camera: { height: 8.5, distance: 11.5 },
  Scene: HospitalScene,
  Mission: HospitalMission,
};
