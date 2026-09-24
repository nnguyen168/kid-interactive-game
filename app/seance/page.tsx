"use client";

import { useState } from "react";
import GameScreen from "@/components/ui/GameScreen";
import MascotSays from "@/components/ui/MascotSays";
import CandyButton from "@/components/ui/CandyButton";
import ProgressTrail from "@/components/ui/ProgressTrail";
import { PlayIcon } from "@/components/ui/icons";
import Art from "@/components/Art";
import MixedQuestionCard from "@/components/quiz/MixedQuestionCard";
import StoryReader from "@/components/quiz/StoryReader";
import ChallengeTrack from "@/components/quiz/ChallengeTrack";
import ResultScreen from "@/components/quiz/ResultScreen";
import { useQuizRound } from "@/components/quiz/useQuizRound";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateMixedQuestion } from "@/lib/content/mixed";
import { DECOUVERTE_CARDS } from "@/lib/content/decouverte";
import { useLazyGenerated } from "@/lib/useLazyGenerated";
import { pick } from "@/lib/random";
import { sfx } from "@/lib/sfx";
import { ArtKey } from "@/lib/art";

const STUDY = 4;
const DEFI = 5;
const NEXT_DELAY = 2100;

type Step = "intro" | "etude" | "histoire" | "defi" | "recap";

const STEPS: { key: Step; art: ArtKey; label: string }[] = [
  { key: "etude", art: "book", label: "J'apprends" },
  { key: "histoire", art: "globe", label: "Je découvre" },
  { key: "defi", art: "trophy", label: "Je joue" },
];

function SessionSteps({ step, big = false }: { step: Step; big?: boolean }) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className={`flex items-center rounded-full bg-white/85 shadow-[0_5px_0_rgba(0,0,0,0.12)] ${big ? "px-5 py-4 lg:px-8" : "px-3 py-1.5"}`}>
      {STEPS.map((s, i) => {
        const done = step === "recap" || (currentIndex >= 0 && i < currentIndex);
        const active = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center">
            {i > 0 && <div className={`h-1.5 rounded-full ${big ? "w-10 lg:w-20" : "w-4 sm:w-8"} ${done || active ? "bg-amber-400" : "bg-slate-200"}`} />}
            <div className="relative flex flex-col items-center">
              <div
                className={`flex items-center justify-center rounded-full ${big ? "h-20 w-20 lg:h-28 lg:w-28" : "h-11 w-11 sm:h-14 sm:w-14"} ${active ? "pulse-soft bg-amber-100" : "bg-slate-100"}`}
              >
                <Art name={s.art} className={big ? "w-14 h-14 lg:w-20 lg:h-20" : "w-8 h-8 sm:w-10 sm:h-10"} eager />
              </div>
              {done && (
                <span className="pop-in absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                  ✓
                </span>
              )}
              {big && <span className="mt-2 text-lg font-bold text-slate-700 lg:text-2xl">{s.label}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SeancePage() {
  const { theme, themeId } = useTheme();
  const { progress, ready, addStars, addBadge, recordSession } = useProgress();
  const [step, setStep] = useState<Step>("intro");

  const study = useQuizRound({
    total: STUDY,
    ready: ready && step === "etude",
    generate: () => generateMixedQuestion(theme, progress.level),
  });
  const defi = useQuizRound({
    total: DEFI,
    ready: ready && step === "defi",
    generate: () => generateMixedQuestion(theme, progress.level),
  });
  const [story] = useLazyGenerated(step === "histoire", () => pick(DECOUVERTE_CARDS));

  function go(next: Step) {
    sfx.whoosh();
    setStep(next);
  }

  function onStudySolved(firstTry: boolean) {
    const item = study.question;
    if (firstTry && item) addStars(item.subject, 1);
    if (study.results.length + 1 >= STUDY) setTimeout(() => go("histoire"), NEXT_DELAY);
    study.recordResult(firstTry);
  }

  function onStoryFinished() {
    if (story) addBadge(`decouverte-${story.id}`);
    setTimeout(() => go("defi"), NEXT_DELAY);
  }

  function onDefiSolved(firstTry: boolean) {
    const item = defi.question;
    if (firstTry && item) addStars(item.subject, 1);
    if (defi.results.length + 1 >= DEFI) {
      setTimeout(() => {
        addBadge(`${themeId}-vendredi`);
        recordSession();
        setStep("recap");
      }, NEXT_DELAY);
    }
    defi.recordResult(firstTry);
  }

  const showSteps = step !== "intro" && step !== "recap";

  return (
    <GameScreen top={showSteps && <SessionSteps step={step} />}>
      {step === "intro" && (
        <div className="flex w-full max-w-5xl flex-col items-center gap-6 pt-2 lg:gap-10">
          <MascotSays
            themeId={themeId}
            size="lg"
            mood="wave"
            text="C'est l'heure de l'aventure du vendredi ! D'abord on apprend, puis on découvre une histoire, et enfin on joue !"
          />
          <SessionSteps step={step} big />
          <CandyButton size="xl" color={theme.colors.primary} onClick={() => go("etude")} autoFocus iconRight={<PlayIcon className="w-10 h-10 lg:w-12 lg:h-12" />}>
            C&apos;est parti !
          </CandyButton>
        </div>
      )}

      {step === "etude" && study.question && (
        <div className="flex w-full flex-col items-center gap-4">
          <ProgressTrail total={STUDY} results={study.results} color={theme.colors.primary} goal="book" />
          <MixedQuestionCard key={study.question.question.id} item={study.question} themeId={themeId} onSolved={onStudySolved} />
        </div>
      )}

      {step === "histoire" && story && <StoryReader card={story} themeId={themeId} onFinish={onStoryFinished} />}

      {step === "defi" && (
        <div className="flex w-full flex-col items-center gap-4 lg:gap-6">
          <ChallengeTrack theme={theme} steps={defi.results.length} total={DEFI} />
          {defi.question && (
            <MixedQuestionCard key={defi.question.question.id} item={defi.question} themeId={themeId} onSolved={onDefiSolved} />
          )}
        </div>
      )}

      {step === "recap" && (
        <ResultScreen
          themeId={themeId}
          correct={study.firstTryCount + defi.firstTryCount}
          total={STUDY + DEFI}
          message={`La séance est finie ! Tu gagnes la ${theme.badgeName} !`}
        >
          <div className="flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 shadow-[0_5px_0_rgba(0,0,0,0.1)]">
            <Art name={theme.badgeArt} className="w-12 h-12 lg:w-16 lg:h-16" eager />
            <span className="text-xl font-bold text-slate-700 lg:text-2xl">À vendredi prochain !</span>
          </div>
          <CandyButton color="#0EA5E9" href="/" icon="home" autoFocus>
            Maison
          </CandyButton>
        </ResultScreen>
      )}
    </GameScreen>
  );
}
