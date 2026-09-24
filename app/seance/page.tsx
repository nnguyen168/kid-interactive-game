"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import MathsQuestionCard from "@/components/MathsQuestionCard";
import FrancaisQuestionCard from "@/components/FrancaisQuestionCard";
import DecouverteCardView from "@/components/DecouverteCardView";
import HeartLives from "@/components/HeartLives";
import Confetti from "@/components/Confetti";
import BigButton from "@/components/BigButton";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateMixedQuestion } from "@/lib/content/mixed";
import { DECOUVERTE_CARDS } from "@/lib/content/decouverte";
import { pick } from "@/lib/random";
import { useLazyGenerated } from "@/lib/useLazyGenerated";

const STUDY_COUNT = 4;
const GAME_COUNT = 5;
const MAX_LIVES = 3;

type Step = "intro" | "etude" | "decouverte" | "jeu" | "recap";

export default function SeancePage() {
  const { theme } = useTheme();
  const { progress, ready, addStars, addBadge, recordSession } = useProgress();

  const [step, setStep] = useState<Step>("intro");
  const [sessionStars, setSessionStars] = useState(0);

  const [studyIndex, setStudyIndex] = useState(0);
  const [studyQuestion, setStudyQuestion] = useLazyGenerated(
    ready && step === "etude",
    () => generateMixedQuestion(theme, progress.level)
  );
  const [studyAnswered, setStudyAnswered] = useState(false);

  const [decouverteCard] = useLazyGenerated(step === "decouverte", () => pick(DECOUVERTE_CARDS));
  const [decouverteDone, setDecouverteDone] = useState(false);

  const [gameIndex, setGameIndex] = useState(0);
  const [gameQuestion, setGameQuestion] = useLazyGenerated(ready && step === "jeu", () =>
    generateMixedQuestion(theme, progress.level)
  );
  const [gameAnswered, setGameAnswered] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);

  const [celebrate, setCelebrate] = useState(false);

  function celebrateBurst() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1000);
  }

  function handleStudyAnswer(correct: boolean) {
    setStudyAnswered(true);
    if (correct && studyQuestion) {
      addStars(studyQuestion.subject, 1);
      setSessionStars((s) => s + 1);
      celebrateBurst();
    }
  }

  function nextStudy() {
    const nextIndex = studyIndex + 1;
    if (nextIndex >= STUDY_COUNT) {
      setStep("decouverte");
      return;
    }
    setStudyIndex(nextIndex);
    setStudyAnswered(false);
    setStudyQuestion(generateMixedQuestion(theme, progress.level));
  }

  function handleGameAnswer(correct: boolean) {
    setGameAnswered(true);
    if (correct && gameQuestion) {
      addStars(gameQuestion.subject, 1);
      setSessionStars((s) => s + 1);
      celebrateBurst();
    } else {
      setLives((l) => Math.max(0, l - 1));
    }
  }

  function nextGame() {
    const nextIndex = gameIndex + 1;
    if (lives <= 0 || nextIndex >= GAME_COUNT) {
      finishSession();
      return;
    }
    setGameIndex(nextIndex);
    setGameAnswered(false);
    setGameQuestion(generateMixedQuestion(theme, progress.level));
  }

  function finishSession() {
    addBadge(`${theme.id}-vendredi`);
    recordSession();
    setStep("recap");
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2200);
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: theme.colors.soft }}>
      <Header title="Séance du vendredi" />
      <div className="flex-1 flex flex-col items-center px-4 pt-2 pb-10 gap-4">
        {step === "intro" && (
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-3">{theme.mascotEmoji}</div>
            <h2 className="text-2xl font-extrabold mb-2">
              Coucou, c&apos;est {theme.mascotName} !
            </h2>
            <p className="text-slate-600 mb-6">
              On va d&apos;abord réviser un peu ({STUDY_COUNT} questions), puis découvrir une
              question sur le monde, et enfin jouer ensemble. Prêt·e ?
            </p>
            <BigButton color={theme.colors.primary} onClick={() => setStep("etude")}>
              C&apos;est parti ! 🚀
            </BigButton>
          </div>
        )}

        {step === "etude" && studyQuestion && (
          <>
            <div className="text-sm font-bold text-slate-600">
              Étude · question {studyIndex + 1} / {STUDY_COUNT}
            </div>
            {studyQuestion.subject === "maths" ? (
              <MathsQuestionCard
                key={studyQuestion.question.id}
                question={studyQuestion.question}
                onAnswer={handleStudyAnswer}
              />
            ) : (
              <FrancaisQuestionCard
                key={studyQuestion.question.id}
                question={studyQuestion.question}
                onAnswer={handleStudyAnswer}
              />
            )}
            {studyAnswered && (
              <BigButton color={theme.colors.primary} onClick={nextStudy}>
                {studyIndex + 1 >= STUDY_COUNT ? "Découvrir le monde 🌍" : "Question suivante ➡️"}
              </BigButton>
            )}
          </>
        )}

        {step === "decouverte" && decouverteCard && (
          <>
            <div className="text-sm font-bold text-slate-600">Je découvre le monde</div>
            <DecouverteCardView
              card={decouverteCard}
              onDone={() => setDecouverteDone(true)}
            />
            {decouverteDone && (
              <BigButton color={theme.colors.primary} onClick={() => setStep("jeu")}>
                C&apos;est l&apos;heure du jeu ! 🎮
              </BigButton>
            )}
          </>
        )}

        {step === "jeu" && gameQuestion && (
          <>
            <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-1 px-1">
              <HeartLives lives={lives} max={MAX_LIVES} />
              <div className="text-sm font-bold text-slate-600">
                Manche {gameIndex + 1} / {GAME_COUNT}
              </div>
            </div>
            {gameQuestion.subject === "maths" ? (
              <MathsQuestionCard
                key={gameQuestion.question.id}
                question={gameQuestion.question}
                onAnswer={handleGameAnswer}
              />
            ) : (
              <FrancaisQuestionCard
                key={gameQuestion.question.id}
                question={gameQuestion.question}
                onAnswer={handleGameAnswer}
              />
            )}
            {gameAnswered && (
              <BigButton color={theme.colors.primary} onClick={nextGame}>
                {lives <= 0 || gameIndex + 1 >= GAME_COUNT ? "Voir le résultat 🏁" : "Suivant ➡️"}
              </BigButton>
            )}
          </>
        )}

        {step === "recap" && (
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-3">{theme.badgeEmoji}</div>
            <h2 className="text-2xl font-extrabold mb-2">Bravo, la séance est finie !</h2>
            <p className="text-slate-600 mb-2">
              Tu as gagné {sessionStars} ⭐ aujourd&apos;hui avec {theme.mascotName}.
            </p>
            <p className="text-slate-600 mb-6">
              Badge débloqué : « {theme.badgeName} » {theme.badgeEmoji}
            </p>
            <Link href="/" className="inline-block">
              <BigButton color={theme.colors.primary}>Retour à l&apos;accueil 🏠</BigButton>
            </Link>
            <p className="text-xs text-slate-500 mt-4">À vendredi prochain ! 👋</p>
          </div>
        )}
      </div>
      <Confetti active={celebrate} />
    </main>
  );
}
