import type { StageRunRecord } from "../../shared/types";

export type ClearSoundVariant =
  | "globalBest"
  | "myBest"
  | "noMistake"
  | "withMistake";

export type ClearCelebrationTier = "normal" | "noMistake" | "best";

export type ClearBestBadge = "none" | "global" | "my";
export type ClearBurstSpec = {
  id: string;
  x: number;
  y: number;
  scale: number;
  delayMs: number;
  hueShiftDeg: number;
};
type ClearBurstConfig = {
  count: number;
  spread: number;
  intervalMs: number;
  baseScale: number;
  withShockwave: boolean;
};

export const isNewBestRecord = (
  candidate: StageRunRecord,
  best: StageRunRecord | null,
): boolean => {
  if (!best) return true;
  if (candidate.elapsedMs !== best.elapsedMs) {
    return candidate.elapsedMs < best.elapsedMs;
  }
  return candidate.recordedAt < best.recordedAt;
};

export const mapClearSoundVariantToCelebration = (
  variant: ClearSoundVariant,
): {
  clearCelebrationTier: ClearCelebrationTier;
  clearBestBadge: ClearBestBadge;
} => {
  switch (variant) {
    case "globalBest":
      return {
        clearCelebrationTier: "best",
        clearBestBadge: "global",
      };
    case "myBest":
      return {
        clearCelebrationTier: "best",
        clearBestBadge: "my",
      };
    case "noMistake":
      return {
        clearCelebrationTier: "noMistake",
        clearBestBadge: "none",
      };
    default:
      return {
        clearCelebrationTier: "normal",
        clearBestBadge: "none",
      };
  }
};

const NORMAL_BURST_CONFIG: ClearBurstConfig = {
  count: 1,
  spread: 0,
  intervalMs: 0,
  baseScale: 1,
  withShockwave: false,
};

const NO_MISTAKE_BURST_CONFIG: ClearBurstConfig = {
  count: 3,
  spread: 20,
  intervalMs: 145,
  baseScale: 0.9,
  withShockwave: false,
};

const MY_BEST_BURST_CONFIG: ClearBurstConfig = {
  count: 3,
  spread: 23,
  intervalMs: 130,
  baseScale: 0.93,
  withShockwave: true,
};

const GLOBAL_BEST_BURST_CONFIG: ClearBurstConfig = {
  count: 7,
  spread: 28,
  intervalMs: 112,
  baseScale: 0.96,
  withShockwave: true,
};

const getClearBurstConfig = (
  tier: ClearCelebrationTier,
  badge: ClearBestBadge,
): ClearBurstConfig => {
  if (tier === "best") {
    return badge === "global" ? GLOBAL_BEST_BURST_CONFIG : MY_BEST_BURST_CONFIG;
  }
  if (tier === "noMistake") {
    return NO_MISTAKE_BURST_CONFIG;
  }
  return NORMAL_BURST_CONFIG;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const buildClearBurstSpecs = (
  tier: ClearCelebrationTier,
  badge: ClearBestBadge,
): ClearBurstSpec[] => {
  const config = getClearBurstConfig(tier, badge);
  return Array.from({ length: config.count }, (_, index) => {
    const angle = ((index * 137.5 + 18) * Math.PI) / 180;
    const radiusRatio = 0.45 + ((index * 17) % 31) / 100;
    const radius = config.spread * radiusRatio;
    const x = clamp(50 + Math.cos(angle) * radius, 18, 82);
    const y = clamp(34 + Math.sin(angle) * radius * 0.82, 14, 70);
    const scale = config.baseScale + ((index * 7) % 5) * 0.12;
    return {
      id: `burst-${tier}-${badge}-${index + 1}`,
      x,
      y,
      scale,
      delayMs: index * config.intervalMs,
      hueShiftDeg: -8 + index * 9,
    };
  });
};

export const shouldUseClearShockwave = (
  tier: ClearCelebrationTier,
  badge: ClearBestBadge,
): boolean => getClearBurstConfig(tier, badge).withShockwave;
