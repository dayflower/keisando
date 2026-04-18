import { useMemo, useRef, useState } from "react";

type Question = {
  left: number;
  right: number;
  answer: number;
  options: number[];
};

const BASE_QUESTION_COUNT = 10;

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

function App() {
  const usedExpressionsRef = useRef(new Set<string>());
  const [question, setQuestion] = useState<Question>(() =>
    createQuestion(usedExpressionsRef.current),
  );
  const [answeredCount, setAnsweredCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(BASE_QUESTION_COUNT);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const isCleared = answeredCount >= requiredCount;

  const remainingCount = useMemo(
    () => Math.max(requiredCount - answeredCount, 0),
    [answeredCount, requiredCount],
  );

  const handleAnswer = (selected: number) => {
    if (isCleared) return;

    const isCorrect = selected === question.answer;
    setLastResult(isCorrect ? "correct" : "wrong");
    setAnsweredCount((prev) => prev + 1);

    if (!isCorrect) {
      setRequiredCount((prev) => prev + 1);
    }

    setQuestion(createQuestion(usedExpressionsRef.current));
  };

  const resetStage = () => {
    usedExpressionsRef.current = new Set<string>();
    setQuestion(createQuestion(usedExpressionsRef.current));
    setAnsweredCount(0);
    setRequiredCount(BASE_QUESTION_COUNT);
    setLastResult(null);
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
