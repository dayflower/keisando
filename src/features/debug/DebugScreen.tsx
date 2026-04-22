import { ArrowLeft } from "lucide-react";
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
  onClearAllData,
}: DebugScreenProps) => {
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
          <button
            className="debug-danger-button"
            type="button"
            onClick={onClearAllData}
          >
            Clear All Local Data
          </button>
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
