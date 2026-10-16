"use client";

import { Billboard, Sparkles, useTexture } from "@react-three/drei";
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

type IngredientId =
  | "oeuf" | "lait" | "farine" | "beurre" | "pate" | "tomate" | "fromage" | "champignon"
  | "pommedeterre" | "huile" | "sel" | "chocolat" | "fraise" | "poulet" | "oignon" | "herbes" | "ail";

/** Each ingredient is shown with the very same picture in the world and on the chalkboard. */
const INGREDIENTS: Record<IngredientId, { art: ArtKey; say: string }> = {
  oeuf: { art: "egg", say: "Un œuf !" },
  lait: { art: "milk", say: "Du lait !" },
  farine: { art: "wheat", say: "De la farine !" },
  beurre: { art: "butter", say: "Du beurre !" },
  pate: { art: "flatbread", say: "De la pâte à pizza !" },
  tomate: { art: "tomato", say: "Une tomate !" },
  fromage: { art: "cheese", say: "Du fromage !" },
  champignon: { art: "mushroom", say: "Un champignon !" },
  pommedeterre: { art: "potato", say: "Des pommes de terre !" },
  huile: { art: "olive", say: "De l'huile d'olive !" },
  sel: { art: "salt", say: "Du sel !" },
  chocolat: { art: "chocolate", say: "Du chocolat !" },
  fraise: { art: "strawberry", say: "Une fraise !" },
  poulet: { art: "poultry-leg", say: "Du poulet !" },
  oignon: { art: "onion", say: "Un oignon !" },
  herbes: { art: "herb", say: "Des herbes !" },
  ail: { art: "garlic", say: "De l'ail !" },
};

type Method = "pan" | "pot" | "oven";
type Recipe = { name: string; dish: ArtKey; method: Method; items: IngredientId[]; ask: string; done: string };

const RECIPES: Recipe[] = [
  {
    name: "CRÊPES",
    dish: "pancakes",
    method: "pan",
    items: ["oeuf", "lait", "farine", "beurre"],
    ask: "Pour les crêpes, il faut un œuf, du lait, de la farine et du beurre. Cherche ce qui brille !",
    done: "Miam ! Des crêpes toutes chaudes !",
  },
  {
    name: "PIZZA",
    dish: "pizza",
    method: "oven",
    items: ["pate", "tomate", "fromage", "champignon"],
    ask: "Pour la pizza, il faut de la pâte, une tomate, du fromage et un champignon.",
    done: "Et voilà une bonne pizza, toute chaude !",
  },
  {
    name: "FRITES",
    dish: "fries",
    method: "pot",
    items: ["pommedeterre", "huile", "sel", "tomate"],
    ask: "Pour les frites, il faut des pommes de terre, de l'huile, du sel, et une tomate pour faire le ketchup !",
    done: "Des frites bien dorées, avec du ketchup !",
  },
  {
    name: "CUPCAKES",
    dish: "cupcake",
    method: "oven",
    items: ["farine", "oeuf", "chocolat", "fraise"],
    ask: "Pour les cupcakes, il faut de la farine, un œuf, du chocolat et une fraise pour décorer.",
    done: "Des cupcakes au chocolat ! Trop bons !",
  },
  {
    name: "POULET RÔTI",
    dish: "poultry-leg",
    method: "oven",
    items: ["poulet", "pommedeterre", "oignon", "herbes"],
    ask: "Pour le poulet rôti, il faut du poulet, des pommes de terre, un oignon et des herbes.",
    done: "Un bon poulet rôti avec ses pommes de terre !",
  },
  {
    name: "SPAGHETTIS",
    dish: "spaghetti",
    method: "pot",
    items: ["tomate", "oignon", "ail", "fromage"],
    ask: "Pour les spaghettis à la tomate, il faut une tomate, un oignon, de l'ail et du fromage.",
    done: "Des spaghettis à la sauce tomate ! Miam !",
  },
];
const RECIPES_PER_GAME = 2;
const ALL_ART = [...new Set([...Object.values(INGREDIENTS).map((i) => i.art), ...RECIPES.map((r) => r.dish)])];

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

/* ---------- pictures ---------- */

function useFoodTextures() {
  const urls = useMemo(() => Object.fromEntries(ALL_ART.map((a) => [a, `/art/${a}.png`])), []);
  return useTexture(urls, (loaded) => {
    for (const t of Object.values(loaded as Record<string, THREE.Texture>)) t.colorSpace = THREE.SRGBColorSpace;
  }) as Record<string, THREE.Texture>;
}

/** A food picture standing in the world, always facing the camera, exactly like on the chalkboard. */
function Picture({ texture, size }: { texture: THREE.Texture; size: number }) {
  return (
    <Billboard>
      <mesh>
        <planeGeometry args={[size, size]} />
        {/* Slightly below white so the bloom effect does not wash the pictures out. */}
        <meshBasicMaterial map={texture} color="#ebebeb" transparent alphaTest={0.05} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function WickerBasket() {
  return (
    <group>
      <mesh position-y={0.22} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.42, 0.44, 20, 1, true]} />
        <meshStandardMaterial color="#c08a4a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={0.04}>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 20]} />
        <meshStandardMaterial color="#a16207" roughness={1} />
      </mesh>
      {[0.12, 0.3].map((y) => (
        <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.47 + y * 0.18, 0.03, 6, 24]} />
          <meshStandardMaterial color="#92400e" roughness={1} />
        </mesh>
      ))}
      <mesh position-y={0.44} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.55, 0.05, 8, 28]} />
        <meshStandardMaterial color="#92400e" roughness={1} />
      </mesh>
    </group>
  );
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
      {/* a second burner, for the pot */}
      <mesh position={[-1.05, COUNTER_H + 0.1, -0.1]}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 24]} />
        <meshStandardMaterial color="#1f2937" />
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

/** The pot for frites and spaghettis: it bubbles and steams while cooking. */
function Pot({ boilRef }: { boilRef: React.MutableRefObject<number> }) {
  const lid = useRef<THREE.Mesh>(null);
  const steam = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const b = boilRef.current;
    if (lid.current) {
      lid.current.position.y = 0.66 + (b ? Math.abs(Math.sin(t * 18)) * 0.06 : 0);
      lid.current.rotation.z = b ? Math.sin(t * 23) * 0.06 : 0;
    }
    steam.current.forEach((m, i) => {
      if (!m) return;
      const k = (t * 0.7 + i / 6) % 1;
      m.visible = b > 0;
      m.position.set(Math.sin(i * 2.3 + t) * 0.2 * k, 0.8 + k * 1.6, Math.cos(i * 1.7) * 0.15 * k);
      m.scale.setScalar(0.15 + k * 0.35);
      (m.material as THREE.MeshStandardMaterial).opacity = (1 - k) * 0.6;
    });
  });
  return (
    <group position={[COUNTER_AT[0] - 1.05, COUNTER_H + 0.13, COUNTER_AT[2] - 0.1]}>
      <mesh position-y={0.3} castShadow>
        <cylinderGeometry args={[0.45, 0.4, 0.6, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.5, 0.48, 0]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[0.08, 0.025, 6, 12]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      <mesh ref={lid} position-y={0.66}>
        <cylinderGeometry args={[0.47, 0.47, 0.05, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            steam.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
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
  recipes: Recipe[];
  /** Index into recipes of the dish being prepared. */
  recipe: number;
  /** Ingredients of the current recipe already on the counter. */
  have: IngredientId[];
  cooking: { start: number } | null;
};

/** The chalkboard above the counter: the dish, and each ingredient with a tick once found. */
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
    const allDone = k.recipe >= k.recipes.length;
    const recipe = k.recipes[Math.min(k.recipe, k.recipes.length - 1)];
    const loaded = Object.values(ART_CACHE).filter((img) => img?.complete).length;
    const key = `${k.recipe}|${k.have.join(",")}|${loaded}`;
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
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 72px system-ui, sans-serif";
    const title = allDone ? "BRAVO CHEF !" : recipe.name;
    const dishImg = artImage(allDone ? "cook" : recipe.dish, redraw);
    const titleW = ctx.measureText(title).width;
    const startX = 512 - (titleW + 110) / 2;
    if (dishImg.complete) ctx.drawImage(dishImg, startX, 32, 96, 96);
    ctx.fillText(title, startX + 110, 82);
    if (!allDone) {
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
    }
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

const SLOT_X0 = 0;
const PLATES: Vec3[] = [
  [COUNTER_AT[0] + 1.2, COUNTER_H + 0.1, COUNTER_AT[2] - 0.45],
  [COUNTER_AT[0] + 2.4, COUNTER_H + 0.1, COUNTER_AT[2] - 0.45],
];
const COOK_TIME: Record<Method, number> = { pan: 3.4, pot: 3, oven: 4.6 };

function slot(i: number) {
  return new THREE.Vector3(COUNTER_AT[0] + SLOT_X0 + i * 0.8, COUNTER_H + 0.45, COUNTER_AT[2] + 0.4);
}

function MarketMission({ onScore, onPrompt }: MissionProps) {
  const textures = useFoodTextures();
  // Each game: two recipes drawn at random, and ingredients hidden in new places.
  const [setup] = useLazyGenerated(true, () => ({
    recipes: shuffle(RECIPES).slice(0, RECIPES_PER_GAME),
    spots: shuffle(HIDING_SPOTS),
  }));
  const kitchen = useRef<Kitchen>({ recipes: [], recipe: 0, have: [], cooking: null });
  const items = useRef<(THREE.Group | null)[]>([]);
  const flights = useRef<Record<string, { start: number; from: THREE.Vector3 } | undefined>>({});
  const crepe = useRef<THREE.Group>(null);
  const cloche = useRef<THREE.Group>(null);
  const clocheLid = useRef<THREE.Group>(null);
  const plates = useRef<(THREE.Group | null)[]>([]);
  const heat = useRef(0);
  const boil = useRef(0);
  const shown = useRef<ActionPrompt | null>(null);
  const announced = useRef(false);

  // One entry per ingredient instance (the same ingredient can appear in both recipes).
  const entries = useMemo(
    () => (setup ? setup.recipes.flatMap((r, ri) => r.items.map((id, ii) => ({ key: `${ri}:${id}`, id, recipe: ri, index: ii }))) : []),
    [setup],
  );

  useFrame(({ clock }) => {
    if (!setup) return;
    const t = clock.elapsedTime;
    const k = kitchen.current;
    if (k.recipes !== setup.recipes) k.recipes = setup.recipes;
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __market: { spots: setup.spots, kitchen: k } });

    if (!announced.current && !game.paused) {
      announced.current = true;
      speak(k.recipes[0].ask);
    }

    entries.forEach((en, i) => {
      const g = items.current[i];
      if (!g) return;
      const home = setup.spots[i];
      const flight = flights.current[en.key];
      const used = en.recipe < k.recipe || (en.recipe === k.recipe && !!k.cooking && t - k.cooking.start > 0.6);
      g.visible = !used && (en.recipe === k.recipe || !!flight);
      if (!g.visible) return;
      const basket = g.children[0];
      const pic = g.children[1];
      if (flight) {
        basket.visible = false;
        const a = Math.min(1, (t - flight.start) / 0.8);
        g.position.set(0, 0, 0);
        pic.position.lerpVectors(flight.from, slot(en.index), a);
        pic.position.y += Math.sin(a * Math.PI) * 2.5;
        pic.scale.setScalar(1 - a * 0.55);
        return;
      }
      g.position.set(home[0], 0, home[2]);
      pic.position.set(0, 1.25 + Math.sin(t * 2 + i) * 0.15, 0);
      if (!game.paused && distance2D(game.hero, home[0], home[2]) < 1.3) {
        flights.current[en.key] = { start: t, from: new THREE.Vector3(home[0], 1.25, home[2]) };
        k.have = [...k.have, en.id];
        sfx.star();
        speak(INGREDIENTS[en.id].say);
        onScore();
        if (k.have.length === k.recipes[k.recipe].items.length) {
          setTimeout(() => {
            sfx.fanfare();
            speak("Tout est prêt ! Va à la cuisine et appuie sur Cuisiner !");
          }, 900);
        }
      }
    });

    const recipe = k.recipes[k.recipe];
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
    const cl = cloche.current;
    heat.current = 0;
    boil.current = 0;
    if (c) c.visible = false;
    if (cl) cl.visible = false;
    if (k.cooking && recipe) {
      const e = t - k.cooking.start;
      if (recipe.method === "pan" && c) {
        // The crêpe sizzles, flips twice, then lands on the plate.
        c.visible = e < 3.2;
        if (e > 1 && e < 2.6) {
          const f = ((e - 1) % 0.8) / 0.8;
          c.position.set(PAN_AT.x, PAN_AT.y + Math.sin(f * Math.PI) * 1.3, PAN_AT.z);
          c.rotation.x = f * Math.PI * 2;
        } else {
          c.position.copy(PAN_AT);
          c.rotation.x = 0;
        }
      }
      if (recipe.method === "pot") boil.current = e < 2.8 ? 1 : 0;
      if (recipe.method === "oven" && cl) {
        // A covered dish slides into the wood oven and comes back out.
        cl.visible = e < COOK_TIME.oven;
        const start = new THREE.Vector3(...PLATES[k.recipe]);
        const inside = new THREE.Vector3(OVEN_AT[0] - 0.3, 1.15, OVEN_AT[2] + 0.4);
        if (e < 1) cl.position.copy(start);
        else if (e < 1.8) cl.position.lerpVectors(start, inside, (e - 1) / 0.8);
        else if (e < 3.6) cl.position.copy(inside);
        else cl.position.lerpVectors(inside, start, Math.min(1, (e - 3.6) / 0.8));
        heat.current = e > 1.8 && e < 3.6 ? 1 : 0;
      }
      if (e > COOK_TIME[recipe.method]) {
        k.cooking = null;
        k.recipe += 1;
        k.have = [];
        sfx.correct();
        speak(recipe.done);
        startAction("cheer", 1.8);
        onScore();
        if (k.recipe < k.recipes.length) setTimeout(() => speak(k.recipes[k.recipe].ask), 2600);
      }
    }
    // Finished dishes pop up on their plates.
    plates.current.forEach((pl, i) => {
      if (!pl) return;
      const served = i < k.recipe;
      pl.visible = served;
      const pic = pl.children[1];
      if (served && pic) pic.position.y = 0.5 + Math.sin(t * 2 + i) * 0.04;
    });
  });

  if (!setup) return null;
  return (
    <>
      <Counter />
      <Pot boilRef={boil} />
      <Oven heat={heat} />
      <RecipeBoard kitchenRef={kitchen} />
      <Hen />
      {entries.map((en, i) => (
        <group
          key={en.key}
          ref={(el) => {
            items.current[i] = el;
          }}
          visible={false}
        >
          <group>
            <WickerBasket />
            <Sparkles count={10} scale={[1.4, 1.8, 1.4]} position={[0, 1.1, 0]} size={4} speed={0.5} color="#fff7c2" />
            <mesh position-y={0.03} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.7, 0.9, 32]} />
              <meshBasicMaterial color="#fde047" transparent opacity={0.75} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
          <group>
            <Picture texture={textures[INGREDIENTS[en.id].art]} size={1.25} />
          </group>
        </group>
      ))}
      <group ref={crepe} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
          <meshStandardMaterial color="#f3c46b" roughness={0.6} />
        </mesh>
      </group>
      <group ref={cloche} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.45, 0.05, 28]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <group ref={clocheLid}>
          <mesh position-y={0.03}>
            <sphereGeometry args={[0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position-y={0.48}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>
      </group>
      {setup.recipes.map((r, i) => (
        <group
          key={r.name}
          ref={(el) => {
            plates.current[i] = el;
          }}
          position={PLATES[i]}
          visible={false}
        >
          <mesh>
            <cylinderGeometry args={[0.5, 0.42, 0.05, 28]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <group position-y={0.5}>
            <Picture texture={textures[r.dish]} size={0.95} />
          </group>
          <Sparkles count={12} scale={[1.2, 1, 1.2]} position={[0, 0.6, 0]} size={4} speed={0.6} color="#fff7c2" />
        </group>
      ))}
    </>
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
