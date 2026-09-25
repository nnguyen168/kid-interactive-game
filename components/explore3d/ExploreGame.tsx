"use client";

import { PerformanceMonitor, useProgress as useLoadProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import Art from "@/components/Art";
import { candyStyle, CANDY_PRESS } from "@/components/ui/CandyButton";
import { EXPLORE_FACTS, MISSIONS } from "@/lib/content/explore";
import { ArtKey } from "@/lib/art";
import { useProgress } from "@/lib/ProgressContext";
import { sfx } from "@/lib/sfx";
import { ThemeId } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { game, resetGame } from "./game";
import Hero from "./Hero";
import { Spot, Stars } from "./Pickups";
import { CameraRig, Effects, GroundClick, Lights, SkyDome, useKeyboardControls } from "./Stage";
import { ActionPrompt, WorldDef } from "./types";
import { city } from "./worlds/city";
import { kingdom } from "./worlds/kingdom";
import { raceway } from "./worlds/raceway";
import { stadium } from "./worlds/stadium";

const WORLDS: Record<ThemeId, WorldDef> = {
  chevalier: kingdom,
  pompier: city,
  foot: stadium,
  course: raceway,
};

const PROMPTS: Record<ActionPrompt, { label: string; art: ArtKey; color?: string }> = {
  spray: { label: "Arroser !", art: "droplet", color: "#0ea5e9" },
  kick: { label: "Tirer !", art: "ball" },
  slash: { label: "Épée !", art: "swords" },
  climb: { label: "Grimper !", art: "ladder", color: "#f59e0b" },
  descend: { label: "Descendre", art: "ladder", color: "#f59e0b" },
  wave: { label: "Saluer !", art: "wave", color: "#a855f7" },
  turbo: { label: "Turbo !", art: "rocket", color: "#0ea5e9" },
};

/**
 * Mounted inside the Suspense boundary, once every model is loaded: compiles all
 * shaders up front (no stutter on the first frames), then reports after a couple
 * of drawn frames so the loading screen hides only when the world is visible.
 */
function WorldReady({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  const compiled = useRef(false);
  const frames = useRef(0);
  useEffect(() => {
    let alive = true;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (alive) compiled.current = true;
      });
    return () => {
      alive = false;
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    if (!compiled.current) return;
    frames.current += 1;
    if (frames.current === 3) onReady();
  });
  return null;
}

function LoadingOverlay({ themeId, done }: { themeId: ThemeId; done: boolean }) {
  const { progress } = useLoadProgress();
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(t);
  }, [done]);
  if (gone) return null;
  const theme = THEMES[themeId];
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 transition-opacity duration-500 ${done ? "opacity-0" : "opacity-100"}`}
      style={{ background: `linear-gradient(${theme.sky.top}, ${theme.sky.bottom})` }}
    >
      <Art name={theme.iconArt} className="float-y w-28 h-28 lg:w-40 lg:h-40" eager />
      <p className="text-2xl font-bold text-white drop-shadow lg:text-4xl">On prépare le monde…</p>
      <div className="h-6 w-64 overflow-hidden rounded-full border-4 border-white bg-white/40 lg:w-96">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.round(progress)}%`, background: theme.colors.secondary }} />
      </div>
    </div>
  );
}

export default function ExploreGame({
  themeId,
  visited,
  paused,
  onDiscover,
  onWin,
}: {
  themeId: ThemeId;
  visited: string[];
  paused: boolean;
  onDiscover: (id: string) => void;
  onWin: () => void;
}) {
  const world = WORLDS[themeId];
  const mission = MISSIONS[themeId];
  const facts = EXPLORE_FACTS[themeId];
  const theme = THEMES[themeId];
  const [taken, setTaken] = useState<boolean[]>(() => world.stars.map(() => false));
  const [score, setScore] = useState(0);
  const [prompt, setPrompt] = useState<ActionPrompt | null>(null);
  const [high, setHigh] = useState(true);
  const [hint, setHint] = useState(true);
  const [drawn, setDrawn] = useState(false);
  const { addBonusStars } = useProgress();
  const [view, setView] = useState<"chase" | "cockpit">("chase");
  const vehicle = !!world.vehicle;

  useKeyboardControls();

  // Keyboard: Space or Enter fires the action button (or jumps when there is none), J jumps.
  const actionReady = useRef(false);
  const pausedRef = useRef(paused);
  useEffect(() => {
    actionReady.current = prompt !== null && !paused;
    pausedRef.current = paused;
  }, [prompt, paused]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isAction = e.key === " " || e.key === "Enter";
      const isJump = e.code === "KeyJ";
      if (e.code === "KeyV" && !e.repeat) {
        if (vehicle && !pausedRef.current) {
          game.view = game.view === "chase" ? "cockpit" : "chase";
          setView(game.view);
          sfx.pop();
        }
        return;
      }
      if (!isAction && !isJump) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea")) return;
      e.preventDefault();
      if (e.repeat || pausedRef.current) return;
      if (isAction && actionReady.current) {
        sfx.pop();
        game.actionRequest = true;
      } else {
        game.jumpRequest = true;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vehicle]);

  useEffect(() => {
    resetGame(world.spawn);
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __game: game, __world: world });
  }, [world]);

  useEffect(() => {
    game.paused = paused;
    if (paused) game.target = null;
  }, [paused]);

  useEffect(() => {
    if (!drawn) return;
    const t = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(t);
  }, [drawn]);

  function addScore() {
    addBonusStars(1);
    setScore((s) => {
      const next = s + 1;
      if (next === mission.goalCount) setTimeout(onWin, 1400);
      return next;
    });
  }

  function takeStar(i: number) {
    sfx.star();
    setTaken((prev) => prev.map((v, j) => (j === i ? true : v)));
    if (world.starsScore) addScore();
  }

  function act() {
    sfx.pop();
    game.actionRequest = true;
  }

  function jump() {
    game.jumpRequest = true;
  }



  function toggleView() {
    if (!world.vehicle) return;
    game.view = game.view === "chase" ? "cockpit" : "chase";
    setView(game.view);
    sfx.pop();
  }

  /** Holds a direction/pedal while an on-screen button is pressed (tablets). */
  function pedal(key: keyof typeof game.keys) {
    const release = () => {
      game.keys[key] = false;
    };
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.stopPropagation();
        game.keys[key] = true;
      },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      tabIndex: -1,
    };
  }

  const Mission = world.Mission;
  const goalShown = Math.min(score, mission.goalCount);

  return (
    <div className="absolute inset-0 touch-none select-none" onPointerDown={() => hint && setHint(false)}>
      <Canvas
        shadows="percentage"
        dpr={high ? [1, 1.75] : [1, 1.25]}
        camera={{ fov: 42, near: 0.5, far: 600, position: [0, 12, 26] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <PerformanceMonitor onDecline={() => setHigh(false)} />
        <SkyDome top={world.sky.top} horizon={world.sky.horizon} />
        <fog attach="fog" args={[world.sky.fog, world.sky.fogNear, world.sky.fogFar]} />
        <Lights />
        <CameraRig world={world} />
        <GroundClick />
        <Suspense fallback={null}>
          <world.Scene />
          <Hero themeId={themeId} world={world} />
          <Stars positions={world.stars} taken={taken} onTake={takeStar} />
          {facts.map((f) =>
            world.spots[f.id] ? (
              <Spot key={f.id} position={world.spots[f.id]} art={f.art} visited={visited.includes(f.id)} onEnter={() => onDiscover(f.id)} />
            ) : null,
          )}
          {Mission && <Mission onScore={addScore} onPrompt={setPrompt} world={world} />}
          <WorldReady onReady={() => setDrawn(true)} />
        </Suspense>
        <Suspense fallback={null}>
          <Effects high={high} />
        </Suspense>
      </Canvas>

      {/* Mission panel */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2 lg:left-6 lg:top-6">
        <div className="flex items-center gap-3 rounded-[1.6rem] border-4 border-white bg-white/90 py-2 pl-2 pr-5 shadow-[0_6px_0_rgba(0,0,0,0.15)]">
          <Art name={mission.goalArt} className="w-12 h-12 lg:w-16 lg:h-16" eager />
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wide lg:text-base" style={{ color: theme.colors.text }}>
              {mission.goalLabel}
            </span>
            <span className="text-2xl font-extrabold lg:text-4xl" style={{ color: theme.colors.primary }}>
              {goalShown} / {mission.goalCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 self-start rounded-full border-4 border-white bg-white/90 px-2 py-1 shadow-[0_5px_0_rgba(0,0,0,0.12)]">
          {facts.map((f) => (
            <Art
              key={f.id}
              name={f.art}
              className={`w-9 h-9 transition lg:w-11 lg:h-11 ${visited.includes(f.id) ? "" : "opacity-30 grayscale"}`}
              eager
            />
          ))}
        </div>
      </div>

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-3">
          <div className="rise-in flex items-center gap-3 rounded-full border-4 border-white bg-white/90 px-5 py-2 text-lg font-bold text-slate-700 shadow-lg lg:text-2xl">
            <Art name="sparkles" className="w-8 h-8 lg:w-10 lg:h-10" eager />
            {world.vehicle ? "↑ pour accélérer, ← → pour tourner !" : "Touche le sol ou les flèches pour marcher !"}
          </div>
        </div>
      )}

      {!paused && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            jump();
          }}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          aria-label="Sauter"
          className={`absolute bottom-5 flex flex-col items-center justify-center rounded-full border-4 border-white text-white lg:bottom-8 ${CANDY_PRESS} ${prompt ? "right-[calc(min(34vw,11rem)+2rem)] lg:right-[calc(11rem+3rem)]" : "right-5 lg:right-8"}`}
          style={{ ...candyStyle("#22c55e"), width: "min(22vw, 7rem)", height: "min(22vw, 7rem)" }}
        >
          <span className="text-4xl leading-none drop-shadow lg:text-5xl">⤴</span>
          <span className="text-base font-extrabold drop-shadow lg:text-lg">Sauter</span>
          <span className="hidden rounded-md bg-white/25 px-1.5 text-xs font-bold [@media(hover:hover)]:inline">J</span>
        </button>
      )}

      {prompt && !paused && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            act();
          }}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className={`pop-in absolute bottom-5 right-5 flex flex-col items-center justify-center rounded-full border-4 border-white text-white lg:bottom-8 lg:right-8 ${CANDY_PRESS}`}
          style={{ ...candyStyle(PROMPTS[prompt].color ?? theme.colors.primary), width: "min(34vw, 11rem)", height: "min(34vw, 11rem)" }}
        >
          <Art name={PROMPTS[prompt].art} className="w-16 h-16 lg:w-20 lg:h-20" eager />
          <span className="text-xl font-extrabold drop-shadow lg:text-2xl">{PROMPTS[prompt].label}</span>
          <span className="mt-1 hidden rounded-md bg-white/25 px-2 text-sm font-bold [@media(hover:hover)]:inline">Espace</span>
        </button>
      )}

      {world.vehicle && !paused && (
        <>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              toggleView();
            }}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
            className={`absolute right-3 top-3 flex items-center gap-2 rounded-full border-4 border-white bg-white/90 py-1.5 pl-2 pr-4 text-base font-bold text-slate-700 shadow-[0_5px_0_rgba(0,0,0,0.12)] lg:right-6 lg:top-6 lg:text-xl ${CANDY_PRESS}`}
          >
            <Art name={view === "chase" ? "racing-car" : "checkered-flag"} className="w-9 h-9 lg:w-11 lg:h-11" eager />
            {view === "chase" ? "Vue pilote" : "Vue de derrière"}
            <span className="hidden rounded-md bg-slate-200 px-1.5 text-xs [@media(hover:hover)]:inline">V</span>
          </button>
          {/* Steering and pedals for touch screens */}
          <div className="absolute bottom-5 left-3 flex items-end gap-3 lg:bottom-8 lg:left-6 [@media(hover:hover)]:opacity-70">
            {(
              [
                ["left", "◀", "#6366f1"],
                ["right", "▶", "#6366f1"],
                ["down", "Frein", "#ef4444"],
                ["up", "Gaz", "#22c55e"],
              ] as const
            ).map(([key, label, color]) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                {...pedal(key)}
                className={`flex items-center justify-center rounded-3xl border-4 border-white font-extrabold text-white ${CANDY_PRESS} ${
                  key === "up" ? "h-24 w-24 text-2xl lg:h-28 lg:w-28" : "h-20 w-20 text-2xl lg:h-24 lg:w-24"
                }`}
                style={candyStyle(color)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <LoadingOverlay themeId={themeId} done={drawn} />
    </div>
  );
}
