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
    desc: "Le grand jeu du thème",
    subject: null,
  },
];

export default function Home() {
  const { theme, ready: themeReady } = useTheme();
  const { progress, totalStars, ready: progressReady } = useProgress();

  return (
    <main
      className="flex-1 px-4 py-6 sm:px-8 sm:py-10 max-w-3xl mx-auto w-full"
      style={{ color: theme.colors.text }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">L&apos;Aventure du Vendredi</h1>
          <p className="text-sm text-slate-600 mt-1">15 minutes pour apprendre et jouer ensemble !</p>
        </div>
        {progressReady && <StarBadge count={totalStars} />}
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">Choisis ton thème</h2>
        <ThemePicker />
      </section>

      {themeReady && (
        <section className="mb-8">
          <Link
            href="/seance"
            className="block rounded-3xl p-6 shadow-xl active:scale-95 transition-transform text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">{theme.mascotEmoji}</div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wide opacity-80">
                  Séance guidée · 15 minutes
                </div>
                <div className="text-2xl font-extrabold">On commence l&apos;aventure !</div>
                <div className="text-sm opacity-90 mt-1">
                  {theme.mascotName} t&apos;attend : un peu d&apos;étude, puis place au jeu.
                </div>
              </div>
              <div className="text-3xl">➡️</div>
            </div>
          </Link>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3">Ou explore librement</h2>
        <div className="grid grid-cols-2 gap-4">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-3xl p-5 shadow-md active:scale-95 transition-transform bg-white"
            >
              <div className="text-4xl mb-2">{m.emoji}</div>
              <div className="text-lg font-extrabold">{m.title}</div>
              <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
              {m.subject && progressReady && (
                <div className="mt-3 text-xs font-bold text-slate-500">
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
