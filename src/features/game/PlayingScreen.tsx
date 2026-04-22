import { ArrowLeft } from "lucide-react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { formatElapsedTime } from "../../shared/formatters";
import type { Player, Question, StageDefinition } from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";
import type { ClearBestBadge, ClearCelebrationTier } from "./clearCelebration";
import type { EffectOrigin } from "./useGameSession";

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
  onAnswer,
  onBackToStageSelect,
  onResetStage,
  isMuted,
  onToggleMute,
  onUiTap,
}: PlayingScreenProps) => {
  const correctCount = Math.max(answeredCount - wrongAnswerCount, 0);
  const progressMax = selectedStage.baseQuestionCount;
  const progressPercent =
    progressMax > 0 ? Math.min((correctCount / progressMax) * 100, 100) : 0;
  const roundProgress =
    progressMax > 0 ? Math.min(correctCount / progressMax, 1) : 0;
  const comboTier =
    currentCombo >= 10
      ? "high"
      : currentCombo >= 5
        ? "mid"
        : currentCombo >= 3
          ? "low"
          : "none";
  const comboParticleCount =
    comboTier === "high" ? 14 : comboTier === "mid" ? 10 : 0;
  const comboParticleIndexes = Array.from(
    { length: comboParticleCount },
    (_, index) => index,
  );
  const showComboBurst = lastResult === "correct" && comboTier !== "none";
  const comboMilestoneLabel =
    comboMilestoneValue > 0 ? `${comboMilestoneValue} COMBO!` : "";
  const clearConfettiCount =
    clearCelebrationTier === "best"
      ? 22
      : clearCelebrationTier === "noMistake"
        ? 14
        : 8;
  const clearConfettiIndexes = Array.from(
    { length: clearConfettiCount },
    (_, index) => index,
  );
  const clearBestBadgeLabel =
    clearBestBadge === "global"
      ? "GLOBAL BEST"
      : clearBestBadge === "my"
        ? "MY BEST"
        : "";
  const effectStyle = {
    "--fx-hue-shift": `${Math.round(roundProgress * 64)}deg`,
    "--fx-drift-duration": `${Math.max(12, 22 - roundProgress * 8).toFixed(2)}s`,
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

  return (
    <main className="app app-playing" style={effectStyle}>
      <div className="performance-bg" aria-hidden="true">
        <span className="performance-bg-shape performance-bg-shape-a" />
        <span className="performance-bg-shape performance-bg-shape-b" />
        <span className="performance-bg-shape performance-bg-shape-c" />
      </div>
      {showComboBurst && (
        <div
          key={comboEffectTick}
          className={`combo-effects combo-effects-active combo-tier-${comboTier}`}
          style={comboEffectStyle}
          aria-hidden="true"
        >
          <span className="combo-ring" />
          {comboParticleIndexes.map((particleIndex) => (
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
                aria-label="Back to stage select"
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
            Answered: {answeredCount} / {requiredCount}
          </p>
          <p>Remaining: {remainingCount}</p>
        </div>
        <div className="progress-bar-block">
          <div
            className="progress-bar-track"
            role="progressbar"
            aria-label="Question progress"
            aria-valuemin={0}
            aria-valuemax={progressMax}
            aria-valuenow={Math.min(correctCount, progressMax)}
          >
            <span
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
            {comboMilestoneLabel && (
              <span
                key={comboMilestoneTick}
                className="combo-progress-overlay"
                aria-hidden="true"
              >
                {comboMilestoneLabel}
              </span>
            )}
          </div>
        </div>
        <div className="timer-row">
          <p className="timer-pill">Time: {formatElapsedTime(elapsedMs)}</p>
          <p className="timer-pill">
            Best:{" "}
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
                    onClick={(event) =>
                      onAnswer(question.options[0], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[0]}
                  </button>
                  <button
                    className="choice choice-left"
                    type="button"
                    onClick={(event) =>
                      onAnswer(question.options[1], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[1]}
                  </button>
                  <button
                    className="choice choice-right"
                    type="button"
                    onClick={(event) =>
                      onAnswer(question.options[2], resolveEffectOrigin(event))
                    }
                  >
                    {question.options[2]}
                  </button>
                  <button
                    className="choice choice-bottom"
                    type="button"
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
                  {lastResult === "correct" && "Correct!"}
                  {lastResult === "wrong" && "Wrong! +1 question"}
                  {lastResult === null && "Choose the correct answer."}
                </p>
              </>
            ) : (
              <div className="countdown-status" role="status">
                <p className="countdown-label">Round starts in</p>
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
                <span className="clear-radial-core" />
                <span className="clear-radial-ring clear-radial-ring-a" />
                <span className="clear-radial-ring clear-radial-ring-b" />
                {clearConfettiIndexes.map((confettiIndex) => (
                  <span
                    key={`clear-confetti-${confettiIndex}`}
                    className="clear-confetti"
                    style={
                      {
                        "--clear-confetti-index": confettiIndex,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
              {clearBestBadgeLabel && (
                <p className="clear-best-badge">{clearBestBadgeLabel}</p>
              )}
              <p className="clear-title">Stage Clear!</p>
              <p className="clear-primary-time">
                {formatElapsedTime(elapsedMs)}
              </p>
              <p className="clear-primary-label">Clear time</p>
              <p className="clear-meta">
                Final questions: {requiredCount} (base{" "}
                {selectedStage.baseQuestionCount})
              </p>
              <p className="clear-meta">Wrong answers: {wrongAnswerCount}</p>
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
              <span>Back</span>
            </button>
            <button
              className="clear-retry-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onResetStage();
              }}
            >
              Retry
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
