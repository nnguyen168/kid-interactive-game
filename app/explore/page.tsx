"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Header from "@/components/Header";
import SpeakButton from "@/components/SpeakButton";
import BigButton from "@/components/BigButton";
import Confetti from "@/components/Confetti";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { EXPLORE_HOTSPOTS, Hotspot } from "@/lib/content/explore";

const Scene3D = dynamic(() => import("@/components/explore/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold">
      Chargement de la scène 3D…
    </div>
  ),
});

export default function ExplorePage() {
  const { theme, themeId } = useTheme();
  const { progress, ready, collectHotspot, addBadge } = useProgress();
  const [active, setActive] = useState<Hotspot | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const hotspots = EXPLORE_HOTSPOTS[themeId];
  const collected = ready ? progress.explored[themeId] : [];
  const allCollected = collected.length >= hotspots.length;
  const badgeId = `${themeId}-explorateur`;
  const justCompleted = ready && allCollected && !progress.badges.includes(badgeId);

  function handleContinue() {
    if (!active) return;
    const wasNew = !collected.includes(active.id);
    collectHotspot(themeId, active.id);
    setActive(null);
    if (wasNew) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1000);
    }
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: theme.colors.soft }}>
      <Header title={`J'explore ${theme.mascotEmoji}`} />

      <div
        className="relative h-[62vh] lg:h-[70vh] mx-2 mb-2 lg:mx-6 lg:mb-6 rounded-3xl overflow-hidden shadow-xl"
        style={{ background: `linear-gradient(to top, ${theme.colors.soft}, #bfe3ff)` }}
      >
        <Scene3D
          themeId={themeId}
          collected={collected}
          onHotspotSelect={(hotspot) => setActive(hotspot)}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 lg:p-5">
          <div className="flex justify-between items-start">
            <div className="pointer-events-auto rounded-full bg-white/90 px-4 py-2 text-sm lg:text-base font-bold shadow">
              {collected.length} / {hotspots.length} découvertes
            </div>
          </div>
          <div className="text-center">
            <span className="pointer-events-auto inline-block rounded-full bg-white/80 px-4 py-1.5 text-xs lg:text-sm font-semibold text-slate-600 shadow">
              👆 Fais glisser pour tourner autour de la scène, touche les bulles brillantes ✨
            </span>
          </div>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-center text-6xl mb-3">{active.emoji}</div>
            <div className="flex items-start gap-3 mb-4">
              <SpeakButton text={active.fact} />
              <p className="text-lg font-bold leading-snug flex-1 pt-2">{active.fact}</p>
            </div>
            <BigButton color={theme.colors.primary} onClick={handleContinue} className="w-full">
              Super, continuer ! ✨
            </BigButton>
          </div>
        </div>
      )}

      {justCompleted && !active && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="text-6xl mb-3">{theme.badgeEmoji}</div>
            <h2 className="text-2xl font-extrabold mb-2">Tu as tout exploré !</h2>
            <p className="text-slate-600 mb-6">
              Badge débloqué : « Explorateur {theme.name} » {theme.badgeEmoji}
            </p>
            <BigButton
              color={theme.colors.primary}
              onClick={() => {
                addBadge(badgeId);
              }}
            >
              Youpi ! 🎉
            </BigButton>
          </div>
        </div>
      )}

      <Confetti active={celebrate} />
    </main>
  );
}
