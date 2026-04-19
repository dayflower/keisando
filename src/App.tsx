import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

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

type Player = {
  id: string;
  name: string;
  createdAt: number;
};

type Screen = "stageSelect" | "playerSelect" | "playerRegister" | "playing";

const ROUND_COUNTDOWN_SECONDS = 3;
const ROUND_COUNTDOWN_MS = ROUND_COUNTDOWN_SECONDS * 1000;
const PLAYER_NAME_MIN_LENGTH = 1;
const PLAYER_NAME_MAX_LENGTH = 20;
const PLAYERS_STORAGE_KEY = "keisando:players";
const ACTIVE_PLAYER_ID_STORAGE_KEY = "keisando:active-player-id";

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

const getBestTimeStorageKey = (stageId: string, playerId: string): string =>
  `keisando:player:${playerId}:${stageId}:best-time-ms`;

const normalizePlayerName = (value: string): string => value.trim();

const createPlayerId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const createPlayer = (name: string): Player => ({
  id: createPlayerId(),
  name,
  createdAt: Date.now(),
});

const isValidPlayerName = (name: string): boolean =>
  name.length >= PLAYER_NAME_MIN_LENGTH && name.length <= PLAYER_NAME_MAX_LENGTH;

const loadPlayers = (): Player[] => {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((candidate): candidate is Player => {
        if (!candidate || typeof candidate !== "object") return false;
        const player = candidate as Partial<Player>;
        return (
          typeof player.id === "string" &&
          typeof player.name === "string" &&
          isValidPlayerName(normalizePlayerName(player.name)) &&
          typeof player.createdAt === "number" &&
          Number.isFinite(player.createdAt)
        );
      })
      .map((player) => ({
        id: player.id,
        name: normalizePlayerName(player.name),
        createdAt: player.createdAt,
      }));
  } catch {
    return [];
  }
};

const savePlayers = (players: Player[]) => {
  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const loadActivePlayerId = (): string | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_PLAYER_ID_STORAGE_KEY);
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
};

const saveActivePlayerId = (activePlayerId: string) => {
  try {
    localStorage.setItem(ACTIVE_PLAYER_ID_STORAGE_KEY, activePlayerId);
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

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

  for (
    let value = answerMin;
    candidates.size < 4 && value <= answerMax;
    value += 1
  ) {
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

const loadBestTime = (stageId: string, playerId: string): number | null => {
  try {
    const raw = localStorage.getItem(getBestTimeStorageKey(stageId, playerId));
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveBestTime = (stageId: string, playerId: string, elapsedMs: number) => {
  try {
    localStorage.setItem(
      getBestTimeStorageKey(stageId, playerId),
      String(elapsedMs),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

function App() {
  const usedExpressionsRef = useRef(new Set<string>());
  const [screen, setScreen] = useState<Screen>("stageSelect");

  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [activePlayerId, setActivePlayerId] = useState<string | null>(() =>
    loadActivePlayerId(),
  );

  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(
    null,
  );
  const [question, setQuestion] = useState<Question | null>(null);
  const [playingPlayerId, setPlayingPlayerId] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [stageStartMs, setStageStartMs] = useState(() => Date.now());
  const [countdownEndMs, setCountdownEndMs] = useState(
    () => Date.now() + ROUND_COUNTDOWN_MS,
  );
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [clearElapsedMs, setClearElapsedMs] = useState<number | null>(null);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(null);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const activePlayer = useMemo(
    () => players.find((player) => player.id === activePlayerId) ?? null,
    [activePlayerId, players],
  );

  const playingPlayer = useMemo(
    () => players.find((player) => player.id === playingPlayerId) ?? activePlayer,
    [activePlayer, players, playingPlayerId],
  );

  const isPlaying =
    screen === "playing" && selectedStage !== null && question !== null;
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
    if (players.length > 0) return;

    const defaultPlayer = createPlayer("Player 1");
    setPlayers([defaultPlayer]);
    setActivePlayerId(defaultPlayer.id);
  }, [players]);

  useEffect(() => {
    if (players.length === 0) return;

    if (!activePlayerId || !players.some((player) => player.id === activePlayerId)) {
      setActivePlayerId(players[0].id);
    }
  }, [activePlayerId, players]);

  useEffect(() => {
    if (players.length === 0) return;
    savePlayers(players);
  }, [players]);

  useEffect(() => {
    if (!activePlayerId) return;
    saveActivePlayerId(activePlayerId);
  }, [activePlayerId]);

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
    if (!activePlayer) return;

    const startAtMs = Date.now();
    usedExpressionsRef.current = new Set<string>();

    setScreen("playing");
    setSelectedStage(stage);
    setQuestion(createQuestion(stage, usedExpressionsRef.current));
    setPlayingPlayerId(activePlayer.id);
    setAnsweredCount(0);
    setRequiredCount(stage.baseQuestionCount);
    setLastResult(null);
    setStageStartMs(startAtMs);
    setCountdownEndMs(startAtMs + ROUND_COUNTDOWN_MS);
    setIsRoundActive(false);
    setNowMs(startAtMs);
    setClearElapsedMs(null);
    setBestTimeMs(loadBestTime(stage.id, activePlayer.id));
  };

  const handleAnswer = (selected: number) => {
    if (
      !selectedStage ||
      !question ||
      !isRoundActive ||
      isCleared ||
      !playingPlayerId
    ) {
      return;
    }

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
        saveBestTime(selectedStage.id, playingPlayerId, elapsedAtClear);
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
    setScreen("stageSelect");
    setSelectedStage(null);
    setQuestion(null);
    setPlayingPlayerId(null);
    setAnsweredCount(0);
    setRequiredCount(0);
    setLastResult(null);
    setIsRoundActive(false);
    setClearElapsedMs(null);
  };

  const openPlayerSelect = () => {
    setScreen("playerSelect");
  };

  const openPlayerRegister = () => {
    setRegisterError(null);
    setNewPlayerName("");
    setScreen("playerRegister");
  };

  const handleSelectPlayer = (playerId: string) => {
    setActivePlayerId(playerId);
    setScreen("stageSelect");
  };

  const handleRegisterPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = normalizePlayerName(newPlayerName);

    if (!isValidPlayerName(normalizedName)) {
      setRegisterError("Name must be 1-20 characters.");
      return;
    }

    const isDuplicate = players.some(
      (player) => player.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (isDuplicate) {
      setRegisterError("This player name already exists.");
      return;
    }

    const nextPlayer = createPlayer(normalizedName);
    setPlayers((prev) => [...prev, nextPlayer]);
    setActivePlayerId(nextPlayer.id);
    setRegisterError(null);
    setNewPlayerName("");
    setScreen("stageSelect");
  };

  if (!activePlayer) {
    return (
      <main className="app">
        <section className="stage-card">
          <p className="stage-tag">Preparing Player</p>
          <h1 className="title">Keisando</h1>
        </section>
      </main>
    );
  }

  if (screen === "stageSelect") {
    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">Select Stage</p>
            <p className="active-player-chip">Player: {activePlayer.name}</p>
          </div>
          <h1 className="title">Keisando</h1>
          <p className="stage-select-description">
            Choose a stage to start Time Attack.
          </p>

          <div className="player-actions">
            <button
              className="player-nav-button"
              type="button"
              onClick={openPlayerSelect}
            >
              Select Player
            </button>
            <button
              className="player-nav-button player-nav-button-secondary"
              type="button"
              onClick={openPlayerRegister}
            >
              Register Player
            </button>
          </div>

          <div className="stage-list">
            {STAGES.map((stage) => {
              const stageBestTimeMs = loadBestTime(stage.id, activePlayer.id);

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
                  <span className="stage-item-description">
                    {stage.description}
                  </span>
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

  if (screen === "playerSelect") {
    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">Select Player</p>
            <button
              className="close-button"
              type="button"
              onClick={() => setScreen("stageSelect")}
              aria-label="Back to stage select"
            >
              ×
            </button>
          </div>
          <h1 className="title">Keisando</h1>
          <p className="stage-select-description">Choose your active player.</p>

          <div className="player-list">
            {players.map((player) => {
              const isCurrent = player.id === activePlayer.id;

              return (
                <button
                  className={`player-item ${isCurrent ? "player-item-active" : ""}`}
                  key={player.id}
                  type="button"
                  onClick={() => handleSelectPlayer(player.id)}
                >
                  <span className="player-item-name">{player.name}</span>
                  {isCurrent && <span className="player-item-badge">Active</span>}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  if (screen === "playerRegister") {
    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">Register Player</p>
            <button
              className="close-button"
              type="button"
              onClick={() => setScreen("stageSelect")}
              aria-label="Back to stage select"
            >
              ×
            </button>
          </div>
          <h1 className="title">Keisando</h1>
          <p className="stage-select-description">Create a new local player profile.</p>

          <form className="player-register-form" onSubmit={handleRegisterPlayer}>
            <label className="player-register-label" htmlFor="player-name-input">
              Player Name
            </label>
            <input
              id="player-name-input"
              className="player-register-input"
              type="text"
              value={newPlayerName}
              maxLength={PLAYER_NAME_MAX_LENGTH}
              onChange={(event) => {
                setNewPlayerName(event.target.value);
                if (registerError) {
                  setRegisterError(null);
                }
              }}
              autoFocus
            />
            {registerError && <p className="player-register-error">{registerError}</p>}

            <div className="player-register-actions">
              <button className="clear-close-button" type="submit">
                Register
              </button>
              <button
                className="clear-retry-button"
                type="button"
                onClick={() => setScreen("stageSelect")}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (!isPlaying || !selectedStage || !question) {
    return null;
  }

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

                <div className="diamond-grid">
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
            <button
              className="clear-close-button"
              type="button"
              onClick={backToStageSelect}
            >
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
