"use client";

import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import ThemePicker from "@/components/ThemePicker";
import StarBadge from "@/components/StarBadge";

const MODULES = [
  {
    href: "/maths",
    emoji: "🔢",
    title: "Maths",
    desc: "Compter, additionner, comparer",
    subject: "maths" as const,
  },
  {
    href: "/francais",
    emoji: "🔤",
    title: "Français",
    desc: "Lettres, mots et syllabes",
    subject: "francais" as const,
  },
  {
    href: "/decouverte",
    emoji: "🌍",
    title: "Je découvre",
    desc: "Des questions sur le monde",
    subject: null,
  },
  {
    href: "/jeu",
    emoji: "🎮",
    title: "Je joue",
    desc: "Petit quiz rapide et chronométré",
    subject: null,
  },
];

export default function Home() {
  const { theme, ready: themeReady } = useTheme();
  const { progress, totalStars, ready: progressReady } = useProgress();

  return (
    <main
      className="flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-12 max-w-3xl lg:max-w-6xl mx-auto w-full"
      style={{ color: theme.colors.text }}
    >
      <div className="flex items-center justify-between mb-6 lg:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold">L&apos;Aventure du Vendredi</h1>
          <p className="text-sm lg:text-xl text-slate-600 mt-1">
            15 minutes pour apprendre et jouer ensemble !
          </p>
        </div>
        {progressReady && <StarBadge count={totalStars} />}
      </div>

      <section className="mb-8 lg:mb-12">
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-5">Choisis ton thème</h2>
        <ThemePicker />
      </section>

      {themeReady && (
        <section className="mb-8 lg:mb-12 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <Link
            href="/seance"
            className="block rounded-3xl p-6 lg:p-8 shadow-xl active:scale-95 transition-transform text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
            }}
          >
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="text-5xl lg:text-7xl animate-float">{theme.mascotEmoji}</div>
              <div className="flex-1">
                <div className="text-xs lg:text-sm font-bold uppercase tracking-wide opacity-80">
                  Séance guidée · 15 minutes
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold">On commence l&apos;aventure !</div>
                <div className="text-sm lg:text-base opacity-90 mt-1">
                  {theme.mascotName} t&apos;attend : un peu d&apos;étude, puis place au jeu.
                </div>
              </div>
              <div className="text-3xl lg:text-4xl">➡️</div>
            </div>
          </Link>

          <Link
            href="/explore"
            className="relative block rounded-3xl p-6 lg:p-8 shadow-xl active:scale-95 transition-transform text-white overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #075985)",
            }}
          >
            <span className="absolute top-3 right-3 lg:top-4 lg:right-4 rounded-full bg-yellow-300 text-yellow-900 text-[10px] lg:text-xs font-extrabold uppercase tracking-wide px-2.5 py-1 shadow">
              Nouveau
            </span>
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="text-5xl lg:text-7xl">🧭</div>
              <div className="flex-1">
                <div className="text-xs lg:text-sm font-bold uppercase tracking-wide opacity-80">
                  Exploration en 3D
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold">J&apos;explore le monde de {theme.name} !</div>
                <div className="text-sm lg:text-base opacity-90 mt-1">
                  Tourne autour de la scène et découvre des bulles surprises ✨
                </div>
              </div>
              <div className="text-3xl lg:text-4xl">➡️</div>
            </div>
          </Link>
        </section>
      )}

      <section>
        <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-5">Ou entraîne-toi librement</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-3xl p-5 lg:p-7 shadow-md active:scale-95 transition-transform bg-white"
            >
              <div className="text-4xl lg:text-6xl mb-2 lg:mb-3">{m.emoji}</div>
              <div className="text-lg lg:text-2xl font-extrabold">{m.title}</div>
              <div className="text-xs lg:text-sm text-slate-500 mt-1">{m.desc}</div>
              {m.subject && progressReady && (
                <div className="mt-3 text-xs lg:text-sm font-bold text-slate-500">
                  Niveau {progress.level[m.subject]} · {progress.stars[m.subject]} ⭐
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
