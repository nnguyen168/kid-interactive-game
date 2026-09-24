"use client";

import GameScreen from "@/components/ui/GameScreen";
import ProgressTrail from "@/components/ui/ProgressTrail";
import CandyButton from "@/components/ui/CandyButton";
import { ReplayIcon } from "@/components/ui/icons";
import FrancaisQuestionCard from "@/components/quiz/FrancaisQuestionCard";
import ResultScreen from "@/components/quiz/ResultScreen";
import { useQuizRound } from "@/components/quiz/useQuizRound";
import { LevelUpToast, useLevelUp } from "@/components/quiz/LevelUp";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateFrancaisQuestion } from "@/lib/content/francais";
import { sfx } from "@/lib/sfx";

const ROUND = 8;

export default function FrancaisPage() {
  const { theme, themeId } = useTheme();
  const { progress, ready, addStars } = useProgress();
  const levelUp = useLevelUp();
  const round = useQuizRound({
    total: ROUND,
    ready,
    generate: () => generateFrancaisQuestion(theme, progress.level.francais),
  });

  function onSolved(firstTry: boolean) {
    if (firstTry) {
      const { leveledUp, level } = addStars("francais", 1);
      setTimeout(() => sfx.star(), 350);
      if (leveledUp) setTimeout(() => levelUp.celebrate(level), 900);
    }
    round.recordResult(firstTry);
  }

  return (
    <GameScreen
      top={!round.done && <ProgressTrail total={ROUND} results={round.results} color={theme.colors.primary} />}
    >
      <LevelUpToast level={levelUp.level} />
      {round.done ? (
        <ResultScreen themeId={themeId} correct={round.firstTryCount} total={ROUND}>
          <CandyButton color={theme.colors.primary} onClick={round.restart} iconRight={<ReplayIcon className="w-8 h-8 lg:w-10 lg:h-10" />}>
            Rejouer
          </CandyButton>
          <CandyButton color="#0EA5E9" href="/" icon="home">
            Maison
          </CandyButton>
        </ResultScreen>
      ) : (
        round.question && (
          <FrancaisQuestionCard key={round.question.id} question={round.question} themeId={themeId} onSolved={onSolved} />
        )
      )}
    </GameScreen>
  );
}
