import { ArrowLeft } from "lucide-react";
import { SoundToggleButton } from "./SoundToggleButton";

type SoundDebugScreenProps = {
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToStageSelect: () => void;
  onPlayUiTap: () => void;
  onPlayCountdownTick: () => void;
  onPlayRoundStart: () => void;
  onPlayCorrect: () => void;
  onPlayWrong: () => void;
  onPlayClearGlobalBest: () => void;
  onPlayClearMyBest: () => void;
  onPlayClearNoMistake: () => void;
  onPlayClearWithMistake: () => void;
};

export const SoundDebugScreen = ({
  isMuted,
  onToggleMute,
  onBackToStageSelect,
  onPlayUiTap,
  onPlayCountdownTick,
  onPlayRoundStart,
  onPlayCorrect,
  onPlayWrong,
  onPlayClearGlobalBest,
  onPlayClearMyBest,
  onPlayClearNoMistake,
  onPlayClearWithMistake,
}: SoundDebugScreenProps) => {
  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">Sound Debug</p>
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
          Tap a button to play each sound effect.
        </p>

        <div className="sound-debug-list">
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayUiTap}
          >
            UI Tap
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayCountdownTick}
          >
            Countdown Tick
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayRoundStart}
          >
            Round Start
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayCorrect}
          >
            Correct
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayWrong}
          >
            Wrong
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayClearGlobalBest}
          >
            Clear: Global Best
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayClearMyBest}
          >
            Clear: My Best
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayClearNoMistake}
          >
            Clear: No Mistake
          </button>
          <button
            className="sound-debug-button"
            type="button"
            onClick={onPlayClearWithMistake}
          >
            Clear: With Mistake
          </button>
        </div>
      </section>
    </main>
  );
};
