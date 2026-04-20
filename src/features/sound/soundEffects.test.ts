import { describe, expect, it, vi } from "vitest";
import { createSoundEffectsController } from "./soundEffects";

describe("createSoundEffectsController", () => {
  it("does not initialize audio when muted", () => {
    const ctorFactory = vi.fn(() => {
      throw new Error("should not be called");
    });

    const controller = createSoundEffectsController({
      initialMuted: true,
      getAudioContextConstructor: ctorFactory,
    });

    expect(() => controller.playUiTap()).not.toThrow();
    expect(() => controller.playCorrect()).not.toThrow();
    expect(ctorFactory).not.toHaveBeenCalled();
  });

  it("does not throw when audio context constructor is unavailable", () => {
    const controller = createSoundEffectsController({
      initialMuted: false,
      getAudioContextConstructor: () => null,
    });

    expect(() => controller.playCountdownTick()).not.toThrow();
    expect(() => controller.playRoundStart()).not.toThrow();
    expect(() => controller.playWrong()).not.toThrow();
    expect(() => controller.playStageClear()).not.toThrow();
  });

  it("initializes audio and plays when unmuted", () => {
    const oscillator = {
      type: "sine" as OscillatorType,
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const context = {
      state: "running",
      currentTime: 0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gainNode),
    };
    const ctorFactory = vi.fn(() => {
      return function MockAudioContext(this: unknown) {
        return context;
      } as unknown as typeof AudioContext;
    });

    const controller = createSoundEffectsController({
      initialMuted: false,
      getAudioContextConstructor: ctorFactory,
    });

    expect(() => controller.playUiTap()).not.toThrow();
    expect(ctorFactory).toHaveBeenCalledTimes(1);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);

    controller.setMuted(true);
    controller.playUiTap();
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
  });
});
