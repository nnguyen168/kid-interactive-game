"use client";

import { ReactNode } from "react";
import { useTheme } from "@/lib/ThemeContext";
import SceneBackground from "../SceneBackground";
import TopBar from "./TopBar";

export default function GameScreen({ top, children }: { top?: ReactNode; children: ReactNode }) {
  const { themeId, ready } = useTheme();
  if (!ready) return <div className="min-h-dvh bg-sky-100" />;
  return (
    <div className="relative flex min-h-dvh flex-col">
      <SceneBackground themeId={themeId} />
      <TopBar>{top}</TopBar>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-3 pb-6 pt-2 sm:px-6 lg:pt-3">
        {children}
      </main>
    </div>
  );
}
