export type QuestionOptionLabelSegment = {
  text: string;
  size?: "normal" | "small";
};

export type StageExpression = {
  left: number;
  right: number;
  operator: "+" | "-" | "×" | "÷";
  answer: number;
  remainder?: number;
};

export type QuestionOption = {
  segments: QuestionOptionLabelSegment[];
  isCorrect: boolean;
};

export type StageDefinition = {
  id: string;
  baseQuestionCount: number;
  defaultClearCondition: StageClearCondition;
  initializeRound?: () => void;
  createExpression: () => StageExpression;
  formatQuestion?: (expression: StageExpression) => string;
  createOptions: (
    expression: StageExpression,
    locale: "ja" | "en",
  ) => QuestionOption[];
};

export type PlayerRegisterErrorCode =
  | "playerNameInvalid"
  | "playerNameDuplicate";

export type StageClearCondition = {
  maxElapsedMs: number;
  maxMistakes: number;
};

export type Question = {
  left: number;
  right: number;
  operator: "+" | "-" | "×" | "÷";
  prompt: string;
  options: QuestionOption[];
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
  durationMs: number;
  mistakeCount: number;
  appVersion: string;
};

export type PlayerLifetimeSummary = {
  playerId: string;
  totalPlays: number;
  lastPlayedAt: number | null;
  currentCorrectStreak: number;
  bestCorrectStreak: number;
};

export type StageLifetimeSummary = {
  playerId: string;
  stageId: string;
  attempts: number;
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
