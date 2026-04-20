import { ArrowLeft } from "lucide-react";
import { formatElapsedTime } from "../../shared/formatters";
import type { Player, Question, StageDefinition } from "../../shared/types";

type PlayingScreenProps = {
  selectedStage: StageDefinition;
  playingPlayer: Player | null;
  question: Question;
  answeredCount: number;
  requiredCount: number;
  remainingCount: number;
  elapsedMs: number;
  bestTimeMs: number | null;
  isCleared: boolean;
  isRoundActive: boolean;
  countdownDisplay: number;
  wrongAnswerCount: number;
  lastResult: "correct" | "wrong" | null;
  onAnswer: (selected: number) => void;
  onBackToStageSelect: () => void;
  onResetStage: () => void;
};

export const PlayingScreen = ({
  selectedStage,
  playingPlayer,
  question,
  answeredCount,
  requiredCount,
  remainingCount,
  elapsedMs,
  bestTimeMs,
  isCleared,
  isRoundActive,
  countdownDisplay,
  wrongAnswerCount,
  lastResult,
  onAnswer,
  onBackToStageSelect,
  onResetStage,
}: PlayingScreenProps) => {
  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">
            {selectedStage.name} / {selectedStage.tag}
            {playingPlayer && ` / ${playingPlayer.name}`}
          </p>
          {!isCleared && (
            <button
              className="back-icon-button"
              type="button"
              onClick={onBackToStageSelect}
              aria-label="Back to stage select"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <h1 className="title">Keisando</h1>
        <div className="progress-row">
          <p>Answered: {answeredCount}</p>
          <p>Total: {requiredCount}</p>
          <p>Remaining: {remainingCount}</p>
        </div>
        <div className="timer-row">
          <p className="timer-pill">Time: {formatElapsedTime(elapsedMs)}</p>
          <p className="timer-pill">
            Best:{" "}
            {bestTimeMs !== null ? formatElapsedTime(bestTimeMs) : "--:--.--"}
          </p>
        </div>

        <div className="round-content" aria-live="polite">
          {!isCleared ? (
            isRoundActive ? (
              <>
                <p className="expression">
                  {question.left} {question.operator} {question.right} = ?
                </p>

                <div className="diamond-grid">
                  <button
                    className="choice choice-top"
                    type="button"
                    onClick={() => onAnswer(question.options[0])}
                  >
                    {question.options[0]}
                  </button>
                  <button
                    className="choice choice-left"
                    type="button"
                    onClick={() => onAnswer(question.options[1])}
                  >
                    {question.options[1]}
                  </button>
                  <button
                    className="choice choice-right"
                    type="button"
                    onClick={() => onAnswer(question.options[2])}
                  >
                    {question.options[2]}
                  </button>
                  <button
                    className="choice choice-bottom"
                    type="button"
                    onClick={() => onAnswer(question.options[3])}
                  >
                    {question.options[3]}
                  </button>
                </div>

                <p
                  className={`result-text ${
                    lastResult === "correct" ? "result-correct" : "result-wrong"
                  }`}
                >
                  {lastResult === "correct" && "Correct!"}
                  {lastResult === "wrong" && "Wrong! +1 question"}
                  {lastResult === null && "Choose the correct answer."}
                </p>
              </>
            ) : (
              <div className="countdown-box" role="status">
                <p className="countdown-label">Round starts in</p>
                <p key={countdownDisplay} className="countdown-number">
                  {countdownDisplay}
                </p>
              </div>
            )
          ) : (
            <div className="clear-box">
              <p className="clear-title">Stage Clear!</p>
              <p className="clear-time">
                Clear time: {formatElapsedTime(elapsedMs)}
              </p>
              <p className="clear-time">
                Final questions: {requiredCount} (base{" "}
                {selectedStage.baseQuestionCount})
              </p>
              <p className="clear-time">Wrong answers: {wrongAnswerCount}</p>
            </div>
          )}
        </div>
        {isCleared && (
          <div className="clear-actions">
            <button
              className="primary-back-button"
              type="button"
              onClick={onBackToStageSelect}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back</span>
            </button>
            <button
              className="clear-retry-button"
              type="button"
              onClick={onResetStage}
            >
              Retry
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
