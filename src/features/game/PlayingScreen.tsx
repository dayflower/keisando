import { ArrowLeft } from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useRef,
} from "react";
import { formatElapsedTime } from "../../shared/formatters";
import { useI18n } from "../../shared/i18n";
import type { Player, Question, StageDefinition } from "../../shared/types";
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
  onAnswer: (selected: number, effectOrigin?: EffectOrigin) => void;
  onBackToStageSelect: () => void;
  onResetStage: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

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
  onAnswer,
  onBackToStageSelect,
  onResetStage,
  isMuted,
  onToggleMute,
  onUiTap,
}: PlayingScreenProps) => {
  const { t } = useI18n();
  const correctCount = Math.max(answeredCount - wrongAnswerCount, 0);
  const progressMax = selectedStage.baseQuestionCount;
  const progressPercent =
    progressMax > 0 ? Math.min((correctCount / progressMax) * 100, 100) : 0;
  const roundProgress =
    progressMax > 0 ? Math.min(correctCount / progressMax, 1) : 0;
  const comboEffect = buildComboEffectViewModel({
    currentCombo,
    lastResult,
    comboMilestoneValue,
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
  usePlayingKeyboardShortcuts({
    isCleared,
    isRoundActive,
    options: question.options,
    choiceButtonRefs,
    onAnswer,
    onBackToStageSelect,
    onResetStage,
    onUiTap,
  });

  return (
    <main className="app app-playing" style={effectStyle}>
      <div className="performance-bg" aria-hidden="true">
        <span className="performance-bg-shape performance-bg-shape-a" />
        <span className="performance-bg-shape performance-bg-shape-b" />
        <span className="performance-bg-shape performance-bg-shape-c" />
      </div>
      {comboEffect.showBurst && (
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
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">
            {selectedStage.name} / {selectedStage.tag}
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
            {t("playing.answered")}: {answeredCount} / {requiredCount}
          </p>
          <p>
            {t("playing.remaining")}: {remainingCount}
          </p>
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
            <span
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
            {comboEffect.milestoneLabel && (
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
            {t("playing.time")}: {formatElapsedTime(elapsedMs)}
          </p>
          <p className="timer-pill">
            {t("playing.best")}:{" "}
            {bestTimeMs !== null ? formatElapsedTime(bestTimeMs) : "--:--.--"}
          </p>
        </div>

        <div className="round-content" aria-live="polite">
          {!isCleared ? (
            isRoundActive ? (
              <>
                <p className="expression">
                  {question.left} {question.operator} {question.right} = ?
                </p>

                <div className="diamond-grid">
                  <button
                    className="choice choice-top"
                    type="button"
                    ref={(element) => {
                      choiceButtonRefs.current[0] = element;
                    }}
                    onClick={(event) =>
                      onAnswer(question.options[0], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[0]}
                  </button>
                  <button
                    className="choice choice-left"
                    type="button"
                    ref={(element) => {
                      choiceButtonRefs.current[1] = element;
                    }}
                    onClick={(event) =>
                      onAnswer(question.options[1], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[1]}
                  </button>
                  <button
                    className="choice choice-right"
                    type="button"
                    ref={(element) => {
                      choiceButtonRefs.current[2] = element;
                    }}
                    onClick={(event) =>
                      onAnswer(question.options[2], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[2]}
                  </button>
                  <button
                    className="choice choice-bottom"
                    type="button"
                    ref={(element) => {
                      choiceButtonRefs.current[3] = element;
                    }}
                    onClick={(event) =>
                      onAnswer(question.options[3], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[3]}
                  </button>
                </div>

                <p
                  className={`result-text ${
                    lastResult === "correct" ? "result-correct" : "result-wrong"
                  }`}
                >
                  {lastResult === "correct" && t("playing.resultCorrect")}
                  {lastResult === "wrong" && t("playing.resultWrong")}
                  {lastResult === null && t("playing.resultIdle")}
                </p>
              </>
            ) : (
              <div className="countdown-status" role="status">
                <p className="countdown-label">{t("playing.roundStartsIn")}</p>
                <p key={countdownDisplay} className="countdown-number">
                  {countdownDisplay}
                </p>
              </div>
            )
          ) : (
            <div className="clear-summary" role="status" aria-live="polite">
              <div
                key={clearCelebrationTick}
                className={`clear-celebration clear-celebration-${clearCelebrationTier}`}
                aria-hidden="true"
              >
                {clearEffect.burstSpecs.map((burstSpec) => (
                  <span
                    key={burstSpec.id}
                    className={`clear-burst ${
                      clearEffect.withShockwave ? "clear-burst-shockwave" : ""
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
              <p className="clear-meta">
                {t("playing.finalQuestions")}: {requiredCount}
              </p>
              <p className="clear-meta">
                {t("playing.wrongAnswers")}: {wrongAnswerCount}
              </p>
            </div>
          )}
        </div>
        {isCleared && (
          <div className="clear-actions">
            <button
              className="primary-back-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onBackToStageSelect();
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t("playing.back")}</span>
            </button>
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
    </main>
  );
};
