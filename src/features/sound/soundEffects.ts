type AudioContextConstructor = typeof AudioContext;

type Tone = {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  delay?: number;
};

type SoundPattern = Tone[];

type CreateSoundEffectsControllerInput = {
  initialMuted: boolean;
  getAudioContextConstructor?: () => AudioContextConstructor | null;
};

export type SoundEffectsController = {
  isMuted: () => boolean;
  setMuted: (nextMuted: boolean) => void;
  playUiTap: () => void;
  playCountdownTick: () => void;
  playRoundStart: () => void;
  playCorrect: () => void;
  playWrong: () => void;
  playStageClear: () => void;
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
const STAGE_CLEAR_PATTERN: SoundPattern = [
  { frequency: 660, duration: 0.08, gain: 0.075, type: "triangle", delay: 0 },
  {
    frequency: 880,
    duration: 0.1,
    gain: 0.075,
    type: "triangle",
    delay: 0.09,
  },
  {
    frequency: 1175,
    duration: 0.14,
    gain: 0.08,
    type: "triangle",
    delay: 0.21,
  },
];

const playPattern = (audioContext: AudioContext, pattern: SoundPattern) => {
  const now = audioContext.currentTime;

  for (const tone of pattern) {
    const startTime = now + (tone.delay ?? 0);
    const stopTime = startTime + tone.duration;

    const oscillator = audioContext.createOscillator();
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, startTime);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(tone.gain, startTime + 0.005);
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

  return {
    isMuted: () => isMuted,
    setMuted: (nextMuted) => {
      isMuted = nextMuted;
    },
    playUiTap: () => play(UI_TAP_PATTERN),
    playCountdownTick: () => play(COUNTDOWN_PATTERN),
    playRoundStart: () => play(ROUND_START_PATTERN),
    playCorrect: () => play(CORRECT_PATTERN),
    playWrong: () => play(WRONG_PATTERN),
    playStageClear: () => play(STAGE_CLEAR_PATTERN),
  };
};
