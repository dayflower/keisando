import { describe, expect, it } from "vitest";
import {
  buildClearEffectViewModel,
  buildComboEffectViewModel,
  buildPerformanceEffectStyleViewModel,
} from "./effectViewModel";

describe("buildComboEffectViewModel", () => {
  it("returns none tier and no particles below combo threshold", () => {
    expect(
      buildComboEffectViewModel({
        currentCombo: 0,
        lastResult: null,
        comboMilestoneValue: 0,
      }),
    ).toEqual({
      comboTier: "none",
      particleIndexes: [],
      showBurst: false,
      milestoneLabel: "",
    });
  });

  it("returns low tier at x3 without particles", () => {
    expect(
      buildComboEffectViewModel({
        currentCombo: 3,
        lastResult: "correct",
        comboMilestoneValue: 3,
      }),
    ).toEqual({
      comboTier: "low",
      particleIndexes: [],
      showBurst: true,
      milestoneLabel: "3 COMBO!",
    });
  });

  it("returns mid tier with ten particles at x5", () => {
    const result = buildComboEffectViewModel({
      currentCombo: 5,
      lastResult: "correct",
      comboMilestoneValue: 5,
    });

    expect(result.comboTier).toBe("mid");
    expect(result.particleIndexes).toHaveLength(10);
    expect(result.showBurst).toBe(true);
    expect(result.milestoneLabel).toBe("5 COMBO!");
  });

  it("returns high tier with fourteen particles at x10", () => {
    const result = buildComboEffectViewModel({
      currentCombo: 10,
      lastResult: "correct",
      comboMilestoneValue: 10,
    });

    expect(result.comboTier).toBe("high");
    expect(result.particleIndexes).toHaveLength(14);
    expect(result.showBurst).toBe(true);
    expect(result.milestoneLabel).toBe("10 COMBO!");
  });

  it("shows burst only for a correct answer", () => {
    expect(
      buildComboEffectViewModel({
        currentCombo: 10,
        lastResult: "wrong",
        comboMilestoneValue: 0,
      }).showBurst,
    ).toBe(false);
  });
});

describe("buildClearEffectViewModel", () => {
  it("keeps normal clear without badge or shockwave", () => {
    const result = buildClearEffectViewModel({
      clearCelebrationTier: "normal",
      clearBestBadge: "none",
    });

    expect(result.burstSpecs).toHaveLength(1);
    expect(result.withShockwave).toBe(false);
    expect(result.badgeLabel).toBe("");
  });

  it("keeps no-mistake clear without badge", () => {
    const result = buildClearEffectViewModel({
      clearCelebrationTier: "noMistake",
      clearBestBadge: "none",
    });

    expect(result.burstSpecs).toHaveLength(3);
    expect(result.withShockwave).toBe(false);
    expect(result.badgeLabel).toBe("");
  });

  it("keeps my-best clear badge and shockwave", () => {
    const result = buildClearEffectViewModel({
      clearCelebrationTier: "best",
      clearBestBadge: "my",
    });

    expect(result.burstSpecs).toHaveLength(3);
    expect(result.withShockwave).toBe(true);
    expect(result.badgeLabel).toBe("MY BEST");
  });

  it("keeps global-best clear badge and shockwave", () => {
    const result = buildClearEffectViewModel({
      clearCelebrationTier: "best",
      clearBestBadge: "global",
    });

    expect(result.burstSpecs).toHaveLength(7);
    expect(result.withShockwave).toBe(true);
    expect(result.badgeLabel).toBe("GLOBAL BEST");
  });
});

describe("buildPerformanceEffectStyleViewModel", () => {
  it("maps round progress to performance effect style values", () => {
    expect(buildPerformanceEffectStyleViewModel(0)).toEqual({
      hueShift: "0deg",
      driftDuration: "22.00s",
    });
    expect(buildPerformanceEffectStyleViewModel(1)).toEqual({
      hueShift: "64deg",
      driftDuration: "14.00s",
    });
  });
});
