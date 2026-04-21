type AudioContextConstructor = typeof AudioContext;

type Tone = {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  delay?: number;
  attack?: number;
};

type SoundPattern = Tone[];

type CreateSoundEffectsControllerInput = {
  initialMuted: boolean;
  getAudioContextConstructor?: () => AudioContextConstructor | null;
};

export type SoundEffectsController = {
  isMuted: () => boolean;
  setMuted: (nextMuted: boolean) => void;
  startBgm: () => void;
  stopBgm: () => void;
  playUiTap: () => void;
  playCountdownTick: () => void;
  playRoundStart: () => void;
  playCorrect: () => void;
  playWrong: () => void;
  playClearGlobalBest: () => void;
  playClearMyBest: () => void;
  playClearNoMistake: () => void;
  playClearWithMistake: () => void;
};

const defaultGetAudioContextConstructor =
  (): AudioContextConstructor | null => {
    if (typeof globalThis === "undefined") return null;

    const audioGlobal = globalThis as typeof globalThis & {
      webkitAudioContext?: AudioContextConstructor;
    };

    return audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext ?? null;
  };

const UI_TAP_PATTERN: SoundPattern = [
  { frequency: 900, duration: 0.045, gain: 0.07, type: "triangle" },
];
const COUNTDOWN_PATTERN: SoundPattern = [
  { frequency: 150, duration: 0.8, gain: 0.08, type: "square" },
];
const ROUND_START_PATTERN: SoundPattern = [
  {
    frequency: 587.33,
    duration: 1.0,
    gain: 0.11,
    type: "square",
    delay: 0,
  },
];
const CORRECT_PATTERN: SoundPattern = [
  { frequency: 740, duration: 0.065, gain: 0.075, type: "triangle", delay: 0 },
  {
    frequency: 980,
    duration: 0.09,
    gain: 0.075,
    type: "triangle",
    delay: 0.07,
  },
];
const WRONG_PATTERN: SoundPattern = [
  { frequency: 150, duration: 0.84, gain: 0.08, type: "sawtooth" },
];
const CLEAR_GLOBAL_BEST_PATTERN: SoundPattern = [
  { frequency: 783.99, duration: 0.12, gain: 0.1, type: "triangle", delay: 0 },
  {
    frequency: 987.77,
    duration: 0.13,
    gain: 0.105,
    type: "triangle",
    delay: 0.12,
  },
  {
    frequency: 1174.66,
    duration: 0.14,
    gain: 0.11,
    type: "triangle",
    delay: 0.25,
  },
  {
    frequency: 1567.98,
    duration: 0.4,
    gain: 0.115,
    type: "sine",
    delay: 0.38,
  },
  {
    frequency: 1975.53,
    duration: 0.29,
    gain: 0.075,
    type: "triangle",
    delay: 0.48,
  },
];
const CLEAR_MY_BEST_PATTERN: SoundPattern = [
  { frequency: 783.99, duration: 0.12, gain: 0.09, type: "triangle", delay: 0 },
  {
    frequency: 987.77,
    duration: 0.12,
    gain: 0.095,
    type: "triangle",
    delay: 0.14,
  },
  {
    frequency: 1174.66,
    duration: 0.13,
    gain: 0.1,
    type: "triangle",
    delay: 0.27,
  },
  {
    frequency: 1567.98,
    duration: 0.36,
    gain: 0.105,
    type: "sine",
    delay: 0.4,
  },
];
const CLEAR_NO_MISTAKE_PATTERN: SoundPattern = [
  { frequency: 659.25, duration: 0.12, gain: 0.09, type: "triangle", delay: 0 },
  {
    frequency: 880,
    duration: 0.13,
    gain: 0.09,
    type: "triangle",
    delay: 0.12,
  },
  {
    frequency: 1046.5,
    duration: 0.23,
    gain: 0.095,
    type: "triangle",
    delay: 0.24,
  },
  {
    frequency: 1318.5,
    duration: 0.17,
    gain: 0.065,
    type: "sine",
    delay: 0.34,
  },
];
const CLEAR_WITH_MISTAKE_PATTERN: SoundPattern = [
  { frequency: 659.25, duration: 0.11, gain: 0.08, type: "triangle", delay: 0 },
  {
    frequency: 880,
    duration: 0.12,
    gain: 0.08,
    type: "triangle",
    delay: 0.12,
  },
  {
    frequency: 1046.5,
    duration: 0.21,
    gain: 0.085,
    type: "triangle",
    delay: 0.22,
  },
];
const BGM_LOOP_SECONDS = 1.6;
const BGM_LOOP_GAIN = 0.44;
const BGM_HAT_DELAYS = [0.2, 0.6, 1.0, 1.4] as const;
const BGM_HAT_PATTERN: SoundPattern = BGM_HAT_DELAYS.flatMap((delay) => [
  {
    frequency: 4200,
    duration: 0.018,
    gain: 0.024,
    type: "square",
    delay,
    attack: 0.001,
  },
  {
    frequency: 6200,
    duration: 0.015,
    gain: 0.02,
    type: "triangle",
    delay,
    attack: 0.001,
  },
  {
    frequency: 8800,
    duration: 0.012,
    gain: 0.017,
    type: "sawtooth",
    delay,
    attack: 0.001,
  },
]);
const BGM_KICK_AND_HAT_PATTERN: SoundPattern = [
  { frequency: 58, duration: 0.11, gain: 0.16, type: "sine", delay: 0 },
  { frequency: 58, duration: 0.11, gain: 0.16, type: "sine", delay: 0.4 },
  { frequency: 58, duration: 0.11, gain: 0.16, type: "sine", delay: 0.8 },
  { frequency: 58, duration: 0.11, gain: 0.16, type: "sine", delay: 1.2 },
  ...BGM_HAT_PATTERN,
];
const BGM_PATTERN_BANK: SoundPattern[] = [
  [
    ...BGM_KICK_AND_HAT_PATTERN,
    { frequency: 110, duration: 0.18, gain: 0.08, type: "sawtooth", delay: 0 },
    {
      frequency: 146.83,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.2,
    },
    {
      frequency: 164.81,
      duration: 0.2,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.4,
    },
    {
      frequency: 146.83,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.6,
    },
    {
      frequency: 110,
      duration: 0.18,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.8,
    },
    {
      frequency: 146.83,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.0,
    },
    {
      frequency: 174.61,
      duration: 0.2,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.2,
    },
    {
      frequency: 146.83,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.4,
    },
    {
      frequency: 659.25,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 0.2,
    },
    {
      frequency: 783.99,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 0.6,
    },
    {
      frequency: 880,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 1.0,
    },
    {
      frequency: 1046.5,
      duration: 0.1,
      gain: 0.055,
      type: "triangle",
      delay: 1.4,
    },
  ],
  [
    ...BGM_KICK_AND_HAT_PATTERN,
    {
      frequency: 123.47,
      duration: 0.18,
      gain: 0.08,
      type: "sawtooth",
      delay: 0,
    },
    {
      frequency: 164.81,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.2,
    },
    { frequency: 185, duration: 0.2, gain: 0.08, type: "sawtooth", delay: 0.4 },
    {
      frequency: 164.81,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.6,
    },
    {
      frequency: 123.47,
      duration: 0.18,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.8,
    },
    {
      frequency: 164.81,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.0,
    },
    { frequency: 196, duration: 0.2, gain: 0.08, type: "sawtooth", delay: 1.2 },
    {
      frequency: 164.81,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.4,
    },
    {
      frequency: 698.46,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 0.2,
    },
    {
      frequency: 880,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 0.6,
    },
    {
      frequency: 987.77,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 1.0,
    },
    {
      frequency: 1174.66,
      duration: 0.1,
      gain: 0.055,
      type: "triangle",
      delay: 1.4,
    },
  ],
  [
    ...BGM_KICK_AND_HAT_PATTERN,
    {
      frequency: 130.81,
      duration: 0.18,
      gain: 0.08,
      type: "sawtooth",
      delay: 0,
    },
    {
      frequency: 174.61,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.2,
    },
    { frequency: 196, duration: 0.2, gain: 0.08, type: "sawtooth", delay: 0.4 },
    {
      frequency: 174.61,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.6,
    },
    {
      frequency: 130.81,
      duration: 0.18,
      gain: 0.08,
      type: "sawtooth",
      delay: 0.8,
    },
    {
      frequency: 174.61,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.0,
    },
    { frequency: 220, duration: 0.2, gain: 0.08, type: "sawtooth", delay: 1.2 },
    {
      frequency: 174.61,
      duration: 0.16,
      gain: 0.08,
      type: "sawtooth",
      delay: 1.4,
    },
    {
      frequency: 783.99,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 0.2,
    },
    {
      frequency: 987.77,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 0.6,
    },
    {
      frequency: 1174.66,
      duration: 0.08,
      gain: 0.05,
      type: "triangle",
      delay: 1.0,
    },
    {
      frequency: 1318.5,
      duration: 0.1,
      gain: 0.055,
      type: "triangle",
      delay: 1.4,
    },
  ],
];

type PlayPatternOptions = {
  startTime?: number;
  gainScale?: number;
};

const playPattern = (
  audioContext: AudioContext,
  pattern: SoundPattern,
  options: PlayPatternOptions = {},
) => {
  const startBase = options.startTime ?? audioContext.currentTime;
  const gainScale = options.gainScale ?? 1;

  for (const tone of pattern) {
    const startTime = startBase + (tone.delay ?? 0);
    const stopTime = startTime + tone.duration;

    const oscillator = audioContext.createOscillator();
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, startTime);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0001, startTime);
    const attack = tone.attack ?? 0.005;
    gainNode.gain.linearRampToValueAtTime(
      tone.gain * gainScale,
      startTime + attack,
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(stopTime + 0.01);
  }
};

export const createSoundEffectsController = ({
  initialMuted,
  getAudioContextConstructor = defaultGetAudioContextConstructor,
}: CreateSoundEffectsControllerInput): SoundEffectsController => {
  let isMuted = initialMuted;
  let audioContext: AudioContext | null = null;
  let bgmLoopTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let bgmStartedAt: number | null = null;
  let previousBgmPatternIndex: number | null = null;

  const ensureAudioContext = (): AudioContext | null => {
    if (audioContext?.state === "closed") {
      audioContext = null;
    }

    if (audioContext) {
      return audioContext;
    }

    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) return null;

    try {
      audioContext = new AudioContextCtor();
      return audioContext;
    } catch {
      return null;
    }
  };

  const play = (pattern: SoundPattern) => {
    if (isMuted) return;

    const context = ensureAudioContext();
    if (!context) return;

    if (context.state !== "running") {
      void context
        .resume()
        .then(() => {
          if (context.state !== "running") return;
          playPattern(context, pattern);
        })
        .catch(() => {
          // Ignore resume failures and try on future interactions.
        });
      return;
    }

    try {
      playPattern(context, pattern);
    } catch {
      // Ignore playback failures to avoid interrupting gameplay.
    }
  };

  const stopBgm = () => {
    if (bgmLoopTimeoutId !== null) {
      clearTimeout(bgmLoopTimeoutId);
      bgmLoopTimeoutId = null;
    }
    bgmStartedAt = null;
    previousBgmPatternIndex = null;
  };

  const scheduleBgmLoop = (loopStartTime: number) => {
    if (isMuted || bgmStartedAt === null) return;

    const context = ensureAudioContext();
    if (!context || context.state !== "running") {
      stopBgm();
      return;
    }

    try {
      const patternIndex = (() => {
        if (BGM_PATTERN_BANK.length <= 1) return 0;
        const baseIndex = Math.floor(Math.random() * BGM_PATTERN_BANK.length);
        if (baseIndex !== previousBgmPatternIndex) {
          return baseIndex;
        }
        return (baseIndex + 1) % BGM_PATTERN_BANK.length;
      })();
      previousBgmPatternIndex = patternIndex;

      playPattern(context, BGM_PATTERN_BANK[patternIndex], {
        startTime: loopStartTime,
        gainScale: BGM_LOOP_GAIN,
      });
    } catch {
      stopBgm();
      return;
    }

    const nextLoopStartTime = loopStartTime + BGM_LOOP_SECONDS;
    const waitMs = Math.max(
      120,
      (nextLoopStartTime - context.currentTime - 0.08) * 1000,
    );
    bgmLoopTimeoutId = setTimeout(() => {
      scheduleBgmLoop(nextLoopStartTime);
    }, waitMs);
  };

  const startBgm = () => {
    if (isMuted || bgmStartedAt !== null) return;

    const context = ensureAudioContext();
    if (!context) return;

    if (context.state !== "running") {
      void context
        .resume()
        .then(() => {
          if (context.state !== "running") return;
          if (isMuted || bgmStartedAt !== null) return;
          bgmStartedAt = context.currentTime;
          scheduleBgmLoop(context.currentTime + 0.04);
        })
        .catch(() => {
          // Ignore resume failures and try on future interactions.
        });
      return;
    }

    bgmStartedAt = context.currentTime;
    scheduleBgmLoop(context.currentTime + 0.04);
  };

  return {
    isMuted: () => isMuted,
    setMuted: (nextMuted) => {
      isMuted = nextMuted;
      if (nextMuted) {
        stopBgm();
      }
    },
    startBgm,
    stopBgm,
    playUiTap: () => play(UI_TAP_PATTERN),
    playCountdownTick: () => play(COUNTDOWN_PATTERN),
    playRoundStart: () => play(ROUND_START_PATTERN),
    playCorrect: () => play(CORRECT_PATTERN),
    playWrong: () => play(WRONG_PATTERN),
    playClearGlobalBest: () => play(CLEAR_GLOBAL_BEST_PATTERN),
    playClearMyBest: () => play(CLEAR_MY_BEST_PATTERN),
    playClearNoMistake: () => play(CLEAR_NO_MISTAKE_PATTERN),
    playClearWithMistake: () => play(CLEAR_WITH_MISTAKE_PATTERN),
  };
};
