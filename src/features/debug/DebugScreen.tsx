import { ArrowLeft } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import type { StageClearCondition, StageDefinition } from "../../shared/types";
import type {
  ClearBestBadge,
  ClearCelebrationTier,
} from "../game/clearCelebration";
import {
  buildClearEffectViewModel,
  buildComboEffectViewModel,
} from "../game/effectViewModel";
import { SoundToggleButton } from "../sound/SoundToggleButton";

type DebugScreenProps = {
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToStageSelect: () => void;
  onPlayUiTap: () => void;
  onStartBgm: () => void;
  onStopBgm: () => void;
  onPlayCountdownTick: () => void;
  onPlayRoundStart: () => void;
  onPlayCorrect: () => void;
  onPlayWrong: () => void;
  onPlayClearGlobalBest: () => void;
  onPlayClearMyBest: () => void;
  onPlayClearNoMistake: () => void;
  onPlayClearWithMistake: () => void;
  stages: StageDefinition[];
  stageClearConditionById: Map<string, StageClearCondition>;
  onUpdateStageClearCondition: (
    stageId: string,
    next: StageClearCondition,
  ) => void;
  onResetStageClearConditions: () => void;
  canResetUnlockProgress: boolean;
  onResetUnlockProgress: () => void;
  onClearAllData: () => void;
};

export const DebugScreen = ({
  isMuted,
  onToggleMute,
  onBackToStageSelect,
  onPlayUiTap,
  onStartBgm,
  onStopBgm,
  onPlayCountdownTick,
  onPlayRoundStart,
  onPlayCorrect,
  onPlayWrong,
  onPlayClearGlobalBest,
  onPlayClearMyBest,
  onPlayClearNoMistake,
  onPlayClearWithMistake,
  stages,
  stageClearConditionById,
  onUpdateStageClearCondition,
  onResetStageClearConditions,
  canResetUnlockProgress,
  onResetUnlockProgress,
  onClearAllData,
}: DebugScreenProps) => {
  const [comboEffectTick, setComboEffectTick] = useState(0);
  const [comboMilestoneTick, setComboMilestoneTick] = useState(0);
  const [comboMilestoneValue, setComboMilestoneValue] = useState(0);
  const [comboTier, setComboTier] = useState<"none" | "low" | "mid" | "high">(
    "none",
  );
  const [clearCelebrationTick, setClearCelebrationTick] = useState(0);
  const [clearCelebrationTier, setClearCelebrationTier] =
    useState<ClearCelebrationTier>("normal");
  const [clearBestBadge, setClearBestBadge] = useState<ClearBestBadge>("none");
  const [hasTriggeredClearEffect, setHasTriggeredClearEffect] = useState(false);

  const comboEffect = buildComboEffectViewModel({
    currentCombo:
      comboTier === "high"
        ? 10
        : comboTier === "mid"
          ? 5
          : comboTier === "low"
            ? 3
            : 0,
    lastResult: comboTier === "none" ? null : "correct",
    comboMilestoneValue,
  });
  const clearEffect = buildClearEffectViewModel({
    clearCelebrationTier,
    clearBestBadge,
  });
  const effectStyle = useMemo(
    () =>
      ({
        "--fx-hue-shift": "18deg",
        "--fx-drift-duration": "16s",
      }) as CSSProperties,
    [],
  );

  const triggerCombo = (
    nextTier: "low" | "mid" | "high",
    comboValue: number,
  ) => {
    setComboTier(nextTier);
    setComboEffectTick((prev) => prev + 1);
    if (comboValue > 0) {
      setComboMilestoneValue(comboValue);
      setComboMilestoneTick((prev) => prev + 1);
    }
  };

  const triggerClear = (
    nextTier: ClearCelebrationTier,
    nextBadge: ClearBestBadge,
  ) => {
    setHasTriggeredClearEffect(true);
    setClearCelebrationTier(nextTier);
    setClearBestBadge(nextBadge);
    setClearCelebrationTick((prev) => prev + 1);
  };

  return (
    <main className="app">
      <section className="stage-card debug-card">
        <div className="stage-head-row">
          <p className="stage-tag">Debug</p>
          <div className="stage-head-actions">
            <button
              className="back-icon-button"
              type="button"
              onClick={onBackToStageSelect}
              aria-label="Back to stage select"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <SoundToggleButton isMuted={isMuted} onToggleMute={onToggleMute} />
          </div>
        </div>

        <h1 className="title">Keisando</h1>
        <p className="stage-select-description">
          Debug actions for development.
        </p>

        <section
          className="debug-section"
          aria-labelledby="debug-storage-heading"
        >
          <h2 id="debug-storage-heading" className="debug-section-title">
            Storage
          </h2>
          <div className="debug-storage-actions">
            <button
              className="debug-button debug-storage-button"
              type="button"
              onClick={onResetUnlockProgress}
              disabled={!canResetUnlockProgress}
            >
              Reset Stage Unlock Progress (Active Player)
            </button>
            <button
              className="debug-danger-button"
              type="button"
              onClick={onClearAllData}
            >
              Clear All Local Data
            </button>
          </div>
        </section>

        <section
          className="debug-section"
          aria-labelledby="debug-clear-condition-heading"
        >
          <h2
            id="debug-clear-condition-heading"
            className="debug-section-title"
          >
            Stage Clear Conditions
          </h2>
          <div className="debug-condition-list">
            {stages.map((stage) => {
              const condition =
                stageClearConditionById.get(stage.id) ??
                stage.defaultClearCondition;

              return (
                <div key={stage.id} className="debug-condition-item">
                  <p className="debug-condition-title">{stage.name}</p>
                  <label
                    className="debug-condition-label"
                    htmlFor={`${stage.id}-seconds`}
                  >
                    Clear within (seconds)
                  </label>
                  <input
                    id={`${stage.id}-seconds`}
                    className="debug-condition-input"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={(condition.maxElapsedMs / 1000).toFixed(1)}
                    onChange={(event) => {
                      const nextSeconds = Number.parseFloat(event.target.value);
                      if (!Number.isFinite(nextSeconds)) {
                        return;
                      }

                      onUpdateStageClearCondition(stage.id, {
                        maxElapsedMs: Math.max(
                          Math.round(nextSeconds * 1000),
                          100,
                        ),
                        requireNoMistake: condition.requireNoMistake,
                      });
                    }}
                  />
                  <label className="debug-condition-check-label">
                    <input
                      type="checkbox"
                      checked={condition.requireNoMistake}
                      onChange={(event) => {
                        onUpdateStageClearCondition(stage.id, {
                          maxElapsedMs: condition.maxElapsedMs,
                          requireNoMistake: event.target.checked,
                        });
                      }}
                    />
                    No mistakes required
                  </label>
                </div>
              );
            })}
          </div>
          <button
            className="debug-button"
            type="button"
            onClick={onResetStageClearConditions}
          >
            Reset Clear Conditions to Default
          </button>
        </section>

        <section
          className="debug-section"
          aria-labelledby="debug-effects-heading"
        >
          <h2 id="debug-effects-heading" className="debug-section-title">
            Effects
          </h2>
          <div className="debug-effects-preview" style={effectStyle}>
            <div className="performance-bg" aria-hidden="true">
              <span className="performance-bg-shape performance-bg-shape-a" />
              <span className="performance-bg-shape performance-bg-shape-b" />
              <span className="performance-bg-shape performance-bg-shape-c" />
            </div>
            <div className="debug-effects-inner">
              <div className="debug-effects-subsection">
                <p className="debug-effects-label">Combo Burst</p>
                <div className="progress-bar-track">
                  {comboMilestoneValue > 0 && (
                    <span
                      key={comboMilestoneTick}
                      className="combo-progress-overlay"
                      aria-hidden="true"
                    >
                      {comboMilestoneValue} COMBO!
                    </span>
                  )}
                </div>
                {comboEffect.comboTier !== "none" && (
                  <div
                    key={comboEffectTick}
                    className={`combo-effects combo-effects-active combo-tier-${comboEffect.comboTier}`}
                    aria-hidden="true"
                  >
                    <span className="combo-ring" />
                    {comboEffect.particleIndexes.map((particleIndex) => (
                      <span
                        key={`debug-combo-particle-${particleIndex}`}
                        className="combo-particle"
                        style={
                          { "--combo-index": particleIndex } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="debug-effects-subsection">
                <p className="debug-effects-label">Clear Celebration</p>
                <div className="clear-summary debug-clear-summary">
                  {hasTriggeredClearEffect && (
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
                  {hasTriggeredClearEffect && clearEffect.badgeLabel && (
                    <p className="clear-best-badge">{clearEffect.badgeLabel}</p>
                  )}
                  <p className="clear-title">Stage Clear!</p>
                </div>
              </div>
            </div>
          </div>
          <div className="debug-list">
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerCombo("low", 3)}
            >
              Combo Burst: x3
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerCombo("mid", 5)}
            >
              Combo Burst: x5
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerCombo("high", 10)}
            >
              Combo Burst: x10
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("normal", "none")}
            >
              Clear Effect: Normal
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("noMistake", "none")}
            >
              Clear Effect: No Mistake
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("best", "my")}
            >
              Clear Effect: My Best
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("best", "global")}
            >
              Clear Effect: Global Best
            </button>
          </div>
        </section>

        <section
          className="debug-section"
          aria-labelledby="debug-sound-heading"
        >
          <h2 id="debug-sound-heading" className="debug-section-title">
            Sound
          </h2>
          <div className="debug-list">
            <button className="debug-button" type="button" onClick={onStartBgm}>
              BGM Start
            </button>
            <button className="debug-button" type="button" onClick={onStopBgm}>
              BGM Stop
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayUiTap}
            >
              UI Tap
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayCountdownTick}
            >
              Countdown Tick
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayRoundStart}
            >
              Round Start
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayCorrect}
            >
              Correct
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayWrong}
            >
              Wrong
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearGlobalBest}
            >
              Clear: Global Best
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearMyBest}
            >
              Clear: My Best
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearNoMistake}
            >
              Clear: No Mistake
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearWithMistake}
            >
              Clear: With Mistake
            </button>
          </div>
        </section>
      </section>
    </main>
  );
};
