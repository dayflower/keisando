import { CircleUserRound, History } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

type StageRunRecord = {
  id: string;
  stageId: string;
  playerId: string;
  elapsedMs: number;
  requiredCount: number;
  wrongCount: number;
  recordedAt: number;
};

type PlayHistoryRecord = {
  id: string;
  playerId: string;
  playedAt: number;
  stageId: string;
  result: "clear" | "fail";
  score: number;
  durationMs: number;
  mistakeCount: number;
  appVersion: string;
};

type PlayerLifetimeSummary = {
  playerId: string;
  totalPlays: number;
  totalClears: number;
  totalScore: number;
  bestScore: number | null;
  lastPlayedAt: number | null;
};

type StageLifetimeSummary = {
  playerId: string;
  stageId: string;
  attempts: number;
  clears: number;
  totalScore: number;
  bestScore: number | null;
  bestDurationMs: number | null;
};

type RankingTab = "global" | "player";

type Screen =
  | "stageSelect"
  | "playerSelect"
  | "playing"
  | "ranking"
  | "historyDetail";

const ROUND_COUNTDOWN_SECONDS = 3;
const ROUND_COUNTDOWN_MS = ROUND_COUNTDOWN_SECONDS * 1000;
const PLAYER_NAME_MIN_LENGTH = 1;
const PLAYER_NAME_MAX_LENGTH = 20;
const USERS_STORAGE_KEY = "keisando:users";
const CURRENT_USER_ID_STORAGE_KEY = "keisando:current-user-id";
const RECORDS_STORAGE_KEY = "keisando:records:v1";
const RANKING_LIMIT = 10;
const HISTORY_RETENTION_DAYS = 10;
const HISTORY_RETENTION_MS = HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const APP_VERSION = "0.0.0";

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

const RECORD_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const normalizePlayerName = (value: string): string => value.trim();

const createPlayerId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const createRecordId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
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
  name.length >= PLAYER_NAME_MIN_LENGTH &&
  name.length <= PLAYER_NAME_MAX_LENGTH;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const loadPlayers = (): Player[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
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
          isFiniteNumber(player.createdAt)
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
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(players));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const loadActivePlayerId = (): string | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY);
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
};

const saveActivePlayerId = (activePlayerId: string | null) => {
  try {
    if (activePlayerId === null) {
      localStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY);
      return;
    }

    localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, activePlayerId);
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const loadRecords = (): StageRunRecord[] => {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((candidate): candidate is StageRunRecord => {
      if (!candidate || typeof candidate !== "object") return false;
      const record = candidate as Partial<StageRunRecord>;

      return (
        typeof record.id === "string" &&
        typeof record.stageId === "string" &&
        typeof record.playerId === "string" &&
        isFiniteNumber(record.elapsedMs) &&
        record.elapsedMs > 0 &&
        isFiniteNumber(record.requiredCount) &&
        record.requiredCount > 0 &&
        isFiniteNumber(record.wrongCount) &&
        record.wrongCount >= 0 &&
        isFiniteNumber(record.recordedAt)
      );
    });
  } catch {
    return [];
  }
};

const saveRecords = (records: StageRunRecord[]) => {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const getHistoryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:history`;

const getLifetimeSummaryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:lifetime-summary`;

const getStageSummaryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:stage-lifetime-summary`;

const createDefaultLifetimeSummary = (
  playerId: string,
): PlayerLifetimeSummary => ({
  playerId,
  totalPlays: 0,
  totalClears: 0,
  totalScore: 0,
  bestScore: null,
  lastPlayedAt: null,
});

const loadPlayerHistory = (playerId: string): PlayHistoryRecord[] => {
  try {
    const raw = localStorage.getItem(getHistoryStorageKey(playerId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((candidate): candidate is PlayHistoryRecord => {
      if (!candidate || typeof candidate !== "object") return false;
      const record = candidate as Partial<PlayHistoryRecord>;
      return (
        typeof record.id === "string" &&
        typeof record.playerId === "string" &&
        record.playerId === playerId &&
        isFiniteNumber(record.playedAt) &&
        typeof record.stageId === "string" &&
        (record.result === "clear" || record.result === "fail") &&
        isFiniteNumber(record.score) &&
        isFiniteNumber(record.durationMs) &&
        record.durationMs >= 0 &&
        isFiniteNumber(record.mistakeCount) &&
        record.mistakeCount >= 0 &&
        typeof record.appVersion === "string"
      );
    });
  } catch {
    return [];
  }
};

const savePlayerHistory = (playerId: string, records: PlayHistoryRecord[]) => {
  try {
    localStorage.setItem(
      getHistoryStorageKey(playerId),
      JSON.stringify(records),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const loadPlayerLifetimeSummary = (playerId: string): PlayerLifetimeSummary => {
  try {
    const raw = localStorage.getItem(getLifetimeSummaryStorageKey(playerId));
    if (!raw) return createDefaultLifetimeSummary(playerId);

    const parsed = JSON.parse(raw) as Partial<PlayerLifetimeSummary>;
    if (!parsed || typeof parsed !== "object") {
      return createDefaultLifetimeSummary(playerId);
    }

    if (
      parsed.playerId !== playerId ||
      !isFiniteNumber(parsed.totalPlays) ||
      parsed.totalPlays < 0 ||
      !isFiniteNumber(parsed.totalClears) ||
      parsed.totalClears < 0 ||
      !isFiniteNumber(parsed.totalScore) ||
      parsed.totalScore < 0
    ) {
      return createDefaultLifetimeSummary(playerId);
    }

    return {
      playerId,
      totalPlays: parsed.totalPlays,
      totalClears: parsed.totalClears,
      totalScore: parsed.totalScore,
      bestScore:
        parsed.bestScore === null || isFiniteNumber(parsed.bestScore)
          ? (parsed.bestScore ?? null)
          : null,
      lastPlayedAt:
        parsed.lastPlayedAt === null || isFiniteNumber(parsed.lastPlayedAt)
          ? (parsed.lastPlayedAt ?? null)
          : null,
    };
  } catch {
    return createDefaultLifetimeSummary(playerId);
  }
};

const savePlayerLifetimeSummary = (
  playerId: string,
  summary: PlayerLifetimeSummary,
) => {
  try {
    localStorage.setItem(
      getLifetimeSummaryStorageKey(playerId),
      JSON.stringify(summary),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const loadPlayerStageLifetimeSummary = (
  playerId: string,
): StageLifetimeSummary[] => {
  try {
    const raw = localStorage.getItem(getStageSummaryStorageKey(playerId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((candidate): candidate is StageLifetimeSummary => {
      if (!candidate || typeof candidate !== "object") return false;
      const summary = candidate as Partial<StageLifetimeSummary>;
      return (
        summary.playerId === playerId &&
        typeof summary.stageId === "string" &&
        isFiniteNumber(summary.attempts) &&
        summary.attempts >= 0 &&
        isFiniteNumber(summary.clears) &&
        summary.clears >= 0 &&
        isFiniteNumber(summary.totalScore) &&
        summary.totalScore >= 0 &&
        (summary.bestScore === null || isFiniteNumber(summary.bestScore)) &&
        (summary.bestDurationMs === null ||
          isFiniteNumber(summary.bestDurationMs))
      );
    });
  } catch {
    return [];
  }
};

const savePlayerStageLifetimeSummary = (
  playerId: string,
  summaries: StageLifetimeSummary[],
) => {
  try {
    localStorage.setItem(
      getStageSummaryStorageKey(playerId),
      JSON.stringify(summaries),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

const pruneHistoryRecords = (
  records: PlayHistoryRecord[],
  nowMs: number,
): PlayHistoryRecord[] => {
  const cutoff = nowMs - HISTORY_RETENTION_MS + 1;
  return records.filter((record) => record.playedAt >= cutoff);
};

const calculateScore = (durationMs: number, wrongCount: number): number => {
  const denominator = Math.max(durationMs + wrongCount * 1000, 1);
  return Math.round(1_000_000 / denominator);
};

const updateLifetimeSummary = (
  current: PlayerLifetimeSummary,
  score: number,
  playedAt: number,
): PlayerLifetimeSummary => ({
  ...current,
  totalPlays: current.totalPlays + 1,
  totalClears: current.totalClears + 1,
  totalScore: current.totalScore + score,
  bestScore:
    current.bestScore === null ? score : Math.max(current.bestScore, score),
  lastPlayedAt: playedAt,
});

const updateStageLifetimeSummaries = (
  current: StageLifetimeSummary[],
  playerId: string,
  stageId: string,
  score: number,
  durationMs: number,
): StageLifetimeSummary[] => {
  const targetIndex = current.findIndex((item) => item.stageId === stageId);
  if (targetIndex === -1) {
    return [
      ...current,
      {
        playerId,
        stageId,
        attempts: 1,
        clears: 1,
        totalScore: score,
        bestScore: score,
        bestDurationMs: durationMs,
      },
    ];
  }

  const target = current[targetIndex];
  const updated: StageLifetimeSummary = {
    ...target,
    attempts: target.attempts + 1,
    clears: target.clears + 1,
    totalScore: target.totalScore + score,
    bestScore:
      target.bestScore === null ? score : Math.max(target.bestScore, score),
    bestDurationMs:
      target.bestDurationMs === null
        ? durationMs
        : Math.min(target.bestDurationMs, durationMs),
  };

  return [
    ...current.slice(0, targetIndex),
    updated,
    ...current.slice(targetIndex + 1),
  ];
};

const sortByRanking = (a: StageRunRecord, b: StageRunRecord): number => {
  if (a.elapsedMs !== b.elapsedMs) {
    return a.elapsedMs - b.elapsedMs;
  }

  return a.recordedAt - b.recordedAt;
};

const getTopRecords = (records: StageRunRecord[]): StageRunRecord[] =>
  [...records].sort(sortByRanking).slice(0, RANKING_LIMIT);

const getPlayerBestTime = (
  records: StageRunRecord[],
  stageId: string,
  playerId: string,
): number | null => {
  const top = getTopRecords(
    records.filter(
      (record) => record.stageId === stageId && record.playerId === playerId,
    ),
  )[0];

  return top ? top.elapsedMs : null;
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

const formatRecordedAt = (recordedAt: number): string =>
  RECORD_DATE_FORMATTER.format(recordedAt);

const formatRate = (numerator: number, denominator: number): string => {
  if (denominator <= 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};

const formatAverageScore = (totalScore: number, count: number): string => {
  if (count <= 0) return "0";
  return String(Math.round(totalScore / count));
};

function App() {
  const usedExpressionsRef = useRef(new Set<string>());
  const [screen, setScreen] = useState<Screen>("stageSelect");

  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [activePlayerId, setActivePlayerId] = useState<string | null>(() =>
    loadActivePlayerId(),
  );
  const [records, setRecords] = useState<StageRunRecord[]>(() => loadRecords());

  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(
    null,
  );
  const [rankingStageId, setRankingStageId] = useState<string | null>(null);
  const [rankingTab, setRankingTab] = useState<RankingTab>("global");
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
  const [historyRecords, setHistoryRecords] = useState<PlayHistoryRecord[]>([]);
  const [historySummary, setHistorySummary] =
    useState<PlayerLifetimeSummary | null>(null);
  const [stageSummaries, setStageSummaries] = useState<StageLifetimeSummary[]>(
    [],
  );

  const [newPlayerName, setNewPlayerName] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const activePlayer = useMemo(
    () => players.find((player) => player.id === activePlayerId) ?? null,
    [activePlayerId, players],
  );

  const historyPlayerId = activePlayerId;

  const playingPlayer = useMemo(
    () => players.find((player) => player.id === playingPlayerId) ?? null,
    [players, playingPlayerId],
  );

  const playerNameById = useMemo(() => {
    return new Map(players.map((player) => [player.id, player.name]));
  }, [players]);

  const rankingStage = useMemo(
    () => STAGES.find((stage) => stage.id === rankingStageId) ?? null,
    [rankingStageId],
  );

  const rankingGlobalTop10 = useMemo(() => {
    if (!rankingStageId) return [];
    return getTopRecords(
      records.filter((record) => record.stageId === rankingStageId),
    );
  }, [rankingStageId, records]);

  const rankingPlayerTop10 = useMemo(() => {
    if (!rankingStageId || !activePlayerId) return [];
    return getTopRecords(
      records.filter(
        (record) =>
          record.stageId === rankingStageId &&
          record.playerId === activePlayerId,
      ),
    );
  }, [rankingStageId, activePlayerId, records]);

  const isPlaying =
    screen === "playing" && selectedStage !== null && question !== null;
  const isCleared = isPlaying && answeredCount >= requiredCount;
  const canStartStage = activePlayer !== null;

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
    if (players.length === 0) {
      if (activePlayerId !== null) {
        setActivePlayerId(null);
      }
      return;
    }

    if (
      activePlayerId !== null &&
      !players.some((player) => player.id === activePlayerId)
    ) {
      setActivePlayerId(players[0].id);
    }
  }, [activePlayerId, players]);

  useEffect(() => {
    savePlayers(players);
  }, [players]);

  useEffect(() => {
    saveActivePlayerId(activePlayerId);
  }, [activePlayerId]);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    if (!activePlayerId) {
      setHistoryRecords([]);
      setHistorySummary(null);
      setStageSummaries([]);
      return;
    }

    setHistoryRecords(
      loadPlayerHistory(activePlayerId).sort((a, b) => b.playedAt - a.playedAt),
    );
    setHistorySummary(loadPlayerLifetimeSummary(activePlayerId));
    setStageSummaries(
      loadPlayerStageLifetimeSummary(activePlayerId).sort((a, b) =>
        a.stageId.localeCompare(b.stageId),
      ),
    );
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
    setBestTimeMs(getPlayerBestTime(records, stage.id, activePlayer.id));
  };

  const openRankingScreen = (stageId: string) => {
    setRankingStageId(stageId);
    setRankingTab("global");
    setScreen("ranking");
  };

  const openPlayHistory = () => {
    if (!activePlayerId) return;
    setScreen("historyDetail");
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
      const wrongCount = Math.max(
        nextRequiredCount - selectedStage.baseQuestionCount,
        0,
      );
      const score = calculateScore(elapsedAtClear, wrongCount);
      const clearRecord: StageRunRecord = {
        id: createRecordId(),
        stageId: selectedStage.id,
        playerId: playingPlayerId,
        elapsedMs: elapsedAtClear,
        requiredCount: nextRequiredCount,
        wrongCount,
        recordedAt: finishedAtMs,
      };
      const historyRecord: PlayHistoryRecord = {
        id: createRecordId(),
        playerId: playingPlayerId,
        playedAt: finishedAtMs,
        stageId: selectedStage.id,
        result: "clear",
        score,
        durationMs: elapsedAtClear,
        mistakeCount: wrongCount,
        appVersion: APP_VERSION,
      };

      const isActiveHistoryTarget = playingPlayerId === historyPlayerId;
      const baseHistory = isActiveHistoryTarget
        ? historyRecords
        : loadPlayerHistory(playingPlayerId).sort(
            (a, b) => b.playedAt - a.playedAt,
          );
      const nextHistory = pruneHistoryRecords(
        [...baseHistory, historyRecord],
        finishedAtMs,
      ).sort((a, b) => b.playedAt - a.playedAt);
      if (isActiveHistoryTarget) {
        setHistoryRecords(nextHistory);
      }
      savePlayerHistory(playingPlayerId, nextHistory);

      const currentLifetime = isActiveHistoryTarget
        ? (historySummary ?? createDefaultLifetimeSummary(playingPlayerId))
        : loadPlayerLifetimeSummary(playingPlayerId);
      const nextLifetime = updateLifetimeSummary(
        currentLifetime,
        score,
        finishedAtMs,
      );
      if (isActiveHistoryTarget) {
        setHistorySummary(nextLifetime);
      }
      savePlayerLifetimeSummary(playingPlayerId, nextLifetime);

      const currentStageSummaries = isActiveHistoryTarget
        ? stageSummaries
        : loadPlayerStageLifetimeSummary(playingPlayerId);
      const nextStageSummaries = updateStageLifetimeSummaries(
        currentStageSummaries,
        playingPlayerId,
        selectedStage.id,
        score,
        elapsedAtClear,
      ).sort((a, b) => a.stageId.localeCompare(b.stageId));
      if (isActiveHistoryTarget) {
        setStageSummaries(nextStageSummaries);
      }
      savePlayerStageLifetimeSummary(playingPlayerId, nextStageSummaries);

      setNowMs(finishedAtMs);
      setClearElapsedMs(elapsedAtClear);
      setRecords((prev) => [...prev, clearRecord]);
      setBestTimeMs((prev) =>
        prev === null ? elapsedAtClear : Math.min(prev, elapsedAtClear),
      );
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
    setRankingStageId(null);
  };

  const openPlayerSelect = () => {
    setRegisterError(null);
    setNewPlayerName("");
    setScreen("playerSelect");
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
    savePlayerLifetimeSummary(
      nextPlayer.id,
      createDefaultLifetimeSummary(nextPlayer.id),
    );
    setRegisterError(null);
    setNewPlayerName("");
    setScreen("stageSelect");
  };

  if (screen === "stageSelect") {
    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">Select Stage</p>
            <div className="stage-head-actions">
              <button
                className="history-icon-button"
                type="button"
                onClick={openPlayHistory}
                aria-label="Open play history"
                disabled={!activePlayer}
              >
                <History size={16} aria-hidden="true" />
              </button>
              <button
                className="player-trigger"
                type="button"
                onClick={openPlayerSelect}
                aria-label="Open player selection"
              >
                <CircleUserRound size={18} aria-hidden="true" />
                <span>{activePlayer?.name ?? "No Player"}</span>
              </button>
            </div>
          </div>
          <h1 className="title">Keisando</h1>
          <p className="stage-select-description">
            Choose a stage to start Time Attack.
          </p>
          {!canStartStage && (
            <p className="stage-select-hint">
              Select a player before starting a stage.
            </p>
          )}

          <div className="stage-list">
            {STAGES.map((stage) => {
              const stageGlobalBest = getTopRecords(
                records.filter((record) => record.stageId === stage.id),
              )[0];
              const stageMyBest =
                activePlayer === null
                  ? null
                  : (getTopRecords(
                      records.filter(
                        (record) =>
                          record.stageId === stage.id &&
                          record.playerId === activePlayer.id,
                      ),
                    )[0] ?? null);

              return (
                <article className="stage-item-shell" key={stage.id}>
                  <button
                    className="stage-item"
                    type="button"
                    onClick={() => startStage(stage)}
                    disabled={!canStartStage}
                  >
                    <span className="stage-item-header">
                      <strong>{stage.name}</strong>
                      <span className="stage-item-tag">{stage.tag}</span>
                    </span>
                    <span className="stage-item-description">
                      {stage.description}
                    </span>
                    <span className="stage-item-record">
                      Global Best:{" "}
                      {stageGlobalBest
                        ? `${formatElapsedTime(stageGlobalBest.elapsedMs)} (${playerNameById.get(stageGlobalBest.playerId) ?? "Unknown"})`
                        : "--:--.--"}
                    </span>
                    <span className="stage-item-record">
                      My Best:{" "}
                      {stageMyBest
                        ? formatElapsedTime(stageMyBest.elapsedMs)
                        : "--:--.--"}
                    </span>
                  </button>
                  <button
                    className="stage-ranking-button"
                    type="button"
                    onClick={() => openRankingScreen(stage.id)}
                  >
                    Ranking
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  if (screen === "historyDetail") {
    if (!activePlayer || !historySummary) {
      return null;
    }

    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">Play History</p>
            <button
              className="close-button"
              type="button"
              onClick={backToStageSelect}
              aria-label="Back to stage select"
            >
              ×
            </button>
          </div>
          <h1 className="title">Keisando</h1>

          <div className="history-section">
            <h2 className="history-section-title">Header</h2>
            <p className="history-item">
              Created at: {formatRecordedAt(activePlayer.createdAt)}
            </p>
            <p className="history-item">
              Last played at:{" "}
              {historySummary.lastPlayedAt
                ? formatRecordedAt(historySummary.lastPlayedAt)
                : "-"}
            </p>
          </div>

          <div className="history-section">
            <h2 className="history-section-title">Lifetime Summary</h2>
            <p className="history-item">
              Total plays: {historySummary.totalPlays}
            </p>
            <p className="history-item">
              Total clears: {historySummary.totalClears}
            </p>
            <p className="history-item">
              Lifetime clear rate:{" "}
              {formatRate(
                historySummary.totalClears,
                historySummary.totalPlays,
              )}
            </p>
            <p className="history-item">
              Lifetime best score: {historySummary.bestScore ?? 0}
            </p>
            <p className="history-item">
              Lifetime average score:{" "}
              {formatAverageScore(
                historySummary.totalScore,
                historySummary.totalPlays,
              )}
            </p>
          </div>

          <div className="history-section">
            <h2 className="history-section-title">
              Recent History (Last 10 Days)
            </h2>
            <div className="history-table-wrap">
              {historyRecords.length === 0 ? (
                <p className="stage-select-hint">No recent records.</p>
              ) : (
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th scope="col">Played at</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Result</th>
                      <th scope="col">Score</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Mistakes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{formatRecordedAt(record.playedAt)}</td>
                        <td>{record.stageId}</td>
                        <td>{record.result}</td>
                        <td>{record.score}</td>
                        <td>{formatElapsedTime(record.durationMs)}</td>
                        <td>{record.mistakeCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="history-section">
            <h2 className="history-section-title">Stage Aggregates</h2>
            <div className="history-table-wrap">
              {stageSummaries.length === 0 ? (
                <p className="stage-select-hint">No stage aggregates yet.</p>
              ) : (
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th scope="col">Stage</th>
                      <th scope="col">Attempts</th>
                      <th scope="col">Clears</th>
                      <th scope="col">Best score</th>
                      <th scope="col">Avg score</th>
                      <th scope="col">Best clear time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageSummaries.map((summary) => (
                      <tr key={summary.stageId}>
                        <td>{summary.stageId}</td>
                        <td>{summary.attempts}</td>
                        <td>{summary.clears}</td>
                        <td>{summary.bestScore ?? 0}</td>
                        <td>
                          {formatAverageScore(
                            summary.totalScore,
                            summary.attempts,
                          )}
                        </td>
                        <td>
                          {summary.bestDurationMs !== null
                            ? formatElapsedTime(summary.bestDurationMs)
                            : "--:--.--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "ranking") {
    if (!rankingStage) {
      return null;
    }

    const rows =
      rankingTab === "global" ? rankingGlobalTop10 : rankingPlayerTop10;

    return (
      <main className="app">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">{rankingStage.name} Rankings</p>
            <button
              className="close-button"
              type="button"
              onClick={backToStageSelect}
              aria-label="Back to stage select"
            >
              ×
            </button>
          </div>
          <h1 className="title">Keisando</h1>
          <p className="stage-select-description">
            {rankingStage.tag} / {rankingStage.description}
          </p>

          <div
            className="ranking-tabs"
            role="tablist"
            aria-label="Ranking views"
          >
            <button
              className={`ranking-tab ${rankingTab === "global" ? "ranking-tab-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={rankingTab === "global"}
              onClick={() => setRankingTab("global")}
            >
              Global Top10
            </button>
            <button
              className={`ranking-tab ${rankingTab === "player" ? "ranking-tab-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={rankingTab === "player"}
              onClick={() => setRankingTab("player")}
              disabled={activePlayer === null}
            >
              My Top10
            </button>
          </div>

          <div className="ranking-table-wrap">
            {rankingTab === "player" && activePlayer === null ? (
              <p className="stage-select-hint">
                Select a player to view personal rankings.
              </p>
            ) : rows.length === 0 ? (
              <p className="stage-select-hint">No records yet.</p>
            ) : (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Time</th>
                    {rankingTab === "global" && <th scope="col">Player</th>}
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((record, index) => (
                    <tr key={record.id}>
                      <td>{index + 1}</td>
                      <td>{formatElapsedTime(record.elapsedMs)}</td>
                      {rankingTab === "global" && (
                        <td>
                          {playerNameById.get(record.playerId) ?? "Unknown"}
                        </td>
                      )}
                      <td>{formatRecordedAt(record.recordedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

          {players.length > 0 ? (
            <div className="player-list">
              {players.map((player) => {
                const isCurrent = player.id === activePlayerId;

                return (
                  <button
                    className={`player-item ${isCurrent ? "player-item-active" : ""}`}
                    key={player.id}
                    type="button"
                    onClick={() => handleSelectPlayer(player.id)}
                  >
                    <span className="player-item-name">{player.name}</span>
                    {isCurrent && (
                      <span className="player-item-badge">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="stage-select-hint">
              No player yet. Register one below.
            </p>
          )}

          <form
            className="player-register-form"
            onSubmit={handleRegisterPlayer}
          >
            <label
              className="player-register-label"
              htmlFor="player-name-input"
            >
              New Player Name
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
            />
            {registerError && (
              <p className="player-register-error">{registerError}</p>
            )}
            <div className="player-register-actions">
              <button className="clear-close-button" type="submit">
                Register
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
              className="clear-close-button"
              type="button"
              onClick={backToStageSelect}
            >
              Close
            </button>
            <button
              className="clear-retry-button"
              type="button"
              onClick={resetStage}
            >
              Retry
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
