export type StageExpression = {
  left: number;
  right: number;
  operator: "+" | "-" | "×" | "÷";
  answer: number;
};

export type StageDefinition = {
  id: string;
  baseQuestionCount: number;
  answerMin: number;
  answerMax: number;
  defaultClearCondition: StageClearCondition;
  createExpression: () => StageExpression;
};

export type PlayerRegisterErrorCode =
  | "playerNameInvalid"
  | "playerNameDuplicate";

export type StageClearCondition = {
  maxElapsedMs: number;
  requireNoMistake: boolean;
};

export type Question = {
  left: number;
  right: number;
  operator: "+" | "-" | "×" | "÷";
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
  durationMs: number;
  mistakeCount: number;
  appVersion: string;
};

export type PlayerLifetimeSummary = {
  playerId: string;
  totalPlays: number;
  totalClears: number;
  lastPlayedAt: number | null;
  currentCorrectStreak: number;
  bestCorrectStreak: number;
};

export type StageLifetimeSummary = {
  playerId: string;
  stageId: string;
  attempts: number;
  clears: number;
  bestDurationMs: number | null;
};

export type RankingTab = "global" | "player";

export type Screen =
  | "stageSelect"
  | "playerSelect"
  | "playing"
  | "ranking"
  | "historyDetail"
  | "debug";
