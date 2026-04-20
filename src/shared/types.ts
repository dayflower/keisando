export type StageExpression = {
  left: number;
  right: number;
  operator: "+" | "-";
  answer: number;
};

export type StageDefinition = {
  id: string;
  name: string;
  tag: string;
  description: string;
  baseQuestionCount: number;
  answerMin: number;
  answerMax: number;
  createExpression: () => StageExpression;
};

export type Question = {
  left: number;
  right: number;
  operator: "+" | "-";
  answer: number;
  options: number[];
};

export type Player = {
  id: string;
  name: string;
  createdAt: number;
};

export type StageRunRecord = {
  id: string;
  stageId: string;
  playerId: string;
  elapsedMs: number;
  requiredCount: number;
  wrongCount: number;
  recordedAt: number;
};

export type PlayHistoryRecord = {
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

export type PlayerLifetimeSummary = {
  playerId: string;
  totalPlays: number;
  totalClears: number;
  totalScore: number;
  bestScore: number | null;
  lastPlayedAt: number | null;
};

export type StageLifetimeSummary = {
  playerId: string;
  stageId: string;
  attempts: number;
  clears: number;
  totalScore: number;
  bestScore: number | null;
  bestDurationMs: number | null;
};

export type RankingTab = "global" | "player";

export type Screen =
  | "stageSelect"
  | "playerSelect"
  | "playing"
  | "ranking"
  | "historyDetail"
  | "soundDebug";
