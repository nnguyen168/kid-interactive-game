"use client";

import Link from "next/link";
import { useState } from "react";
import SceneBackground from "@/components/SceneBackground";
import Mascot from "@/components/Mascot";
import Art from "@/components/Art";
import MascotSays from "@/components/ui/MascotSays";
import StarCounter from "@/components/ui/StarCounter";
import ParentSettings from "@/components/ParentSettings";
import { CANDY_PRESS, candyStyle } from "@/components/ui/CandyButton";
import { PlayIcon } from "@/components/ui/icons";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { THEME_ORDER, THEMES } from "@/lib/themes";
import { ArtKey } from "@/lib/art";
import { Subject, ThemeId } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";

// The title screen is shown once per page load (it also unlocks audio).
let titleScreenSeen = false;

type Tile = { href: string; art: ArtKey; label: string; color: string; badge?: string; subject?: Subject };

function Splash({ themeId, onStart }: { themeId: ThemeId; onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-sky-300/70 px-4 backdrop-blur-md lg:gap-5">
      <h1 className="logo-text rise-in -rotate-2 text-center text-5xl font-bold leading-none sm:text-7xl lg:text-8xl">
        L&apos;Aventure
        <br />
        du Vendredi
      </h1>
      <Mascot themeId={themeId} mood="wave" talking={false} className="w-40 sm:w-52 lg:w-64" />
      <button
        type="button"
        onClick={onStart}
        aria-label="Jouer"
        autoFocus
        data-nav
        className={`pulse-soft flex h-28 w-28 items-center justify-center rounded-full text-white lg:h-36 lg:w-36 ${CANDY_PRESS}`}
        style={candyStyle("#22C55E")}
      >
        <PlayIcon className="h-16 w-16 translate-x-1 lg:h-20 lg:w-20" />
      </button>
    </div>
  );
}

function HeroPortrait({ themeId, selected, onPick }: { themeId: ThemeId; selected: boolean; onPick: () => void }) {
  const t = THEMES[themeId];
  return (
    <button type="button" onClick={onPick} aria-label={t.mascotName} className="flex flex-col items-center gap-1 rounded-3xl" data-nav>
      <span
        className={`block h-16 w-16 overflow-hidden rounded-full border-4 bg-white transition-transform sm:h-24 sm:w-24 lg:h-28 lg:w-28 ${
          selected ? "scale-110 shadow-[0_6px_0_rgba(0,0,0,0.15)]" : "opacity-80 hover:opacity-100"
        }`}
        style={{ borderColor: selected ? t.colors.primary : "#FFFFFF", background: t.colors.soft }}
      >
        <Mascot themeId={themeId} talking={false} shadow={false} className="-ml-[15%] -mt-[6%] w-[130%] max-w-none" />
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-sm font-bold sm:px-3 sm:text-base lg:text-xl ${selected ? "text-white" : "bg-white/80 text-slate-600"}`}
        style={selected ? { background: t.colors.primary } : undefined}
      >
        {t.name}
      </span>
    </button>
  );
}

function HubTile({ tile, level, index }: { tile: Tile; level?: number; index: number }) {
  return (
    <Link
      href={tile.href}
      onClick={() => sfx.pop()}
      data-nav
      className={`wiggle-hover rise-in relative flex aspect-square flex-col items-center justify-center gap-1 rounded-[2rem] px-2 text-white sm:aspect-[5/4] lg:rounded-[2.4rem] ${CANDY_PRESS}`}
      style={{ ...candyStyle(tile.color), animationDelay: `${index * 70}ms` }}
    >
      <span className="pointer-events-none absolute inset-x-5 top-2 h-[26%] rounded-full bg-white/20" />
      <span className={`wiggle-target relative ${tile.badge ? "float-y" : ""}`}>
        <Art name={tile.art} className="h-20 w-20 drop-shadow-[0_6px_0_rgba(0,0,0,0.15)] sm:h-24 sm:w-24 xl:h-32 xl:w-32" eager />
      </span>
      <span className="relative text-center text-xl font-bold leading-tight sm:text-2xl xl:text-3xl" style={{ textShadow: "0 2px 0 rgba(0,0,0,0.25)" }}>
        {tile.label}
      </span>
      {tile.badge && (
        <span className="absolute -right-2 -top-3 rotate-6 rounded-full bg-amber-300 px-3 py-1 text-sm font-bold text-amber-900 shadow-[0_3px_0_#B45309] lg:text-base">
          {tile.badge}
        </span>
      )}
      {level && (
        <span className="absolute left-3 top-3 rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-bold lg:text-sm">
          Niv. {level}
        </span>
      )}
    </Link>
  );
}

export default function Home() {
  const { theme, themeId, setThemeId, ready: themeReady } = useTheme();
  const { progress, totalStars, ready } = useProgress();
  const [showSplash, setShowSplash] = useState(() => !titleScreenSeen);

  if (!themeReady) return <div className="min-h-dvh bg-sky-100" />;

  const tiles: Tile[] = [
    { href: "/seance", art: "rocket", label: "L'aventure", color: theme.colors.primary, badge: "15 min" },
    { href: "/explore", art: "map", label: "J'explore", color: "#0EA5E9" },
    { href: "/jeu", art: "trophy", label: "Le défi", color: "#F97316" },
    { href: "/maths", art: "numbers", label: "Les nombres", color: "#3B82F6", subject: "maths" },
    { href: "/francais", art: "letters", label: "Les lettres", color: "#EC4899", subject: "francais" },
    { href: "/decouverte", art: "globe", label: "Le monde", color: "#14B8A6" },
  ];

  function start() {
    titleScreenSeen = true;
    sfx.unlock();
    sfx.fanfare();
    setShowSplash(false);
    speak(theme.greeting);
  }

  function pickHero(id: ThemeId) {
    if (id === themeId) {
      speak(THEMES[id].greeting);
      return;
    }
    sfx.whoosh();
    setThemeId(id);
    speak(THEMES[id].greeting);
  }

  return (
    <div className="relative min-h-dvh">
      <SceneBackground themeId={themeId} />
      {showSplash && <Splash themeId={themeId} onStart={start} />}

      <header className="relative z-20 flex items-start justify-between gap-3 px-4 pt-4 sm:px-8 lg:px-12 lg:pt-6">
        <h1 className="logo-text -rotate-2 text-3xl font-bold leading-[0.95] sm:text-5xl lg:text-6xl">
          L&apos;Aventure
          <br />
          du Vendredi
        </h1>
        <div className="flex items-center gap-3">
          <ParentSettings />
          <StarCounter count={ready ? totalStars : 0} />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-6 px-4 pb-8 pt-4 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:px-12">
        <section className="flex flex-col items-center gap-4">
          <MascotSays
            key={themeId}
            themeId={themeId}
            mood="wave"
            size="lg"
            stacked
            text={`Salut ! Je suis ${theme.mascotName} !`}
            speakText={theme.greeting}
            autoSpeak={false}
          />
          <div className="flex items-end justify-center gap-2 rounded-[2rem] bg-white/60 px-3 pb-3 pt-4 backdrop-blur-sm sm:gap-6 sm:px-4">
            {THEME_ORDER.map((id) => (
              <HeroPortrait key={id} themeId={id} selected={id === themeId} onPick={() => pickHero(id)} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:gap-6">
          {tiles.map((tile, i) => (
            <HubTile key={tile.href} tile={tile} index={i} level={tile.subject && ready ? progress.level[tile.subject] : undefined} />
          ))}
        </section>
      </main>
    </div>
  );
}
