import { useEffect, useMemo, useRef, useState } from "react";

type Question = {
  left: number;
  right: number;
  answer: number;
  options: number[];
};

const BASE_QUESTION_COUNT = 10;
const BEST_TIME_STORAGE_KEY = "keisando:stage1:best-time-ms";

const shuffle = <T,>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const createOptions = (answer: number): number[] => {
  const candidates = new Set<number>([answer]);
  while (candidates.size < 4) {
    const offset = Math.floor(Math.random() * 7) - 3;
    const value = Math.max(0, Math.min(18, answer + offset));
    if (value !== answer) {
      candidates.add(value);
    }
  }
  return shuffle([...candidates]);
};

const createQuestion = (usedExpressions: Set<string>): Question => {
  const maxUnique = 10 * 10;
  if (usedExpressions.size >= maxUnique) {
    usedExpressions.clear();
  }

  let left = 0;
  let right = 0;
  let expression = "";
  do {
    left = Math.floor(Math.random() * 10);
    right = Math.floor(Math.random() * 10);
    expression = `${left}+${right}`;
  } while (usedExpressions.has(expression));

  usedExpressions.add(expression);
  const answer = left + right;

  return {
    left,
    right,
    answer,
    options: createOptions(answer),
  };
};

const formatElapsedTime = (elapsedMs: number): string => {
  const centiseconds = Math.floor(elapsedMs / 10) % 100;
  const seconds = Math.floor(elapsedMs / 1000) % 60;
  const minutes = Math.floor(elapsedMs / 60000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
};

const loadBestTime = (): number | null => {
  try {
    const raw = localStorage.getItem(BEST_TIME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveBestTime = (elapsedMs: number) => {
  try {
    localStorage.setItem(BEST_TIME_STORAGE_KEY, String(elapsedMs));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

function App() {
  const usedExpressionsRef = useRef(new Set<string>());
  const [question, setQuestion] = useState<Question>(() =>
    createQuestion(usedExpressionsRef.current),
  );
  const [answeredCount, setAnsweredCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(BASE_QUESTION_COUNT);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [stageStartMs, setStageStartMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [clearElapsedMs, setClearElapsedMs] = useState<number | null>(null);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(() => loadBestTime());
  const isCleared = answeredCount >= requiredCount;

  const remainingCount = useMemo(
    () => Math.max(requiredCount - answeredCount, 0),
    [answeredCount, requiredCount],
  );
  const elapsedMs = clearElapsedMs ?? Math.max(nowMs - stageStartMs, 0);

  useEffect(() => {
    if (isCleared) return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCleared]);

  const handleAnswer = (selected: number) => {
    if (isCleared) return;

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
        saveBestTime(elapsedAtClear);
      }
      return;
    }

    setQuestion(createQuestion(usedExpressionsRef.current));
  };

  const resetStage = () => {
    const startMs = Date.now();
    usedExpressionsRef.current = new Set<string>();
    setQuestion(createQuestion(usedExpressionsRef.current));
    setAnsweredCount(0);
    setRequiredCount(BASE_QUESTION_COUNT);
    setLastResult(null);
    setStageStartMs(startMs);
    setNowMs(startMs);
    setClearElapsedMs(null);
  };

  return (
    <main className="app">
      <section className="stage-card">
        <p className="stage-tag">Stage 1 / Addition</p>
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

        {!isCleared ? (
          <>
            <p className="expression">
              {question.left} + {question.right} = ?
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
          <div className="clear-box">
            <p className="clear-title">Stage Clear!</p>
            <p className="clear-time">
              Clear time: {formatElapsedTime(elapsedMs)}
            </p>
            <p className="clear-time">
              Final questions: {requiredCount} (base {BASE_QUESTION_COUNT})
            </p>
          </div>
        )}

        <button className="restart-button" type="button" onClick={resetStage}>
          Restart Stage
        </button>
      </section>
    </main>
  );
}

export default App;
