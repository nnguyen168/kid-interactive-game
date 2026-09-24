"use client";

import { ReactNode } from "react";
import { useProgress } from "@/lib/ProgressContext";
import IconButton from "./IconButton";
import StarCounter from "./StarCounter";

export default function TopBar({ children }: { children?: ReactNode }) {
  const { totalStars, ready } = useProgress();
  return (
    <header className="relative z-20 flex items-center gap-2 sm:gap-4 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-10">
      <IconButton href="/" art="home" label="Accueil" />
      <div className="flex min-w-0 flex-1 justify-center">{children}</div>
      <StarCounter count={ready ? totalStars : 0} />
    </header>
  );
}
