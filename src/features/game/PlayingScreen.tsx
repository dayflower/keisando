import { ArrowLeft } from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { formatElapsedTime } from "../../shared/formatters";
import { getStageName, getStageTag, useI18n } from "../../shared/i18n";
import type {
  Player,
  Question,
  QuestionOption,
  StageDefinition,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";
import type { ClearBestBadge, ClearCelebrationTier } from "./clearCelebration";
import {
  buildClearEffectViewModel,
  buildComboEffectViewModel,
  buildPerformanceEffectStyleViewModel,
} from "./effectViewModel";
import type { EffectOrigin } from "./useGameSession";
import { usePlayingKeyboardShortcuts } from "./usePlayingKeyboardShortcuts";

export type PlayingScreenProps = {
  selectedStage: StageDefinition;
  playingPlayer: Player | null;
  question: Question;
  answeredCount: number;
  requiredCount: number;
  currentCombo: number;
  comboEffectTick: number;
  comboMilestoneTick: number;
  comboMilestoneValue: number;
  comboEffectOrigin: EffectOrigin;
  remainingCount: number;
  elapsedMs: number;
  bestTimeMs: number | null;
  isCleared: boolean;
  isRoundActive: boolean;
  countdownDisplay: number;
  wrongAnswerCount: number;
  lastResult: "correct" | "wrong" | null;
  clearCelebrationTier: ClearCelebrationTier;
  clearBestBadge: ClearBestBadge;
  clearCelebrationTick: number;
  didUnlockNextStageOnClear: boolean;
  shouldReplayClearCelebration: boolean;
  canAdvanceToNextStage: boolean;
  onAnswer: (selected: QuestionOption, effectOrigin?: EffectOrigin) => void;
  onClearCelebrationSeen: () => void;
  onOpenRanking: () => void;
  onBackToStageSelect: () => void;
  onResetStage: () => void;
  onStartNextStage: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

const RESULT_FEEDBACK_DURATION_MS = 720;
const KEYBOARD_CHOICE_FEEDBACK_DURATION_MS = 140;

const renderQuestionOptionLabel = (option: QuestionOption) => {
  return (
    <span className="choice-label">
      {option.segments.map((segment) => (
        <span
          key={`${segment.size ?? "normal"}:${segment.text}`}
          className={
            segment.size === "small" ? "choice-label-segment-small" : undefined
          }
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
};

const getChoiceClassName = (
  layout: "diamond" | "binary",
  index: number,
  isKeyboardActive: boolean,
) =>
  [
    "choice",
    layout === "binary"
      ? index === 0
        ? "choice-binary-left"
        : "choice-binary-right"
      : index === 0
        ? "choice-top"
        : index === 1
          ? "choice-left"
          : index === 2
            ? "choice-right"
            : "choice-bottom",
    isKeyboardActive ? "choice-keyboard-active" : null,
  ]
    .filter(Boolean)
    .join(" ");

export const PlayingScreen = ({
  selectedStage,
  playingPlayer,
  question,
  answeredCount,
  requiredCount,
  currentCombo,
  comboEffectTick,
  comboMilestoneTick,
  comboMilestoneValue,
  comboEffectOrigin,
  remainingCount,
  elapsedMs,
  bestTimeMs,
  isCleared,
  isRoundActive,
  countdownDisplay,
  wrongAnswerCount,
  lastResult,
  clearCelebrationTier,
  clearBestBadge,
  clearCelebrationTick,
  didUnlockNextStageOnClear,
  shouldReplayClearCelebration,
  canAdvanceToNextStage,
  onAnswer,
  onClearCelebrationSeen,
  onOpenRanking,
  onBackToStageSelect,
  onResetStage,
  onStartNextStage,
  isMuted,
  onToggleMute,
  onUiTap,
}: PlayingScreenProps) => {
  const [visibleResult, setVisibleResult] = useState<
    "correct" | "wrong" | null
  >(() => (isCleared ? null : lastResult));
  const [showClearCelebration, setShowClearCelebration] = useState(
    () => isCleared && shouldReplayClearCelebration,
  );
  const [keyboardChoiceFeedbackIndex, setKeyboardChoiceFeedbackIndex] =
    useState<number | null>(null);
  const [resultDisplayKey, setResultDisplayKey] = useState(0);
  const handledResultSignatureRef = useRef<string | null>(null);
  const resultHideTimeoutRef = useRef<number | null>(null);
  const keyboardChoiceFeedbackTimeoutRef = useRef<number | null>(null);
  const { locale, t } = useI18n();
  const correctCount = Math.max(answeredCount - wrongAnswerCount, 0);
  const stageName = getStageName(locale, selectedStage.id);
  const stageTag = getStageTag(locale, selectedStage.id);
  const progressMax = selectedStage.baseQuestionCount;
  const progressPercent =
    progressMax > 0 ? Math.min((correctCount / progressMax) * 100, 100) : 0;
  const roundProgress =
    progressMax > 0 ? Math.min(correctCount / progressMax, 1) : 0;
  const comboEffect = buildComboEffectViewModel({
    currentCombo,
    lastResult,
    comboMilestoneValue,
    comboMilestoneLabel: t("playing.comboMilestone", {
      count: comboMilestoneValue,
    }),
  });
  const clearEffect = buildClearEffectViewModel({
    clearCelebrationTier,
    clearBestBadge,
  });
  const effectStyleViewModel =
    buildPerformanceEffectStyleViewModel(roundProgress);
  const effectStyle = {
    "--fx-hue-shift": effectStyleViewModel.hueShift,
    "--fx-drift-duration": effectStyleViewModel.driftDuration,
  } as CSSProperties;
  const comboEffectStyle = {
    "--combo-origin-x":
      comboEffectOrigin.x > 0 ? `${comboEffectOrigin.x}px` : "50%",
    "--combo-origin-y":
      comboEffectOrigin.y > 0 ? `${comboEffectOrigin.y}px` : "53%",
  } as CSSProperties;
  const resolveEffectOrigin = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ): EffectOrigin => {
    if (event.clientX > 0 || event.clientY > 0) {
      return { x: event.clientX, y: event.clientY };
    }

    const rect = event.currentTarget.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  const choiceButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const choiceLayout = question.options.length === 2 ? "binary" : "diamond";

  useEffect(() => {
    return () => {
      if (resultHideTimeoutRef.current !== null) {
        window.clearTimeout(resultHideTimeoutRef.current);
      }
      if (keyboardChoiceFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(keyboardChoiceFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCleared) {
      setShowClearCelebration(false);
      return;
    }

    if (shouldReplayClearCelebration && !showClearCelebration) {
      setShowClearCelebration(true);
    }
  }, [isCleared, shouldReplayClearCelebration, showClearCelebration]);

  useEffect(() => {
    if (!isCleared || !shouldReplayClearCelebration) {
      return;
    }

    onClearCelebrationSeen();
  }, [isCleared, onClearCelebrationSeen, shouldReplayClearCelebration]);

  const showKeyboardChoiceFeedback = (choiceIndex: number) => {
    if (keyboardChoiceFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(keyboardChoiceFeedbackTimeoutRef.current);
      keyboardChoiceFeedbackTimeoutRef.current = null;
    }

    setKeyboardChoiceFeedbackIndex(choiceIndex);
    keyboardChoiceFeedbackTimeoutRef.current = window.setTimeout(() => {
      setKeyboardChoiceFeedbackIndex(null);
      keyboardChoiceFeedbackTimeoutRef.current = null;
    }, KEYBOARD_CHOICE_FEEDBACK_DURATION_MS);
  };

  useEffect(() => {
    const resultSignature = `${answeredCount}:${lastResult ?? "idle"}`;

    if (!isRoundActive || isCleared || lastResult === null) {
      if (resultHideTimeoutRef.current !== null) {
        window.clearTimeout(resultHideTimeoutRef.current);
        resultHideTimeoutRef.current = null;
      }
      handledResultSignatureRef.current = resultSignature;
      setVisibleResult(null);
      return;
    }

    if (handledResultSignatureRef.current === resultSignature) {
      return;
    }

    handledResultSignatureRef.current = resultSignature;
    if (resultHideTimeoutRef.current !== null) {
      window.clearTimeout(resultHideTimeoutRef.current);
      resultHideTimeoutRef.current = null;
    }
    setVisibleResult(lastResult);
    setResultDisplayKey((prev) => prev + 1);
    resultHideTimeoutRef.current = window.setTimeout(() => {
      setVisibleResult(null);
      resultHideTimeoutRef.current = null;
    }, RESULT_FEEDBACK_DURATION_MS);
  }, [answeredCount, isCleared, isRoundActive, lastResult]);

  usePlayingKeyboardShortcuts({
    isCleared,
    canAdvanceToNextStage,
    isRoundActive,
    options: question.options,
    choiceButtonRefs,
    onAnswer,
    onKeyboardChoiceTrigger: showKeyboardChoiceFeedback,
    onBackToStageSelect,
    onResetStage,
    onStartNextStage,
    onUiTap,
  });

  return (
    <main className="app app-playing" style={effectStyle}>
      <div className="performance-bg" aria-hidden="true">
        <span className="performance-bg-shape performance-bg-shape-a" />
        <span className="performance-bg-shape performance-bg-shape-b" />
        <span className="performance-bg-shape performance-bg-shape-c" />
      </div>
      {!isCleared && comboEffect.showBurst && (
        <div
          key={comboEffectTick}
          className={`combo-effects combo-effects-active combo-tier-${comboEffect.comboTier}`}
          style={comboEffectStyle}
          aria-hidden="true"
        >
          <span className="combo-ring" />
          {comboEffect.particleIndexes.map((particleIndex) => (
            <span
              key={`combo-particle-${particleIndex}`}
              className="combo-particle"
              style={{ "--combo-index": particleIndex } as CSSProperties}
            />
          ))}
        </div>
      )}
      <div className="stage-frame">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">
              {stageName} / {stageTag}
              {playingPlayer && ` / ${playingPlayer.name}`}
            </p>
            <div className="stage-head-actions">
              {!isCleared && (
                <button
                  className="back-icon-button"
                  type="button"
                  onClick={() => {
                    onUiTap?.();
                    onBackToStageSelect();
                  }}
                  aria-label={t("common.backToStageSelect")}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
              )}
              <SoundToggleButton
                isMuted={isMuted}
                onToggleMute={onToggleMute}
                onUiTap={onUiTap}
              />
            </div>
          </div>

          <h1 className="title">Keisando</h1>
          <div className="progress-row">
            <p>
              {t("playing.remaining")}: {remainingCount} / {requiredCount}
            </p>
            {wrongAnswerCount > 0 && (
              <p>
                {t("playing.wrongAnswers")}: {wrongAnswerCount}
              </p>
            )}
          </div>
          <div className="progress-bar-block">
            <div
              className="progress-bar-track"
              role="progressbar"
              aria-label={t("playing.progress")}
              aria-valuemin={0}
              aria-valuemax={progressMax}
              aria-valuenow={Math.min(correctCount, progressMax)}
            >
              <span className="progress-bar-count" aria-hidden="true">
                {Math.min(correctCount, progressMax)}
              </span>
              <span
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
              {!isCleared && comboEffect.milestoneLabel && (
                <span
                  key={comboMilestoneTick}
                  className="combo-progress-overlay"
                  aria-hidden="true"
                >
                  {comboEffect.milestoneLabel}
                </span>
              )}
            </div>
          </div>
          <div className="timer-row">
            <p className="timer-pill">
              {t("playing.best")}:{" "}
              {bestTimeMs !== null ? formatElapsedTime(bestTimeMs) : "--:--.--"}
            </p>
            <p className="timer-pill">
              {t("playing.time")}: {formatElapsedTime(elapsedMs)}
            </p>
            {isCleared && (
              <button
                className="clear-ranking-button clear-ranking-button-inline"
                type="button"
                onClick={() => {
                  onUiTap?.();
                  onOpenRanking();
                }}
              >
                <span>{t("playing.openRanking")}</span>
              </button>
            )}
          </div>

          <div className="round-content" aria-live="polite">
            {!isCleared ? (
              isRoundActive ? (
                <>
                  <p className="expression">{question.prompt}</p>

                  <div
                    className={
                      choiceLayout === "binary"
                        ? "binary-choice-grid"
                        : "diamond-grid"
                    }
                  >
                    {question.options.map((option, index) => (
                      <button
                        key={option.segments
                          .map(
                            (segment) =>
                              `${segment.size ?? "normal"}:${segment.text}`,
                          )
                          .join("|")}
                        className={getChoiceClassName(
                          choiceLayout,
                          index,
                          keyboardChoiceFeedbackIndex === index,
                        )}
                        type="button"
                        ref={(element) => {
                          choiceButtonRefs.current[index] = element;
                        }}
                        onClick={(event) =>
                          onAnswer(option, resolveEffectOrigin(event))
                        }
                      >
                        {renderQuestionOptionLabel(option)}
                      </button>
                    ))}
                    <p
                      key={resultDisplayKey}
                      className={[
                        "result-text",
                        visibleResult !== null ? "result-text-active" : null,
                        visibleResult === "correct" ? "result-correct" : null,
                        visibleResult === "wrong" ? "result-wrong" : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {visibleResult === "correct" &&
                        t("playing.resultCorrect")}
                      {visibleResult === "wrong" && t("playing.resultWrong")}
                    </p>
                  </div>
                </>
              ) : (
                <div className="countdown-status" role="status">
                  <p className="countdown-label">
                    {t("playing.roundStartsIn")}
                  </p>
                  <p key={countdownDisplay} className="countdown-number">
                    {countdownDisplay}
                  </p>
                </div>
              )
            ) : (
              <div className="clear-summary" role="status" aria-live="polite">
                {showClearCelebration && (
                  <div
                    key={clearCelebrationTick}
                    className={`clear-celebration clear-celebration-${clearCelebrationTier}`}
                    aria-hidden="true"
                  >
                    {clearEffect.burstSpecs.map((burstSpec) => (
                      <span
                        key={burstSpec.id}
                        className={`clear-burst ${
                          clearEffect.withShockwave
                            ? "clear-burst-shockwave"
                            : ""
                        }`}
                        style={
                          {
                            "--clear-burst-x": `${burstSpec.x}%`,
                            "--clear-burst-y": `${burstSpec.y}%`,
                            "--clear-burst-scale": burstSpec.scale,
                            "--clear-burst-delay": `${burstSpec.delayMs}ms`,
                            "--clear-burst-hue-shift": `${burstSpec.hueShiftDeg}deg`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                )}
                {clearEffect.badgeLabel && (
                  <p className="clear-best-badge">{clearEffect.badgeLabel}</p>
                )}
                <p className="clear-title">{t("playing.clearTitle")}</p>
                {didUnlockNextStageOnClear && (
                  <p className="clear-meta">{t("playing.nextStageUnlocked")}</p>
                )}
                <p className="clear-primary-time">
                  {formatElapsedTime(elapsedMs)}
                </p>
                <p className="clear-primary-label">{t("playing.clearTime")}</p>
                <div className="clear-meta-row">
                  <p className="clear-meta">
                    {t("playing.finalQuestions")}: {requiredCount}
                  </p>
                  <p className="clear-meta">
                    {t("playing.wrongAnswers")}: {wrongAnswerCount}
                  </p>
                </div>
              </div>
            )}
          </div>
          {isCleared && (
            <div className="clear-actions">
              <button
                className="clear-back-button"
                type="button"
                onClick={() => {
                  onUiTap?.();
                  onBackToStageSelect();
                }}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>{t("playing.back")}</span>
              </button>
              {canAdvanceToNextStage ? (
                <button
                  className="primary-action-button clear-next-button"
                  type="button"
                  onClick={() => {
                    onUiTap?.();
                    onStartNextStage();
                  }}
                >
                  {t("playing.nextStage")}
                </button>
              ) : (
                <div className="clear-next-stage-blank" aria-hidden="true" />
              )}
              <button
                className="clear-retry-button"
                type="button"
                onClick={() => {
                  onUiTap?.();
                  onResetStage();
                }}
              >
                {t("playing.retry")}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
