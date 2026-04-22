import type { StageRunRecord } from "../../shared/types";

export type ClearSoundVariant =
  | "globalBest"
  | "myBest"
  | "noMistake"
  | "withMistake";

export type ClearCelebrationTier = "normal" | "noMistake" | "best";

export type ClearBestBadge = "none" | "global" | "my";

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
