"use client";

import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import StarBadge from "./StarBadge";

export default function Header({ title }: { title: string }) {
  const { theme } = useTheme();
  const { totalStars, ready } = useProgress();

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10 lg:py-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 lg:px-6 lg:py-3 shadow-sm text-sm lg:text-lg font-bold text-slate-700 active:scale-95 transition-transform"
      >
        ⬅️ Accueil
      </Link>
      <h1
        className="text-lg sm:text-2xl lg:text-4xl font-extrabold text-center flex-1 truncate px-2"
        style={{ color: theme.colors.text }}
      >
        {title}
      </h1>
      {ready ? <StarBadge count={totalStars} /> : <div className="w-16" />}
    </header>
  );
}
