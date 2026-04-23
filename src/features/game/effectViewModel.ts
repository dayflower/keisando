import {
  buildClearBurstSpecs,
  type ClearBestBadge,
  type ClearCelebrationTier,
  shouldUseClearShockwave,
} from "./clearCelebration";

export type ComboEffectTier = "none" | "low" | "mid" | "high";

type BuildComboEffectViewModelInput = {
  currentCombo: number;
  lastResult: "correct" | "wrong" | null;
  comboMilestoneValue: number;
};

type BuildClearEffectViewModelInput = {
  clearCelebrationTier: ClearCelebrationTier;
  clearBestBadge: ClearBestBadge;
};

const getComboEffectTier = (currentCombo: number): ComboEffectTier => {
  if (currentCombo >= 10) {
    return "high";
  }
  if (currentCombo >= 5) {
    return "mid";
  }
  if (currentCombo >= 3) {
    return "low";
  }
  return "none";
};

const getComboParticleCount = (comboTier: ComboEffectTier): number => {
  if (comboTier === "high") {
    return 14;
  }
  if (comboTier === "mid") {
    return 10;
  }
  return 0;
};

const getClearBestBadgeLabel = (clearBestBadge: ClearBestBadge): string => {
  if (clearBestBadge === "global") {
    return "GLOBAL BEST";
  }
  if (clearBestBadge === "my") {
    return "MY BEST";
  }
  return "";
};

export const buildComboEffectViewModel = ({
  currentCombo,
  lastResult,
  comboMilestoneValue,
}: BuildComboEffectViewModelInput) => {
  const comboTier = getComboEffectTier(currentCombo);
  const particleCount = getComboParticleCount(comboTier);

  return {
    comboTier,
    particleIndexes: Array.from({ length: particleCount }, (_, index) => index),
    showBurst: lastResult === "correct" && comboTier !== "none",
    milestoneLabel:
      comboMilestoneValue > 0 ? `${comboMilestoneValue} COMBO!` : "",
  };
};

export const buildClearEffectViewModel = ({
  clearCelebrationTier,
  clearBestBadge,
}: BuildClearEffectViewModelInput) => ({
  burstSpecs: buildClearBurstSpecs(clearCelebrationTier, clearBestBadge),
  withShockwave: shouldUseClearShockwave(clearCelebrationTier, clearBestBadge),
  badgeLabel: getClearBestBadgeLabel(clearBestBadge),
});

export const buildPerformanceEffectStyleViewModel = (
  roundProgress: number,
) => ({
  hueShift: `${Math.round(roundProgress * 64)}deg`,
  driftDuration: `${Math.max(12, 22 - roundProgress * 8).toFixed(2)}s`,
});
