"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ArtKey } from "@/lib/art";
import { shuffle } from "@/lib/random";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { useLazyGenerated } from "@/lib/useLazyGenerated";
import { MED } from "../Prop";
import { distance2D, game, seeded, startAction } from "../game";
import { ActionPrompt, MissionProps, Vec3, WorldDef } from "../types";
import { Clouds, collidersOf, Instanced, Path, Placed, Props } from "./common";

const COUNTER_AT: Vec3 = [0, 0, -5];
const COUNTER_W = 6;
const COUNTER_H = 1.05;
const OVEN_AT: Vec3 = [5.4, 0, -6.4];
const PAN_AT = new THREE.Vector3(-2.2, COUNTER_H + 0.12, -5);
const HEN_HOME: Vec3 = [-11, 0, 9];
const COOK_REACH = 3.6;

type IngredientId = "oeuf" | "lait" | "farine" | "beurre" | "pate" | "tomate" | "fromage" | "champignon";

const INGREDIENTS: Record<IngredientId, { art: ArtKey; say: string }> = {
  oeuf: { art: "egg", say: "Un œuf !" },
  lait: { art: "milk", say: "Du lait !" },
  farine: { art: "wheat", say: "De la farine !" },
  beurre: { art: "butter", say: "Du beurre !" },
  pate: { art: "bread", say: "De la pâte !" },
  tomate: { art: "tomato", say: "Une tomate !" },
  fromage: { art: "cheese", say: "Du fromage !" },
  champignon: { art: "mushroom", say: "Un champignon !" },
};

const RECIPES: { name: string; items: IngredientId[]; ask: string; done: string }[] = [
  {
    name: "CRÊPES",
    items: ["oeuf", "lait", "farine", "beurre"],
    ask: "Pour les crêpes, il faut un œuf, du lait, de la farine et du beurre. Cherche ce qui brille !",
    done: "Miam ! Des crêpes toutes chaudes !",
  },
  {
    name: "PIZZA",
    items: ["pate", "tomate", "fromage", "champignon"],
    ask: "Maintenant, une pizza ! Il faut de la pâte, une tomate, du fromage et un champignon.",
    done: "Et voilà une bonne pizza, toute chaude !",
  },
];

/** Where ingredients may hide; each game shuffles them. */
const HIDING_SPOTS: Vec3[] = [
  [-6, 0, 4],
  [6, 0, 3],
  [-13, 0, 1],
  [13, 0, 1],
  [-3, 0, 11],
  [4, 0, 12.5],
  [-8.5, 0, -9],
  [9.5, 0, -10],
  [-15.5, 0, -3.5],
  [15, 0, 6],
  [0, 0, 16],
  [-6, 0, 15],
];

/* ---------- small procedural ingredients ---------- */

function IngredientModel({ id }: { id: IngredientId }) {
  switch (id) {
    case "oeuf":
      return (
        <group>
          <mesh position-y={0.05} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.32, 0.12, 8, 20]} />
            <meshStandardMaterial color="#b45309" roughness={1} />
          </mesh>
          <mesh position-y={0.32} scale={[1, 1.3, 1]} castShadow>
            <sphereGeometry args={[0.25, 20, 16]} />
            <meshStandardMaterial color="#fde7c2" roughness={0.5} />
          </mesh>
        </group>
      );
    case "lait":
      return (
        <group>
          <mesh position-y={0.35} castShadow>
            <cylinderGeometry args={[0.24, 0.26, 0.7, 20]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position-y={0.8}>
            <cylinderGeometry args={[0.1, 0.22, 0.25, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position-y={0.97}>
            <cylinderGeometry args={[0.11, 0.11, 0.1, 16]} />
            <meshStandardMaterial color="#2563eb" />
          </mesh>
          <mesh position={[0, 0.38, 0.25]}>
            <planeGeometry args={[0.3, 0.22]} />
            <meshStandardMaterial color="#60a5fa" />
          </mesh>
        </group>
      );
    case "farine":
      return (
        <group>
          <mesh position-y={0.4} scale={[1, 1.1, 0.8]} castShadow>
            <sphereGeometry args={[0.38, 16, 12]} />
            <meshStandardMaterial color="#e7d3a8" roughness={1} />
          </mesh>
          <mesh position-y={0.82}>
            <cylinderGeometry args={[0.08, 0.16, 0.18, 10]} />
            <meshStandardMaterial color="#c8a978" roughness={1} />
          </mesh>
          <mesh position={[0, 0.42, 0.31]}>
            <circleGeometry args={[0.13, 16]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
        </group>
      );
    case "beurre":
      return (
        <group>
          <mesh position-y={0.04}>
            <cylinderGeometry args={[0.4, 0.4, 0.06, 24]} />
            <meshStandardMaterial color="#e0f2fe" />
          </mesh>
          <mesh position-y={0.2} castShadow>
            <boxGeometry args={[0.45, 0.26, 0.3]} />
            <meshStandardMaterial color="#fde047" roughness={0.4} />
          </mesh>
        </group>
      );
    case "pate":
      return (
        <mesh position-y={0.22} scale={[1, 0.65, 1]} castShadow>
          <sphereGeometry args={[0.36, 20, 16]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.8} />
        </mesh>
      );
    case "tomate":
      return (
        <group>
          <mesh position-y={0.3} scale={[1, 0.85, 1]} castShadow>
            <sphereGeometry args={[0.32, 20, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.26) * 0.1, 0.56, Math.sin(i * 1.26) * 0.1]} rotation={[Math.sin(i * 1.26) * 0.8, 0, -Math.cos(i * 1.26) * 0.8]}>
              <boxGeometry args={[0.05, 0.02, 0.18]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>
          ))}
        </group>
      );
    case "fromage":
      return (
        <mesh position-y={0.2} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.4, 3, 1, false, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color="#facc15" roughness={0.5} />
        </mesh>
      );
    case "champignon":
      return (
        <group>
          <mesh position-y={0.18}>
            <cylinderGeometry args={[0.1, 0.13, 0.36, 12]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
          <mesh position-y={0.36} castShadow>
            <sphereGeometry args={[0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.6) * 0.18, 0.56, Math.sin(i * 1.6) * 0.18]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      );
  }
}

/* ---------- the outdoor kitchen ---------- */

function Counter() {
  return (
    <group position={COUNTER_AT}>
      <mesh position-y={COUNTER_H / 2} castShadow receiveShadow>
        <boxGeometry args={[COUNTER_W, COUNTER_H, 1.6]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>
      <mesh position-y={COUNTER_H + 0.04} castShadow receiveShadow>
        <boxGeometry args={[COUNTER_W + 0.2, 0.08, 1.8]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.81]}>
          <boxGeometry args={[1.6, 0.7, 0.02]} />
          <meshStandardMaterial color="#c2410c" />
        </mesh>
      ))}
      {/* stove with a frying pan */}
      <mesh position={[-2.2, COUNTER_H + 0.1, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 24]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-2.2, COUNTER_H + 0.16, 0]}>
        <cylinderGeometry args={[0.5, 0.42, 0.1, 28, 1, true]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-2.2, COUNTER_H + 0.12, 0]}>
        <cylinderGeometry args={[0.43, 0.43, 0.02, 28]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-2.2, COUNTER_H + 0.18, 0.75]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* a big mixing bowl */}
      <mesh position={[0.8, COUNTER_H + 0.25, -0.3]}>
        <sphereGeometry args={[0.42, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#38bdf8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Oven({ heat }: { heat: React.MutableRefObject<number> }) {
  const fire = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const h = heat.current;
    const flicker = 0.85 + Math.sin(clock.elapsedTime * 13) * 0.1 + Math.sin(clock.elapsedTime * 7) * 0.05;
    if (fire.current) fire.current.color.set("#f97316").multiplyScalar((1.2 + h) * flicker);
    if (light.current) light.current.intensity = (4 + h * 14) * flicker;
  });
  return (
    <group position={OVEN_AT} rotation-y={-0.5}>
      <mesh position-y={0.5} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1, 2.6]} />
        <meshStandardMaterial color="#9a3412" roughness={1} />
      </mesh>
      <mesh position-y={1} castShadow>
        <sphereGeometry args={[1.25, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c2410c" roughness={1} />
      </mesh>
      <mesh position={[0, 2.3, -0.5]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 1, 12]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      <mesh position={[0, 1.38, 1.18]}>
        <circleGeometry args={[0.52, 24, 0, Math.PI]} />
        <meshBasicMaterial color="#1c1917" />
      </mesh>
      <mesh position={[0, 1.12, 1.19]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial ref={fire} color="#f97316" />
      </mesh>
      <pointLight ref={light} position={[0, 1.4, 1.6]} color="#fb923c" distance={6} decay={1.5} />
    </group>
  );
}

const ART_CACHE: Partial<Record<ArtKey, HTMLImageElement>> = {};
function artImage(art: ArtKey, onLoad: () => void) {
  let img = ART_CACHE[art];
  if (!img) {
    img = new Image();
    img.src = `/art/${art}.png`;
    ART_CACHE[art] = img;
  }
  if (!img.complete) img.addEventListener("load", onLoad, { once: true });
  return img;
}

type Kitchen = {
  recipe: number;
  /** Ingredients of the current recipe already on the counter. */
  have: IngredientId[];
  cooking: { start: number } | null;
  dishes: number;
};

/** The chalkboard above the counter: the recipe with a tick on each ingredient found. */
function RecipeBoard({ kitchenRef }: { kitchenRef: React.MutableRefObject<Kitchen> }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 400;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const last = useRef("");
  useFrame(() => {
    const k = kitchenRef.current;
    const recipe = RECIPES[Math.min(k.recipe, RECIPES.length - 1)];
    const allDone = k.recipe >= RECIPES.length;
    const key = `${k.recipe}|${k.have.join(",")}|${Object.keys(ART_CACHE).filter((a) => ART_CACHE[a as ArtKey]?.complete).length}`;
    if (key === last.current) return;
    last.current = key;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const redraw = () => {
      last.current = "";
    };
    ctx.fillStyle = "#1f3b2d";
    ctx.fillRect(0, 0, 1024, 400);
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 24;
    ctx.strokeRect(0, 0, 1024, 400);
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 76px system-ui, sans-serif";
    ctx.fillText(allDone ? "BRAVO CHEF !" : recipe.name, 512, 80);
    if (allDone) return void (mat.current?.map && (mat.current.map.needsUpdate = true));
    recipe.items.forEach((id, i) => {
      const x = 152 + i * 240;
      const img = artImage(INGREDIENTS[id].art, redraw);
      const got = k.have.includes(id);
      ctx.globalAlpha = got ? 1 : 0.45;
      if (img.complete) ctx.drawImage(img, x - 80, 150, 160, 160);
      ctx.globalAlpha = 1;
      if (got) {
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(x + 62, 290, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(x + 44, 290);
        ctx.lineTo(x + 58, 306);
        ctx.lineTo(x + 82, 274);
        ctx.stroke();
      }
    });
    if (mat.current?.map) mat.current.map.needsUpdate = true;
  });
  return (
    <group position={[0, 2.9, COUNTER_AT[2] - 1.4]}>
      <mesh>
        <planeGeometry args={[4.6, 1.8]} />
        <meshBasicMaterial ref={mat} map={texture} toneMapped={false} />
      </mesh>
      {[-2.1, 2.1].map((x) => (
        <mesh key={x} position={[x, -1.45, -0.05]}>
          <boxGeometry args={[0.14, 1.4, 0.14]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
    </group>
  );
}

/** A plump hen pottering about the square; she clucks when Loukas comes close. */
function Hen() {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const state = useRef({ x: HEN_HOME[0], z: HEN_HOME[2], tx: HEN_HOME[0], tz: HEN_HOME[2], wait: 0, clucked: 0 });
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.1);
    const t = clock.elapsedTime;
    const s = state.current;
    const near = distance2D(game.hero, s.x, s.z) < 2.5;
    if (near && t - s.clucked > 3) {
      s.clucked = t;
      sfx.cluck();
    }
    if (near) {
      // Flutter away from the hero.
      s.tx = s.x + (s.x - game.hero.x) * 1.5;
      s.tz = s.z + (s.z - game.hero.z) * 1.5;
    } else if (Math.hypot(s.tx - s.x, s.tz - s.z) < 0.2) {
      s.wait -= dt;
      if (s.wait <= 0) {
        s.wait = 1 + Math.random() * 2;
        s.tx = HEN_HOME[0] + (Math.random() - 0.5) * 6;
        s.tz = HEN_HOME[2] + (Math.random() - 0.5) * 5;
      }
    }
    s.tx = THREE.MathUtils.clamp(s.tx, HEN_HOME[0] - 4, HEN_HOME[0] + 4);
    s.tz = THREE.MathUtils.clamp(s.tz, HEN_HOME[2] - 3.5, HEN_HOME[2] + 3.5);
    const dx = s.tx - s.x;
    const dz = s.tz - s.z;
    const d = Math.hypot(dx, dz);
    const walking = d > 0.2;
    if (walking) {
      const speed = near ? 3.5 : 1.2;
      s.x += (dx / d) * Math.min(d, speed * dt);
      s.z += (dz / d) * Math.min(d, speed * dt);
    }
    const g = root.current;
    if (g) {
      g.position.set(s.x, walking ? Math.abs(Math.sin(t * 14)) * 0.08 : 0, s.z);
      if (walking) g.rotation.y = Math.atan2(dx, dz);
    }
    if (head.current) head.current.rotation.x = walking ? Math.sin(t * 14) * 0.25 : Math.max(0, Math.sin(t * 2)) * 0.6;
  });
  return (
    <group ref={root} position={HEN_HOME}>
      <mesh position-y={0.42} scale={[0.85, 0.8, 1.1]} castShadow>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshStandardMaterial color="#fafafa" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.62, -0.38]} rotation-x={-0.6}>
        <coneGeometry args={[0.2, 0.35, 10]} />
        <meshStandardMaterial color="#f5f5f4" />
      </mesh>
      <group ref={head} position={[0, 0.72, 0.3]}>
        <mesh position-y={0.12}>
          <sphereGeometry args={[0.17, 14, 10]} />
          <meshStandardMaterial color="#fafafa" />
        </mesh>
        <mesh position={[0, 0.3, 0]} scale={[0.4, 1, 1]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0.1, 0.18]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.05, 0.12, 8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, 0.15, 0.14]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        ))}
      </group>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.2, 6]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- the mission ---------- */

function MarketMission({ onScore, onPrompt }: MissionProps) {
  // Each game the ingredients hide in different places.
  const [spots] = useLazyGenerated(true, () => shuffle(HIDING_SPOTS));
  const kitchen = useRef<Kitchen>({ recipe: 0, have: [], cooking: null, dishes: 0 });
  const items = useRef<(THREE.Group | null)[]>([]);
  const flights = useRef<Record<string, { start: number; from: THREE.Vector3 } | undefined>>({});
  const crepe = useRef<THREE.Group>(null);
  const pizza = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Group>(null);
  const servedPizza = useRef<THREE.Group>(null);
  const heat = useRef(0);
  const shown = useRef<ActionPrompt | null>(null);
  const announced = useRef(false);
  const all = useMemo(() => RECIPES.flatMap((r) => r.items), []);

  const slotOf = (id: IngredientId) => {
    const r = RECIPES.findIndex((rc) => rc.items.includes(id));
    const i = RECIPES[r].items.indexOf(id);
    return new THREE.Vector3(COUNTER_AT[0] - 0.6 + i * 0.8, COUNTER_H + 0.08, COUNTER_AT[2] + 0.35);
  };

  useFrame(({ clock }) => {
    if (!spots) return;
    const t = clock.elapsedTime;
    const k = kitchen.current;
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __market: { spots, kitchen: k } });

    if (!announced.current && !game.paused) {
      announced.current = true;
      speak(RECIPES[0].ask);
    }

    // Ingredients of the current recipe float, glow and can be picked up.
    all.forEach((id, i) => {
      const g = items.current[i];
      if (!g) return;
      const recipeIndex = i < 4 ? 0 : 1;
      const home = spots[i];
      const flight = flights.current[id];
      const onCounter = flight && t - flight.start >= 0.8;
      const used = recipeIndex < k.recipe || (recipeIndex === k.recipe && k.cooking && t - k.cooking.start > 0.6);
      g.visible = !used && (recipeIndex === k.recipe || !!flight);
      if (!g.visible) return;
      if (flight) {
        const target = slotOf(id);
        const a = Math.min(1, (t - flight.start) / 0.8);
        g.position.lerpVectors(flight.from, target, a);
        g.position.y += Math.sin(a * Math.PI) * 2.5;
        g.rotation.y = a * Math.PI * 2;
        g.scale.setScalar(onCounter ? 0.8 : 1 - a * 0.2);
        return;
      }
      g.position.set(home[0], 0.6 + Math.sin(t * 2 + i) * 0.15, home[2]);
      g.rotation.y = t * 1.2 + i;
      if (!game.paused && distance2D(game.hero, home[0], home[2]) < 1.3) {
        flights.current[id] = { start: t, from: g.position.clone() };
        k.have = [...k.have, id];
        sfx.star();
        speak(INGREDIENTS[id].say);
        onScore();
        if (k.have.length === RECIPES[k.recipe].items.length) {
          setTimeout(() => {
            sfx.fanfare();
            speak("Tout est prêt ! Va à la cuisine et appuie sur Cuisiner !");
          }, 900);
        }
      }
    });

    // Cooking.
    const recipe = RECIPES[k.recipe];
    const ready = !!recipe && !k.cooking && k.have.length === recipe.items.length;
    const atCounter = distance2D(game.hero, COUNTER_AT[0], COUNTER_AT[2] + 1.6) < COOK_REACH;
    const want: ActionPrompt | null = ready && atCounter && !game.paused ? "cook" : null;
    if (want !== shown.current) {
      shown.current = want;
      onPrompt(want);
    }
    if (game.actionRequest) {
      game.actionRequest = false;
      if (want === "cook") {
        k.cooking = { start: t };
        game.target = null;
        startAction("interact", 1.4, new THREE.Vector3(COUNTER_AT[0], 0, COUNTER_AT[2]));
        sfx.splash();
      }
    }

    const c = crepe.current;
    const pz = pizza.current;
    if (k.cooking && recipe) {
      const e = t - k.cooking.start;
      if (k.recipe === 0 && c) {
        // The crêpe sizzles, flips twice, then lands on the plate.
        c.visible = true;
        if (e < 1) c.position.copy(PAN_AT);
        else if (e < 2.6) {
          const f = ((e - 1) % 0.8) / 0.8;
          c.position.set(PAN_AT.x, PAN_AT.y + Math.sin(f * Math.PI) * 1.3, PAN_AT.z);
          c.rotation.x = f * Math.PI * 2;
          if (Math.abs(f - 0.5) < 0.05) sfx.pop();
        } else c.position.copy(PAN_AT);
        if (e > 3.2) {
          c.visible = false;
          if (plate.current) plate.current.visible = true;
        }
      }
      if (k.recipe === 1 && pz) {
        // The pizza slides into the wood oven and comes out baked.
        pz.visible = true;
        const start = new THREE.Vector3(COUNTER_AT[0] + 1.6, COUNTER_H + 0.1, COUNTER_AT[2] + 0.2);
        const inside = new THREE.Vector3(OVEN_AT[0] - 0.3, 1.15, OVEN_AT[2] + 0.4);
        if (e < 1) pz.position.copy(start);
        else if (e < 1.8) pz.position.lerpVectors(start, inside, (e - 1) / 0.8);
        else if (e < 3.6) pz.position.copy(inside);
        else pz.position.lerpVectors(inside, start, Math.min(1, (e - 3.6) / 0.8));
        heat.current = e > 1.8 && e < 3.6 ? 1 : 0;
        const baked = e > 3.6;
        pz.children.forEach((ch) => {
          const m = (ch as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && ch.name === "base") m.color.set(baked ? "#e5a54b" : "#f5deb3");
        });
        if (e > 4.6) {
          pz.visible = false;
          if (servedPizza.current) servedPizza.current.visible = true;
        }
      }
      if (e > 3.4 + k.recipe * 1.4) {
        k.cooking = null;
        k.dishes += 1;
        k.recipe += 1;
        k.have = [];
        sfx.correct();
        speak(recipe.done);
        startAction("cheer", 1.8);
        onScore();
        if (k.recipe < RECIPES.length) setTimeout(() => speak(RECIPES[k.recipe].ask), 2600);
      }
    }
  });

  if (!spots) return null;
  return (
    <>
      <Counter />
      <Oven heat={heat} />
      <RecipeBoard kitchenRef={kitchen} />
      <Hen />
      {all.map((id, i) => (
        <group
          key={id}
          ref={(el) => {
            items.current[i] = el;
          }}
          position={spots[i]}
          visible={false}
        >
          <IngredientModel id={id} />
          <Sparkles count={10} scale={[1.4, 1.6, 1.4]} position={[0, 0.5, 0]} size={4} speed={0.5} color="#fff7c2" />
          <mesh position-y={-0.55} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.55, 0.75, 32]} />
            <meshBasicMaterial color="#fde047" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* the crêpe in the pan, and the finished plate */}
      <group ref={crepe} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
          <meshStandardMaterial color="#f3c46b" roughness={0.6} />
        </mesh>
      </group>
      <group ref={plate} position={[-0.8, COUNTER_H + 0.1, COUNTER_AT[2] - 0.3]} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.42, 0.05, 28]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position-y={0.05 + i * 0.035} rotation-y={i}>
            <cylinderGeometry args={[0.4, 0.4, 0.03, 24]} />
            <meshStandardMaterial color={i % 2 ? "#eab35a" : "#f3c46b"} />
          </mesh>
        ))}
        <mesh position-y={0.25}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#7c2d12" />
        </mesh>
      </group>
      <group ref={pizza} visible={false}>
        <PizzaModel />
      </group>
      <group ref={servedPizza} position={[1.9, COUNTER_H + 0.1, COUNTER_AT[2] + 0.1]} visible={false}>
        <PizzaModel baked />
      </group>
    </>
  );
}

function PizzaModel({ baked = false }: { baked?: boolean }) {
  const toppings = useMemo(() => {
    const rand = seeded(9);
    return Array.from({ length: 9 }, (_, i) => ({
      x: (rand() - 0.5) * 0.6,
      z: (rand() - 0.5) * 0.6,
      color: i % 3 === 0 ? "#dc2626" : i % 3 === 1 ? "#f8fafc" : "#7c2d12",
    }));
  }, []);
  return (
    <group>
      <mesh name="base">
        <cylinderGeometry args={[0.5, 0.5, 0.05, 28]} />
        <meshStandardMaterial color={baked ? "#e5a54b" : "#f5deb3"} />
      </mesh>
      <mesh position-y={0.03}>
        <cylinderGeometry args={[0.43, 0.43, 0.02, 28]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position-y={0.045}>
        <cylinderGeometry args={[0.38, 0.38, 0.015, 28]} />
        <meshStandardMaterial color={baked ? "#fbbf24" : "#fef08a"} />
      </mesh>
      {toppings.map((tp, i) => (
        <mesh key={i} position={[tp.x, 0.07, tp.z]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color={tp.color} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- the market square ---------- */

const buildings: Placed[] = [
  { model: MED("building_market_blue"), position: [-11, 0, -5], rotation: 0.7, scale: 2.6, collide: 2.3 },
  { model: MED("building_market_blue"), position: [11.5, 0, -4], rotation: -0.7, scale: 2.6, collide: 2.3 },
  { model: MED("building_windmill_blue"), position: [-6, 0, -15], rotation: 0.3, scale: 3.2, collide: 2 },
  { model: MED("building_tavern_blue"), position: [12, 0, -12.5], rotation: -0.5, scale: 3, collide: 2 },
  { model: MED("building_home_A_blue"), position: [3, 0, -15.5], scale: 3, collide: 1.4 },
  { model: MED("building_home_B_blue"), position: [-15.5, 0, -11], rotation: 0.9, scale: 3, collide: 1.5 },
  { model: MED("building_well_blue"), position: [8, 0, 8], scale: 2.6, collide: 1 },
  { model: MED("tent"), position: [-14, 0, 5], rotation: 0.4, scale: 3, collide: 0.9 },
  { model: MED("tent"), position: [16, 0, 0], rotation: -0.3, scale: 3, collide: 0.9 },
  { model: MED("barrel"), position: [-9.4, 0, -1.6], scale: 3, collide: 0.35 },
  { model: MED("barrel"), position: [-8.7, 0, -2.3], scale: 3, collide: 0.35 },
  { model: MED("crate_A_big"), position: [9.5, 0, -1], rotation: 0.4, scale: 3, collide: 0.4 },
  { model: MED("crate_A_big"), position: [10.2, 0, -0.4], rotation: 0.9, scale: 3, collide: 0.4 },
  { model: MED("sack"), position: [7.2, 0, -7.5], scale: 4 },
  { model: MED("sack"), position: [7.8, 0, -7.1], scale: 4 },
  { model: MED("wheelbarrow"), position: [-4.5, 0, -8.5], rotation: 1, scale: 3, collide: 0.5 },
  { model: MED("bucket_water"), position: [8.8, 0, 9.2], scale: 3 },
];

const trees: Placed[] = (() => {
  const rand = seeded(23);
  const list: Placed[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rand() * 0.2;
    const d = 19 + rand() * 4;
    list.push({ model: MED(rand() > 0.5 ? "tree_single_A" : "tree_single_B"), position: [Math.cos(a) * d, 0, Math.sin(a) * d], rotation: rand() * 6, scale: 2.6 + rand() });
  }
  return list;
})();

/** Fruit and vegetable stands for colour. */
function ProduceStand({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const fruit = useMemo(() => {
    const rand = seeded(Math.round(position[0] * 7 + position[2]));
    const colors = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#a855f7"];
    return Array.from({ length: 18 }, (_, i) => ({ x: -0.9 + (i % 6) * 0.36, z: -0.3 + Math.floor(i / 6) * 0.3, c: colors[Math.floor(rand() * colors.length)] }));
  }, [position]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.45} castShadow>
        <boxGeometry args={[2.4, 0.9, 1.1]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      {fruit.map((f, i) => (
        <mesh key={i} position={[f.x, 0.98, f.z]} castShadow>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial color={f.c} roughness={0.5} />
        </mesh>
      ))}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.4, -0.45]}>
          <cylinderGeometry args={[0.05, 0.05, 1.9, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      <mesh position={[0, 2.3, -0.1]} rotation-x={0.35}>
        <boxGeometry args={[2.6, 0.06, 1.3]} />
        <meshStandardMaterial color="#e11d48" />
      </mesh>
    </group>
  );
}

const STANDS: { p: Vec3; r: number }[] = [
  { p: [-6, 0, -9.5], r: 0.3 },
  { p: [13, 0, 10], r: -2.3 },
];

function MarketScene() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[300, 48]} />
        <meshStandardMaterial color="#7cc363" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.015} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#d8c8a6" roughness={1} />
      </mesh>
      <Path points={[[0, 22], [0, 14]]} width={3} color="#d8c8a6" />
      <Props items={buildings} />
      <Instanced items={trees} />
      {STANDS.map((s, i) => (
        <ProduceStand key={i} position={s.p} rotation={s.r} />
      ))}
      <Clouds seed={17} height={24} />
    </>
  );
}

export const market: WorldDef = {
  spawn: [0, 0, 10],
  bounds: { kind: "circle", r: 19 },
  colliders: [
    ...collidersOf(buildings),
    { x: COUNTER_AT[0], z: COUNTER_AT[2], hw: COUNTER_W / 2 + 0.1, hd: 0.9 },
    { x: OVEN_AT[0], z: OVEN_AT[2], r: 1.7 },
    ...STANDS.map((s) => ({ x: s.p[0], z: s.p[2], r: 1.3 })),
  ],
  stars: [],
  spots: {
    pain: [5.5, 0, -2.6],
    poule: [-11, 0, 13],
    lait: [10.5, 0, 4.5],
    chocolat: [-12.5, 0, -8.5],
  },
  sky: { top: "#4fa8f0", horizon: "#fde7c2", fog: "#f2e2c8", fogNear: 45, fogFar: 140 },
  camera: { height: 8, distance: 11.5 },
  Scene: MarketScene,
  Mission: MarketMission,
};
