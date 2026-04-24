import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ROUND_COUNTDOWN_MS } from "../../shared/constants";
import { createRecordId } from "../../shared/ids";
import type {
  Player,
  Question,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { getPlayerBestTime } from "../ranking/logic";
import { createQuestion } from "./logic";

export type StageFinishedPayload = {
  record: StageRunRecord;
  playerId: string;
  stageId: string;
  durationMs: number;
  mistakeCount: number;
  playedAt: number;
};

export type AnswerResolvedPayload = {
  playerId: string;
  isCorrect: boolean;
};

export type EffectOrigin = {
  x: number;
  y: number;
};

type UseGameSessionInput = {
  activePlayer: Player | null;
  records: StageRunRecord[];
  onAnswerResolved: (payload: AnswerResolvedPayload) => void;
  onStageFinished: (payload: StageFinishedPayload) => void;
};

type RoundSessionState = {
  question: Question;
  answeredCount: number;
  requiredCount: number;
  currentCombo: number;
  comboEffectTick: number;
  comboMilestoneTick: number;
  comboMilestoneValue: number;
  comboEffectOrigin: EffectOrigin;
  lastResult: "correct" | "wrong" | null;
  stageStartMs: number;
  countdownEndMs: number;
  isRoundActive: boolean;
  nowMs: number;
  clearElapsedMs: number | null;
};

type StoppedSessionState = {
  question: null;
  playingPlayerId: null;
  answeredCount: number;
  requiredCount: number;
  currentCombo: number;
  comboEffectTick: number;
  comboMilestoneTick: number;
  comboMilestoneValue: number;
  comboEffectOrigin: EffectOrigin;
  lastResult: "correct" | "wrong" | null;
  stageStartMs: number;
  countdownEndMs: number;
  isRoundActive: boolean;
  nowMs: number;
  clearElapsedMs: number | null;
  bestTimeMs: number | null;
};

const createRoundSessionState = (
  stage: StageDefinition,
  startedAtMs: number,
  usedExpressionsRef: MutableRefObject<Set<string>>,
): RoundSessionState => {
  usedExpressionsRef.current = new Set<string>();

  return {
    question: createQuestion(stage, usedExpressionsRef.current),
    answeredCount: 0,
    requiredCount: stage.baseQuestionCount,
    currentCombo: 0,
    comboEffectTick: 0,
    comboMilestoneTick: 0,
    comboMilestoneValue: 0,
    comboEffectOrigin: { x: 0, y: 0 },
    lastResult: null,
    stageStartMs: startedAtMs,
    countdownEndMs: startedAtMs + ROUND_COUNTDOWN_MS,
    isRoundActive: false,
    nowMs: startedAtMs,
    clearElapsedMs: null,
  };
};

const createStoppedSessionState = (
  stoppedAtMs: number,
): StoppedSessionState => ({
  question: null,
  playingPlayerId: null,
  answeredCount: 0,
  requiredCount: 0,
  currentCombo: 0,
  comboEffectTick: 0,
  comboMilestoneTick: 0,
  comboMilestoneValue: 0,
  comboEffectOrigin: { x: 0, y: 0 },
  lastResult: null,
  stageStartMs: stoppedAtMs,
  countdownEndMs: stoppedAtMs + ROUND_COUNTDOWN_MS,
  isRoundActive: false,
  nowMs: stoppedAtMs,
  clearElapsedMs: null,
  bestTimeMs: null,
});

export const useGameSession = ({
  activePlayer,
  records,
  onAnswerResolved,
  onStageFinished,
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
    const roundState = createRoundSessionState(
      stage,
      startAtMs,
      usedExpressionsRef,
    );

    setSelectedStage(stage);
    setQuestion(roundState.question);
    setPlayingPlayerId(activePlayer.id);
    setAnsweredCount(roundState.answeredCount);
    setRequiredCount(roundState.requiredCount);
    setCurrentCombo(roundState.currentCombo);
    setComboEffectTick(roundState.comboEffectTick);
    setComboMilestoneTick(roundState.comboMilestoneTick);
    setComboMilestoneValue(roundState.comboMilestoneValue);
    setComboEffectOrigin(roundState.comboEffectOrigin);
    setLastResult(roundState.lastResult);
    setStageStartMs(roundState.stageStartMs);
    setCountdownEndMs(roundState.countdownEndMs);
    setIsRoundActive(roundState.isRoundActive);
    setNowMs(roundState.nowMs);
    setClearElapsedMs(roundState.clearElapsedMs);
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
    onAnswerResolved({ playerId: playingPlayerId, isCorrect });
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
      const clearRecord: StageRunRecord = {
        id: createRecordId(),
        stageId: selectedStage.id,
        playerId: playingPlayerId,
        elapsedMs: elapsedAtClear,
        requiredCount: nextRequiredCount,
        wrongCount,
        recordedAt: finishedAtMs,
      };

      onStageFinished({
        record: clearRecord,
        playerId: playingPlayerId,
        stageId: selectedStage.id,
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
    const roundState = createRoundSessionState(
      selectedStage,
      Date.now(),
      usedExpressionsRef,
    );

    setQuestion(roundState.question);
    setAnsweredCount(roundState.answeredCount);
    setRequiredCount(roundState.requiredCount);
    setCurrentCombo(roundState.currentCombo);
    setComboEffectTick(roundState.comboEffectTick);
    setComboMilestoneTick(roundState.comboMilestoneTick);
    setComboMilestoneValue(roundState.comboMilestoneValue);
    setComboEffectOrigin(roundState.comboEffectOrigin);
    setLastResult(roundState.lastResult);
    setStageStartMs(roundState.stageStartMs);
    setCountdownEndMs(roundState.countdownEndMs);
    setIsRoundActive(roundState.isRoundActive);
    setNowMs(roundState.nowMs);
    setClearElapsedMs(roundState.clearElapsedMs);
  };

  const stopSession = () => {
    const stoppedState = createStoppedSessionState(Date.now());

    setSelectedStage(null);
    setQuestion(stoppedState.question);
    setPlayingPlayerId(stoppedState.playingPlayerId);
    setAnsweredCount(stoppedState.answeredCount);
    setRequiredCount(stoppedState.requiredCount);
    setCurrentCombo(stoppedState.currentCombo);
    setComboEffectTick(stoppedState.comboEffectTick);
    setComboMilestoneTick(stoppedState.comboMilestoneTick);
    setComboMilestoneValue(stoppedState.comboMilestoneValue);
    setComboEffectOrigin(stoppedState.comboEffectOrigin);
    setLastResult(stoppedState.lastResult);
    setStageStartMs(stoppedState.stageStartMs);
    setCountdownEndMs(stoppedState.countdownEndMs);
    setIsRoundActive(stoppedState.isRoundActive);
    setNowMs(stoppedState.nowMs);
    setClearElapsedMs(stoppedState.clearElapsedMs);
    setBestTimeMs(stoppedState.bestTimeMs);
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
