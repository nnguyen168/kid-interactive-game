"use client";

import { useRef, useState } from "react";
import Art from "@/components/Art";
import GameScreen from "@/components/ui/GameScreen";
import ProgressTrail from "@/components/ui/ProgressTrail";
import CandyButton from "@/components/ui/CandyButton";
import MascotSays from "@/components/ui/MascotSays";
import { ReplayIcon } from "@/components/ui/icons";
import RevisionQuestionCard from "@/components/quiz/RevisionQuestionCard";
import { RevisionPicture } from "@/components/quiz/RevisionVisuals";
import ResultScreen from "@/components/quiz/ResultScreen";
import { useQuizRound } from "@/components/quiz/useQuizRound";
import { LevelUpToast, useLevelUp } from "@/components/quiz/LevelUp";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateRevisionQuestion, REVISION_TOPICS, revisionLesson } from "@/lib/content/revision";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";

const ROUND = 10;
/** Right answers in a row (first try) needed to climb one step. */
const STEP_UP = 2;
/** Misses at the same step before going back one step. */
const STEP_DOWN = 2;

/** The ladder of steps, shown above the question so the child sees the climb. */
function StepLadder({ step, total, title, color }: { step: number; total: number; title: string; color: string }) {
  return (
    <div className="mb-2 flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-white/85 px-4 py-1.5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-1" aria-label={`Étape ${step + 1} sur ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`block h-3 w-3 rounded-full transition-all sm:h-3.5 sm:w-3.5 ${i === step ? "scale-150" : ""}`}
            style={{ background: i <= step ? color : "#CBD5E1" }}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-slate-600 sm:text-base">
        Étape {step + 1} · {title}
      </span>
    </div>
  );
}

export default function RevisionPage() {
  const { theme, themeId } = useTheme();
  const { progress, ready, addStars, setRevisionStep } = useProgress();
  const levelUp = useLevelUp();
  const topicId = progress.revision.topic;
  const topic = REVISION_TOPICS[topicId];
  const lastStep = topic.steps.length - 1;

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  // Read by the question generator, which runs from effects and timers.
  const stepRef = useRef(0);
  const streak = useRef(0);
  const misses = useRef(0);

  const round = useQuizRound({
    total: ROUND,
    ready: ready && started,
    generate: () => generateRevisionQuestion(topicId, stepRef.current, theme),
    advanceDelay: 2200,
  });

  function moveTo(next: number) {
    stepRef.current = next;
    streak.current = 0;
    misses.current = 0;
    setStep(next);
    setRevisionStep(topicId, next);
  }

  function start() {
    // Warm up one step below where the last révision stopped.
    const from = Math.max(0, Math.min(lastStep, (progress.revision.step[topicId] ?? 0) - 1));
    stepRef.current = from;
    setStep(from);
    sfx.pop();
    setStarted(true);
  }

  function onSolved(firstTry: boolean) {
    if (firstTry) {
      const { leveledUp, level } = addStars("maths", 1);
      setTimeout(() => sfx.star(), 350);
      if (leveledUp) setTimeout(() => levelUp.celebrate(level), 900);
      streak.current += 1;
      if (streak.current >= STEP_UP && stepRef.current < lastStep) {
        moveTo(stepRef.current + 1);
        setCheer("Étape suivante !");
        setTimeout(() => {
          sfx.fanfare();
          speak("Bravo ! On passe à l'étape suivante !");
        }, 1100);
        setTimeout(() => setCheer(null), 2400);
      }
    } else {
      streak.current = 0;
      misses.current += 1;
      if (misses.current >= STEP_DOWN && stepRef.current > 0) moveTo(stepRef.current - 1);
    }
    round.recordResult(firstTry);
  }

  const lesson = revisionLesson(topicId, theme);
  const reached = topic.steps[step];

  return (
    <GameScreen top={started && !round.done && <ProgressTrail total={ROUND} results={round.results} color={theme.colors.primary} />}>
      <LevelUpToast level={levelUp.level} />
      {!started ? (
        ready && (
          <div className="flex w-full max-w-5xl flex-col items-center gap-3 lg:gap-5">
            <div className="rise-in flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 shadow-[0_5px_0_rgba(0,0,0,0.08)]">
              <Art name={topic.art} className="h-10 w-10 lg:h-12 lg:w-12" eager />
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl lg:text-4xl">Révision : {topic.name}</h1>
            </div>
            <MascotSays themeId={themeId} text={lesson.title} speakText={lesson.speak} mood="wave" speakKey={`lesson-${topicId}`} />
            <div className="flex w-full flex-col items-center gap-3 rounded-[2rem] border-4 border-white/80 bg-white/95 px-4 py-5 shadow-[0_8px_0_rgba(0,0,0,0.08)] lg:rounded-[2.6rem]">
              <RevisionPicture visual={lesson.visual} color={theme.colors.primary} />
              <p className="pop-in text-5xl font-bold text-violet-600 sm:text-7xl" style={{ animationDelay: "2000ms", textShadow: "0 5px 0 rgba(0,0,0,0.12)" }}>
                {lesson.equation}
              </p>
              <p className="max-w-3xl text-center text-lg font-semibold text-slate-600 sm:text-xl lg:text-2xl">{lesson.text}</p>
            </div>
            <CandyButton color={theme.colors.primary} onClick={start} autoFocus icon="rocket">
              C&apos;est parti !
            </CandyButton>
          </div>
        )
      ) : round.done ? (
        <ResultScreen themeId={themeId} correct={round.firstTryCount} total={ROUND}>
          <p className="w-full rounded-2xl bg-white/85 px-4 py-2 text-center text-base font-semibold text-slate-600 sm:text-lg">
            Pour les parents : étape {step + 1} sur {topic.steps.length} — {reached.title}.
            {step >= lastStep ? " C'est la dernière étape : bravo !" : " La prochaine révision reprendra ici."}
          </p>
          <CandyButton color={theme.colors.primary} onClick={round.restart} autoFocus iconRight={<ReplayIcon className="h-8 w-8 lg:h-10 lg:w-10" />}>
            Encore
          </CandyButton>
          <CandyButton color="#0EA5E9" href="/" icon="home">
            Maison
          </CandyButton>
        </ResultScreen>
      ) : (
        <>
          <StepLadder step={step} total={topic.steps.length} title={reached.title} color={theme.colors.primary} />
          {cheer && (
            <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center">
              <div className="pop-in rounded-full bg-amber-300 px-6 py-2 text-2xl font-bold text-amber-900 shadow-[0_5px_0_#B45309] lg:text-3xl">⭐ {cheer}</div>
            </div>
          )}
          {round.question && <RevisionQuestionCard key={round.question.id} question={round.question} themeId={themeId} onSolved={onSolved} />}
        </>
      )}
    </GameScreen>
  );
}
