import { useEffect, useMemo, useRef, useState } from "react";
import { ROUND_COUNTDOWN_MS } from "../../shared/constants";
import { createRecordId } from "../../shared/ids";
import type {
  Player,
  Question,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { getPlayerBestTime } from "../ranking/logic";
import { calculateScore, createQuestion } from "./logic";

export type StageClearPayload = {
  clearRecord: StageRunRecord;
  playerId: string;
  stageId: string;
  score: number;
  durationMs: number;
  mistakeCount: number;
  playedAt: number;
};

export type EffectOrigin = {
  x: number;
  y: number;
};

type UseGameSessionInput = {
  activePlayer: Player | null;
  records: StageRunRecord[];
  onStageClear: (payload: StageClearPayload) => void;
};

export const useGameSession = ({
  activePlayer,
  records,
  onStageClear,
}: UseGameSessionInput) => {
  const usedExpressionsRef = useRef(new Set<string>());
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(
    null,
  );
  const [question, setQuestion] = useState<Question | null>(null);
  const [playingPlayerId, setPlayingPlayerId] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [comboEffectTick, setComboEffectTick] = useState(0);
  const [comboMilestoneTick, setComboMilestoneTick] = useState(0);
  const [comboMilestoneValue, setComboMilestoneValue] = useState(0);
  const [comboEffectOrigin, setComboEffectOrigin] = useState<EffectOrigin>({
    x: 0,
    y: 0,
  });
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [stageStartMs, setStageStartMs] = useState(() => Date.now());
  const [countdownEndMs, setCountdownEndMs] = useState(
    () => Date.now() + ROUND_COUNTDOWN_MS,
  );
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [clearElapsedMs, setClearElapsedMs] = useState<number | null>(null);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(null);

  const isPlaying = selectedStage !== null && question !== null;
  const isCleared = isPlaying && answeredCount >= requiredCount;

  const remainingCount = useMemo(
    () => Math.max(requiredCount - answeredCount, 0),
    [answeredCount, requiredCount],
  );
  const wrongAnswerCount = Math.max(
    requiredCount - (selectedStage?.baseQuestionCount ?? 0),
    0,
  );
  const elapsedMs =
    clearElapsedMs ?? (isRoundActive ? Math.max(nowMs - stageStartMs, 0) : 0);
  const countdownSeconds = Math.max(
    Math.ceil((countdownEndMs - nowMs) / 1000),
    0,
  );
  const countdownDisplay = Math.max(countdownSeconds, 1);

  useEffect(() => {
    if (!isPlaying || isCleared) return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCleared, isPlaying]);

  useEffect(() => {
    if (!isPlaying || isCleared || isRoundActive || nowMs < countdownEndMs) {
      return;
    }

    setIsRoundActive(true);
    setStageStartMs(nowMs);
    setNowMs(nowMs);
  }, [countdownEndMs, isCleared, isPlaying, isRoundActive, nowMs]);

  const startStage = (stage: StageDefinition): boolean => {
    if (!activePlayer) return false;

    const startAtMs = Date.now();
    usedExpressionsRef.current = new Set<string>();

    setSelectedStage(stage);
    setQuestion(createQuestion(stage, usedExpressionsRef.current));
    setPlayingPlayerId(activePlayer.id);
    setAnsweredCount(0);
    setRequiredCount(stage.baseQuestionCount);
    setCurrentCombo(0);
    setComboEffectTick(0);
    setComboMilestoneTick(0);
    setComboMilestoneValue(0);
    setComboEffectOrigin({ x: 0, y: 0 });
    setLastResult(null);
    setStageStartMs(startAtMs);
    setCountdownEndMs(startAtMs + ROUND_COUNTDOWN_MS);
    setIsRoundActive(false);
    setNowMs(startAtMs);
    setClearElapsedMs(null);
    setBestTimeMs(getPlayerBestTime(records, stage.id, activePlayer.id));

    return true;
  };

  const handleAnswer = (selected: number, effectOrigin?: EffectOrigin) => {
    if (
      !selectedStage ||
      !question ||
      !isRoundActive ||
      isCleared ||
      !playingPlayerId
    ) {
      return;
    }

    const isCorrect = selected === question.answer;
    const nextAnsweredCount = answeredCount + 1;
    const nextRequiredCount = requiredCount + (isCorrect ? 0 : 1);
    const nextCombo = isCorrect ? currentCombo + 1 : 0;
    const nextIsCleared = nextAnsweredCount >= nextRequiredCount;

    setLastResult(isCorrect ? "correct" : "wrong");
    setAnsweredCount(nextAnsweredCount);
    setRequiredCount(nextRequiredCount);
    setCurrentCombo(nextCombo);
    if (isCorrect) {
      if (effectOrigin) {
        setComboEffectOrigin(effectOrigin);
      }
      setComboEffectTick((prev) => prev + 1);
      if (nextCombo === 3 || nextCombo === 5 || nextCombo % 10 === 0) {
        setComboMilestoneValue(nextCombo);
        setComboMilestoneTick((prev) => prev + 1);
      }
    }

    if (nextIsCleared) {
      const finishedAtMs = Date.now();
      const elapsedAtClear = Math.max(finishedAtMs - stageStartMs, 0);
      const wrongCount = Math.max(
        nextRequiredCount - selectedStage.baseQuestionCount,
        0,
      );
      const score = calculateScore(elapsedAtClear, wrongCount);
      const clearRecord: StageRunRecord = {
        id: createRecordId(),
        stageId: selectedStage.id,
        playerId: playingPlayerId,
        elapsedMs: elapsedAtClear,
        requiredCount: nextRequiredCount,
        wrongCount,
        recordedAt: finishedAtMs,
      };

      onStageClear({
        clearRecord,
        playerId: playingPlayerId,
        stageId: selectedStage.id,
        score,
        durationMs: elapsedAtClear,
        mistakeCount: wrongCount,
        playedAt: finishedAtMs,
      });

      setNowMs(finishedAtMs);
      setClearElapsedMs(elapsedAtClear);
      setBestTimeMs((prev) =>
        prev === null ? elapsedAtClear : Math.min(prev, elapsedAtClear),
      );
      return;
    }

    setQuestion(createQuestion(selectedStage, usedExpressionsRef.current));
  };

  const resetStage = () => {
    if (!selectedStage) return;
    const resetAtMs = Date.now();

    usedExpressionsRef.current = new Set<string>();
    setQuestion(createQuestion(selectedStage, usedExpressionsRef.current));
    setAnsweredCount(0);
    setRequiredCount(selectedStage.baseQuestionCount);
    setCurrentCombo(0);
    setComboEffectTick(0);
    setComboMilestoneTick(0);
    setComboMilestoneValue(0);
    setComboEffectOrigin({ x: 0, y: 0 });
    setLastResult(null);
    setStageStartMs(resetAtMs);
    setCountdownEndMs(resetAtMs + ROUND_COUNTDOWN_MS);
    setIsRoundActive(false);
    setNowMs(resetAtMs);
    setClearElapsedMs(null);
  };

  const stopSession = () => {
    setSelectedStage(null);
    setQuestion(null);
    setPlayingPlayerId(null);
    setAnsweredCount(0);
    setRequiredCount(0);
    setCurrentCombo(0);
    setComboEffectTick(0);
    setComboMilestoneTick(0);
    setComboMilestoneValue(0);
    setComboEffectOrigin({ x: 0, y: 0 });
    setLastResult(null);
    setIsRoundActive(false);
    setClearElapsedMs(null);
  };

  return {
    selectedStage,
    question,
    playingPlayerId,
    answeredCount,
    requiredCount,
    currentCombo,
    comboEffectTick,
    comboMilestoneTick,
    comboMilestoneValue,
    comboEffectOrigin,
    lastResult,
    isRoundActive,
    isPlaying,
    isCleared,
    remainingCount,
    wrongAnswerCount,
    elapsedMs,
    countdownDisplay,
    bestTimeMs,
    startStage,
    handleAnswer,
    resetStage,
    stopSession,
  };
};
