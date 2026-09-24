"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import TopBar from "@/components/ui/TopBar";
import MascotSays from "@/components/ui/MascotSays";
import CandyButton from "@/components/ui/CandyButton";
import Art from "@/components/Art";
import Confetti from "@/components/Confetti";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { EXPLORE_HOTSPOTS, Hotspot } from "@/lib/content/explore";
import { sfx } from "@/lib/sfx";

const Scene3D = dynamic(() => import("@/components/explore/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <Art name="compass" className="pulse-soft w-24 h-24" eager />
    </div>
  ),
});

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 px-3 backdrop-blur-[2px]">
      <div className="rise-in w-full max-w-3xl rounded-[2.4rem] border-4 border-white bg-sky-50 p-4 shadow-2xl sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { theme, themeId, ready: themeReady } = useTheme();
  const { progress, ready, collectHotspot, addBadge } = useProgress();
  const [active, setActive] = useState<Hotspot | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const hotspots = EXPLORE_HOTSPOTS[themeId];
  const collected = ready ? progress.explored[themeId] : [];
  const badgeId = `${themeId}-explorateur`;
  const justCompleted = ready && collected.length >= hotspots.length && !progress.badges.includes(badgeId);

  function select(hotspot: Hotspot) {
    sfx.pop();
    setActive(hotspot);
  }

  function handleContinue() {
    if (!active) return;
    const wasNew = !collected.includes(active.id);
    collectHotspot(themeId, active.id);
    setActive(null);
    if (wasNew) {
      sfx.star();
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1200);
    }
  }

  if (!themeReady) return <div className="min-h-dvh bg-sky-100" />;

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: `linear-gradient(${theme.sky.top}, ${theme.sky.bottom})` }}>
      <TopBar>
        <div className="flex items-center gap-2 rounded-full bg-white/90 py-1 pl-2 pr-5 shadow-[0_5px_0_rgba(0,0,0,0.12)]">
          <Art name="sparkles" className="w-9 h-9 lg:w-12 lg:h-12" eager />
          <span className="text-xl font-bold text-amber-500 lg:text-3xl">
            {collected.length} / {hotspots.length}
          </span>
        </div>
      </TopBar>

      <div className="relative mx-2 mb-2 mt-3 h-[72dvh] overflow-hidden rounded-[2rem] border-4 border-white/70 shadow-xl lg:mx-8 lg:mb-6 lg:h-[76dvh]">
        <Scene3D themeId={themeId} collected={collected} onHotspotSelect={select} />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
          <span className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-600 shadow lg:text-lg">
            <Art name="sparkles" className="w-6 h-6 lg:w-8 lg:h-8" eager />
            Fais tourner le monde et touche les bulles dorées !
          </span>
        </div>
      </div>

      {active && (
        <Modal>
          <div className="flex flex-col items-center gap-2">
            <Art name={active.art} className="pop-in float-y w-24 h-24 lg:w-36 lg:h-36" eager />
            <MascotSays themeId={themeId} text={active.fact} speakKey={active.id} />
            <CandyButton color={theme.colors.primary} size="xl" onClick={handleContinue} icon="glowing-star">
              Super !
            </CandyButton>
          </div>
        </Modal>
      )}

      {justCompleted && !active && (
        <Modal>
          <Confetti active amount={70} />
          <div className="flex flex-col items-center gap-3">
            <Art name={theme.badgeArt} className="pop-in w-28 h-28 lg:w-40 lg:h-40" eager />
            <MascotSays
              themeId={themeId}
              mood="happy"
              text={`Tu as tout exploré ! Tu es un vrai explorateur ${theme.name.toLowerCase()} !`}
              speakKey="explore-complete"
            />
            <CandyButton color={theme.colors.primary} size="xl" onClick={() => addBadge(badgeId)} icon="party">
              Youpi !
            </CandyButton>
          </div>
        </Modal>
      )}

      <Confetti active={celebrate} />
    </div>
  );
}
