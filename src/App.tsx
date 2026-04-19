import { useEffect, useMemo, useRef, useState } from "react";

type StageExpression = {
  left: number;
  right: number;
  operator: "+" | "-";
  answer: number;
};

type StageDefinition = {
  id: string;
  name: string;
  tag: string;
  description: string;
  baseQuestionCount: number;
  answerMin: number;
  answerMax: number;
  createExpression: () => StageExpression;
};

type Question = {
  left: number;
  right: number;
  operator: "+" | "-";
  answer: number;
  options: number[];
};

const ROUND_COUNTDOWN_SECONDS = 3;
const ROUND_COUNTDOWN_MS = ROUND_COUNTDOWN_SECONDS * 1000;

const STAGES: StageDefinition[] = [
  {
    id: "stage1",
    name: "Stage 1",
    tag: "Addition",
    description: "Single-digit addition (0-9 + 0-9)",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 18,
    createExpression: () => {
      const left = Math.floor(Math.random() * 10);
      const right = Math.floor(Math.random() * 10);
      return {
        left,
        right,
        operator: "+",
        answer: left + right,
      };
    },
  },
  {
    id: "stage2",
    name: "Stage 2",
    tag: "Subtraction",
    description: "Single-digit subtraction (0-9 - 0-9)",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 9,
    createExpression: () => {
      const left = Math.floor(Math.random() * 10);
      const right = Math.floor(Math.random() * (left + 1));
      return {
        left,
        right,
        operator: "-",
        answer: left - right,
      };
    },
  },
  {
    id: "stage3",
    name: "Stage 3",
    tag: "Subtraction+",
    description: "1-2 digits minus 1 digit (result 0-9)",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 9,
    createExpression: () => {
      const answer = Math.floor(Math.random() * 10);
      const right = Math.floor(Math.random() * 9) + 1;
      const left = answer + right;
      return {
        left,
        right,
        operator: "-",
        answer,
      };
    },
  },
];

const getBestTimeStorageKey = (stageId: string): string =>
  `keisando:${stageId}:best-time-ms`;

const shuffle = <T,>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const createOptions = (
  answer: number,
  answerMin: number,
  answerMax: number,
): number[] => {
  const candidates = new Set<number>([answer]);
  let guard = 0;

  while (candidates.size < 4 && guard < 200) {
    const offset = Math.floor(Math.random() * 9) - 4;
    const value = Math.max(answerMin, Math.min(answerMax, answer + offset));
    if (value !== answer) {
      candidates.add(value);
    }
    guard += 1;
  }

  for (let value = answerMin; candidates.size < 4 && value <= answerMax; value += 1) {
    if (value !== answer) {
      candidates.add(value);
    }
  }

  return shuffle([...candidates]);
};

const createQuestion = (
  stage: StageDefinition,
  usedExpressions: Set<string>,
): Question => {
  const maxUnique = 200;
  if (usedExpressions.size >= maxUnique) {
    usedExpressions.clear();
  }

  let expression: StageExpression;
  let key: string;
  do {
    expression = stage.createExpression();
    key = `${expression.left}${expression.operator}${expression.right}`;
  } while (usedExpressions.has(key));

  usedExpressions.add(key);

  return {
    ...expression,
    options: createOptions(expression.answer, stage.answerMin, stage.answerMax),
  };
};

const formatElapsedTime = (elapsedMs: number): string => {
  const centiseconds = Math.floor(elapsedMs / 10) % 100;
  const seconds = Math.floor(elapsedMs / 1000) % 60;
  const minutes = Math.floor(elapsedMs / 60000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
};

const loadBestTime = (stageId: string): number | null => {
  try {
    const raw = localStorage.getItem(getBestTimeStorageKey(stageId));
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveBestTime = (stageId: string, elapsedMs: number) => {
  try {
    localStorage.setItem(getBestTimeStorageKey(stageId), String(elapsedMs));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

function App() {
  const usedExpressionsRef = useRef(new Set<string>());
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [stageStartMs, setStageStartMs] = useState(() => Date.now());
  const [countdownEndMs, setCountdownEndMs] = useState(
    () => Date.now() + ROUND_COUNTDOWN_MS,
  );
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [clearElapsedMs, setClearElapsedMs] = useState<number | null>(null);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(null);

  const isPlaying = selectedStage !== null && question !== null;
  const isCleared = isPlaying && answeredCount >= requiredCount;

  const remainingCount = useMemo(
    () => Math.max(requiredCount - answeredCount, 0),
    [answeredCount, requiredCount],
  );
  const wrongAnswerCount = Math.max(
    requiredCount - (selectedStage?.baseQuestionCount ?? 0),
    0,
  );
  const elapsedMs =
    clearElapsedMs ?? (isRoundActive ? Math.max(nowMs - stageStartMs, 0) : 0);
  const countdownSeconds = Math.max(
    Math.ceil((countdownEndMs - nowMs) / 1000),
    0,
  );
  const countdownDisplay = Math.max(countdownSeconds, 1);

  useEffect(() => {
    if (!isPlaying || isCleared) return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCleared, isPlaying]);

  useEffect(() => {
    if (!isPlaying || isCleared || isRoundActive || nowMs < countdownEndMs) {
      return;
    }

    setIsRoundActive(true);
    setStageStartMs(nowMs);
    setNowMs(nowMs);
  }, [countdownEndMs, isCleared, isPlaying, isRoundActive, nowMs]);

  const startStage = (stage: StageDefinition) => {
    const startAtMs = Date.now();
    usedExpressionsRef.current = new Set<string>();
    setSelectedStage(stage);
    setQuestion(createQuestion(stage, usedExpressionsRef.current));
    setAnsweredCount(0);
    setRequiredCount(stage.baseQuestionCount);
    setLastResult(null);
    setStageStartMs(startAtMs);
    setCountdownEndMs(startAtMs + ROUND_COUNTDOWN_MS);
    setIsRoundActive(false);
    setNowMs(startAtMs);
    setClearElapsedMs(null);
    setBestTimeMs(loadBestTime(stage.id));
  };

  const handleAnswer = (selected: number) => {
    if (!selectedStage || !question || !isRoundActive || isCleared) return;

    const isCorrect = selected === question.answer;
    const nextAnsweredCount = answeredCount + 1;
    const nextRequiredCount = requiredCount + (isCorrect ? 0 : 1);
    const nextIsCleared = nextAnsweredCount >= nextRequiredCount;

    setLastResult(isCorrect ? "correct" : "wrong");
    setAnsweredCount(nextAnsweredCount);
    setRequiredCount(nextRequiredCount);

    if (nextIsCleared) {
      const finishedAtMs = Date.now();
      const elapsedAtClear = Math.max(finishedAtMs - stageStartMs, 0);
      setNowMs(finishedAtMs);
      setClearElapsedMs(elapsedAtClear);

      if (bestTimeMs === null || elapsedAtClear < bestTimeMs) {
        setBestTimeMs(elapsedAtClear);
        saveBestTime(selectedStage.id, elapsedAtClear);
      }
      return;
    }

    setQuestion(createQuestion(selectedStage, usedExpressionsRef.current));
  };

  const resetStage = () => {
    if (!selectedStage) return;
    const resetAtMs = Date.now();

    usedExpressionsRef.current = new Set<string>();
    setQuestion(createQuestion(selectedStage, usedExpressionsRef.current));
    setAnsweredCount(0);
    setRequiredCount(selectedStage.baseQuestionCount);
    setLastResult(null);
    setStageStartMs(resetAtMs);
    setCountdownEndMs(resetAtMs + ROUND_COUNTDOWN_MS);
    setIsRoundActive(false);
    setNowMs(resetAtMs);
    setClearElapsedMs(null);
  };

  const backToStageSelect = () => {
    setSelectedStage(null);
    setQuestion(null);
    setAnsweredCount(0);
    setRequiredCount(0);
    setLastResult(null);
    setIsRoundActive(false);
    setClearElapsedMs(null);
  };

  if (!isPlaying || !selectedStage || !question) {
    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">Select Stage</p>
            <span className="stage-head-action-placeholder" aria-hidden="true" />
          </div>
          <h1 className="title">Keisando</h1>
          <p className="stage-select-description">
            Choose a stage to start Time Attack.
          </p>

          <div className="stage-list" role="list" aria-label="Stage list">
            {STAGES.map((stage) => {
              const stageBestTimeMs = loadBestTime(stage.id);

              return (
                <button
                  className="stage-item"
                  key={stage.id}
                  type="button"
                  onClick={() => startStage(stage)}
                >
                  <span className="stage-item-header">
                    <strong>{stage.name}</strong>
                    <span className="stage-item-tag">{stage.tag}</span>
                  </span>
                  <span className="stage-item-description">{stage.description}</span>
                  <span className="stage-item-record">
                    Best: {stageBestTimeMs ? formatElapsedTime(stageBestTimeMs) : "--:--.--"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">
            {selectedStage.name} / {selectedStage.tag}
          </p>
          {!isCleared && (
            <button
              className="close-button"
              type="button"
              onClick={backToStageSelect}
              aria-label="Back to stage select"
            >
              ×
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
            Best: {bestTimeMs !== null ? formatElapsedTime(bestTimeMs) : "--:--.--"}
          </p>
        </div>

        <div className="round-content" aria-live="polite">
          {!isCleared ? (
            isRoundActive ? (
              <>
                <p className="expression">
                  {question.left} {question.operator} {question.right} = ?
                </p>

                <div className="diamond-grid" role="group" aria-label="Answer choices">
                  <button
                    className="choice choice-top"
                    type="button"
                    onClick={() => handleAnswer(question.options[0])}
                  >
                    {question.options[0]}
                  </button>
                  <button
                    className="choice choice-left"
                    type="button"
                    onClick={() => handleAnswer(question.options[1])}
                  >
                    {question.options[1]}
                  </button>
                  <button
                    className="choice choice-right"
                    type="button"
                    onClick={() => handleAnswer(question.options[2])}
                  >
                    {question.options[2]}
                  </button>
                  <button
                    className="choice choice-bottom"
                    type="button"
                    onClick={() => handleAnswer(question.options[3])}
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
              <p className="clear-time">Clear time: {formatElapsedTime(elapsedMs)}</p>
              <p className="clear-time">
                Final questions: {requiredCount} (base {selectedStage.baseQuestionCount})
              </p>
              <p className="clear-time">Wrong answers: {wrongAnswerCount}</p>
            </div>
          )}
        </div>
        {isCleared && (
          <div className="clear-actions">
            <button className="clear-close-button" type="button" onClick={backToStageSelect}>
              Close
            </button>
            <button className="clear-retry-button" type="button" onClick={resetStage}>
              Retry
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
