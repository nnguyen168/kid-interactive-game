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
import { EXPLORE_FACTS, ExploreFact, MISSIONS } from "@/lib/content/explore";
import { sfx } from "@/lib/sfx";

const ExploreGame = dynamic(() => import("@/components/explore3d/ExploreGame"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <Art name="compass" className="pulse-soft w-24 h-24" eager />
    </div>
  ),
});

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-3 backdrop-blur-[2px]" data-popup>
      <div className="rise-in w-full max-w-3xl rounded-[2.4rem] border-4 border-white bg-sky-50 p-4 shadow-2xl sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}

type Overlay = { kind: "intro" } | { kind: "fact"; fact: ExploreFact } | { kind: "win" } | null;

export default function ExplorePage() {
  const { theme, themeId, ready: themeReady } = useTheme();
  const { progress, ready, collectHotspot, addBadge } = useProgress();
  const [overlay, setOverlay] = useState<Overlay>({ kind: "intro" });
  const [round, setRound] = useState(0);

  const mission = MISSIONS[themeId];
  const visited = ready ? progress.explored[themeId] : [];

  function discover(id: string) {
    const fact = EXPLORE_FACTS[themeId].find((f) => f.id === id);
    if (!fact) return;
    sfx.pop();
    setOverlay({ kind: "fact", fact });
  }

  function closeFact(fact: ExploreFact) {
    if (!visited.includes(fact.id)) sfx.star();
    collectHotspot(themeId, fact.id);
    setOverlay(null);
  }

  function win() {
    sfx.fanfare();
    addBadge(`${themeId}-explorateur`);
    setOverlay({ kind: "win" });
  }

  function replay() {
    setRound((r) => r + 1);
    setOverlay({ kind: "intro" });
  }

  if (!themeReady) return <div className="min-h-dvh bg-sky-100" />;

  return (
    <div className="flex h-dvh flex-col" style={{ background: `linear-gradient(${theme.sky.top}, ${theme.sky.bottom})` }}>
      <TopBar>
        <div className="flex items-center gap-2 rounded-full bg-white/90 py-1 pl-2 pr-5 shadow-[0_5px_0_rgba(0,0,0,0.12)]">
          <Art name="compass" className="w-9 h-9 lg:w-12 lg:h-12" eager />
          <span className="text-xl font-bold lg:text-3xl" style={{ color: theme.colors.text }}>
            J&apos;explore
          </span>
        </div>
      </TopBar>

      <div
        className="relative mx-2 mb-2 mt-3 min-h-0 flex-1 overflow-hidden rounded-[2rem] border-4 border-white/80 shadow-xl lg:mx-8 lg:mb-6"
        data-arrow-keys="game"
      >
        <ExploreGame
          key={`${themeId}-${round}`}
          themeId={themeId}
          visited={visited}
          paused={overlay !== null}
          onDiscover={discover}
          onWin={win}
        />

        {overlay?.kind === "intro" && (
          <Modal>
            <div className="flex flex-col items-center gap-3">
              <Art name={mission.goalArt} className="pop-in float-y w-24 h-24 lg:w-32 lg:h-32" eager />
              <MascotSays themeId={themeId} text={mission.intro} speakKey={`intro-${themeId}-${round}`} />
              <CandyButton color={theme.colors.primary} size="xl" onClick={() => setOverlay(null)} icon="rocket" autoFocus>
                C&apos;est parti !
              </CandyButton>
            </div>
          </Modal>
        )}

        {overlay?.kind === "fact" && (
          <Modal>
            <div className="flex flex-col items-center gap-2">
              <Art name={overlay.fact.art} className="pop-in float-y w-24 h-24 lg:w-36 lg:h-36" eager />
              <MascotSays themeId={themeId} text={overlay.fact.fact} speakKey={overlay.fact.id} />
              <CandyButton color={theme.colors.primary} size="xl" onClick={() => closeFact(overlay.fact)} icon="glowing-star" autoFocus>
                Super !
              </CandyButton>
            </div>
          </Modal>
        )}

        {overlay?.kind === "win" && (
          <Modal>
            <Confetti active amount={80} />
            <div className="flex flex-col items-center gap-3">
              <Art name={theme.badgeArt} className="pop-in w-28 h-28 lg:w-40 lg:h-40" eager />
              <MascotSays themeId={themeId} mood="happy" text={mission.win} speakKey={`win-${themeId}-${round}`} />
              <div className="flex flex-wrap justify-center gap-3">
                <CandyButton color={theme.colors.secondary} size="lg" onClick={replay} icon="game" autoFocus>
                  Rejouer
                </CandyButton>
                <CandyButton color={theme.colors.primary} size="lg" href="/" icon="home">
                  Accueil
                </CandyButton>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
