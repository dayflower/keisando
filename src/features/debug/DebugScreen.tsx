import { ArrowLeft } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { getStageLabel, type LocaleOverride, useI18n } from "../../shared/i18n";
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
  const { locale, localeOverride, setLocaleOverride, t } = useI18n();
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
    comboMilestoneLabel: t("playing.comboMilestone", {
      count: comboMilestoneValue,
    }),
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
  const clearBestBadgeLabel =
    clearBestBadge === "global"
      ? t("debug.clearBadgeGlobalBest")
      : clearBestBadge === "my"
        ? t("debug.clearBadgeMyBest")
        : "";
  const localeOptions: Array<{
    key: "system" | "ja" | "en";
    label: string;
    value: LocaleOverride;
  }> = [
    {
      key: "system",
      label: t("debug.languageSystem"),
      value: null,
    },
    {
      key: "ja",
      label: t("debug.languageJapanese"),
      value: "ja",
    },
    {
      key: "en",
      label: t("debug.languageEnglish"),
      value: "en",
    },
  ];

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
          <p className="stage-tag">{t("debug.screenTag")}</p>
          <div className="stage-head-actions">
            <button
              className="back-icon-button"
              type="button"
              onClick={onBackToStageSelect}
              aria-label={t("common.backToStageSelect")}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <SoundToggleButton isMuted={isMuted} onToggleMute={onToggleMute} />
          </div>
        </div>

        <h1 className="title">{t("common.appName")}</h1>
        <p className="stage-select-description">{t("debug.description")}</p>

        <section
          className="debug-section"
          aria-labelledby="debug-language-heading"
        >
          <h2 id="debug-language-heading" className="debug-section-title">
            {t("debug.language")}
          </h2>
          <div className="debug-list">
            {localeOptions.map((option) => (
              <button
                key={option.key}
                className="debug-button"
                type="button"
                aria-pressed={localeOverride === option.value}
                onClick={() => setLocaleOverride(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section
          className="debug-section"
          aria-labelledby="debug-storage-heading"
        >
          <h2 id="debug-storage-heading" className="debug-section-title">
            {t("debug.storage")}
          </h2>
          <div className="debug-storage-actions">
            <button
              className="debug-button debug-storage-button"
              type="button"
              onClick={onResetUnlockProgress}
              disabled={!canResetUnlockProgress}
            >
              {t("debug.resetUnlockProgress")}
            </button>
            <button
              className="debug-danger-button"
              type="button"
              onClick={onClearAllData}
            >
              {t("debug.clearAllData")}
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
            {t("debug.clearConditions")}
          </h2>
          <div className="debug-condition-list">
            {stages.map((stage) => {
              const condition =
                stageClearConditionById.get(stage.id) ??
                stage.defaultClearCondition;

              return (
                <div key={stage.id} className="debug-condition-item">
                  <p className="debug-condition-title">
                    {getStageLabel(locale, stage.id)}
                  </p>
                  <label
                    className="debug-condition-label"
                    htmlFor={`${stage.id}-seconds`}
                  >
                    {t("debug.clearWithinSeconds")}
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
                    {t("debug.noMistakesRequired")}
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
            {t("debug.resetClearConditions")}
          </button>
        </section>

        <section
          className="debug-section"
          aria-labelledby="debug-effects-heading"
        >
          <h2 id="debug-effects-heading" className="debug-section-title">
            {t("debug.effects")}
          </h2>
          <div className="debug-effects-preview" style={effectStyle}>
            <div className="performance-bg" aria-hidden="true">
              <span className="performance-bg-shape performance-bg-shape-a" />
              <span className="performance-bg-shape performance-bg-shape-b" />
              <span className="performance-bg-shape performance-bg-shape-c" />
            </div>
            <div className="debug-effects-inner">
              <div className="debug-effects-subsection">
                <p className="debug-effects-label">{t("debug.comboBurst")}</p>
                <div className="progress-bar-track">
                  {comboMilestoneValue > 0 && (
                    <span
                      key={comboMilestoneTick}
                      className="combo-progress-overlay"
                      aria-hidden="true"
                    >
                      {comboEffect.milestoneLabel}
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
                <p className="debug-effects-label">
                  {t("debug.clearCelebration")}
                </p>
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
                    <p className="clear-best-badge">{clearBestBadgeLabel}</p>
                  )}
                  <p className="clear-title">{t("debug.clearTitle")}</p>
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
              {t("debug.comboBurstX3")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerCombo("mid", 5)}
            >
              {t("debug.comboBurstX5")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerCombo("high", 10)}
            >
              {t("debug.comboBurstX10")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("normal", "none")}
            >
              {t("debug.clearEffectNormal")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("noMistake", "none")}
            >
              {t("debug.clearEffectNoMistake")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("best", "my")}
            >
              {t("debug.clearEffectMyBest")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={() => triggerClear("best", "global")}
            >
              {t("debug.clearEffectGlobalBest")}
            </button>
          </div>
        </section>

        <section
          className="debug-section"
          aria-labelledby="debug-sound-heading"
        >
          <h2 id="debug-sound-heading" className="debug-section-title">
            {t("debug.sound")}
          </h2>
          <div className="debug-list">
            <button className="debug-button" type="button" onClick={onStartBgm}>
              {t("debug.bgmStart")}
            </button>
            <button className="debug-button" type="button" onClick={onStopBgm}>
              {t("debug.bgmStop")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayUiTap}
            >
              {t("debug.uiTap")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayCountdownTick}
            >
              {t("debug.countdownTick")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayRoundStart}
            >
              {t("debug.roundStart")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayCorrect}
            >
              {t("debug.correct")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayWrong}
            >
              {t("debug.wrong")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearGlobalBest}
            >
              {t("debug.clearSoundGlobalBest")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearMyBest}
            >
              {t("debug.clearSoundMyBest")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearNoMistake}
            >
              {t("debug.clearSoundNoMistake")}
            </button>
            <button
              className="debug-button"
              type="button"
              onClick={onPlayClearWithMistake}
            >
              {t("debug.clearSoundWithMistake")}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
};
