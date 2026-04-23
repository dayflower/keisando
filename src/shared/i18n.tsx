import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
} from "react";
import { PLAYER_NAME_MAX_LENGTH } from "./constants";

export type Locale = "ja" | "en";
export type LocaleOverride = Locale | null;

const enMessages = {
  "common.appName": "Keisando",
  "common.unknownPlayer": "Unknown",
  "common.backToStageSelect": "Back to stage select",
  "common.openPlayHistory": "Open play history",
  "common.openPlayerSelect": "Open player selection",
  "stageSelect.screenTag": "Select Stage",
  "stageSelect.noPlayer": "No Player",
  "stageSelect.selectPlayerHint": "Select a player before starting a stage.",
  "stageSelect.globalBest": "Global Best",
  "stageSelect.myBest": "My Best",
  "stageSelect.ranking": "Ranking",
  "stageSelect.openDebug": "Open Debug",
  "playerSelect.screenTag": "Select Player",
  "playerSelect.description": "Choose your active player.",
  "playerSelect.active": "Active",
  "playerSelect.empty": "No player yet. Register one below.",
  "playerSelect.newPlayerName": "New Player Name",
  "playerSelect.register": "Register",
  "playerSelect.errorNameInvalid": `Name must be 1-${PLAYER_NAME_MAX_LENGTH} characters.`,
  "playerSelect.errorNameDuplicate": "This player name already exists.",
  "ranking.screenTagSuffix": "Rankings",
  "ranking.tabList": "Ranking views",
  "ranking.globalTop10": "Global Top10",
  "ranking.myTop10": "My Top10",
  "ranking.personalHint": "Select a player to view personal rankings.",
  "ranking.empty": "No records yet.",
  "ranking.columnRank": "#",
  "ranking.columnTime": "Time",
  "ranking.columnPlayer": "Player",
  "ranking.columnDate": "Date",
  "history.screenTag": "Play History",
  "history.profile": "Profile",
  "history.joinedAt": "Joined at",
  "history.lastPlayedAt": "Last played at",
  "history.lifetimeSummary": "Lifetime Summary",
  "history.totalPlays": "Total plays",
  "history.totalClears": "Total clears",
  "history.lifetimeClearRate": "Lifetime clear rate",
  "history.recentHistory": "Recent History (Last 10 Days)",
  "history.noRecentRecords": "No recent records.",
  "history.columnPlayedAt": "Played at",
  "history.columnStage": "Stage",
  "history.columnResult": "Result",
  "history.columnDuration": "Duration",
  "history.columnMistakes": "Mistakes",
  "history.stageAggregates": "Stage Aggregates",
  "history.noStageAggregates": "No stage aggregates yet.",
  "history.columnAttempts": "Attempts",
  "history.columnClears": "Clears",
  "history.columnBestClearTime": "Best clear time",
  "playing.answered": "Answered",
  "playing.remaining": "Remaining",
  "playing.progress": "Question progress",
  "playing.comboMilestone": "{count} COMBO!",
  "playing.time": "Time",
  "playing.best": "Best",
  "playing.resultCorrect": "Correct!",
  "playing.resultWrong": "Wrong! +1 question",
  "playing.resultIdle": "Choose the correct answer.",
  "playing.roundStartsIn": "Round starts in",
  "playing.clearTitle": "Stage Clear!",
  "playing.nextStageUnlocked": "Next stage unlocked!",
  "playing.clearTime": "Clear time",
  "playing.finalQuestions": "Final questions",
  "playing.wrongAnswers": "Wrong answers",
  "playing.back": "Back",
  "playing.retry": "Retry",
  "debug.screenTag": "Debug",
  "debug.description": "Debug actions for development.",
  "debug.language": "Language",
  "debug.languageSystem": "System",
  "debug.languageJapanese": "Japanese",
  "debug.languageEnglish": "English",
  "debug.storage": "Storage",
  "debug.resetUnlockProgress": "Reset Stage Unlock Progress (Active Player)",
  "debug.clearAllData": "Clear All Local Data",
  "debug.clearConditions": "Stage Clear Conditions",
  "debug.clearWithinSeconds": "Clear within (seconds)",
  "debug.noMistakesRequired": "No mistakes required",
  "debug.resetClearConditions": "Reset Clear Conditions to Default",
  "debug.effects": "Effects",
  "debug.comboBurst": "Combo Burst",
  "debug.clearCelebration": "Clear Celebration",
  "debug.clearTitle": "Stage Clear!",
  "debug.clearBadgeGlobalBest": "GLOBAL BEST",
  "debug.clearBadgeMyBest": "MY BEST",
  "debug.comboBurstX3": "Combo Burst: x3",
  "debug.comboBurstX5": "Combo Burst: x5",
  "debug.comboBurstX10": "Combo Burst: x10",
  "debug.clearEffectNormal": "Clear Effect: Normal",
  "debug.clearEffectNoMistake": "Clear Effect: No Mistake",
  "debug.clearEffectMyBest": "Clear Effect: My Best",
  "debug.clearEffectGlobalBest": "Clear Effect: Global Best",
  "debug.sound": "Sound",
  "debug.bgmStart": "BGM Start",
  "debug.bgmStop": "BGM Stop",
  "debug.uiTap": "UI Tap",
  "debug.countdownTick": "Countdown Tick",
  "debug.roundStart": "Round Start",
  "debug.correct": "Correct",
  "debug.wrong": "Wrong",
  "debug.clearSoundGlobalBest": "Clear: Global Best",
  "debug.clearSoundMyBest": "Clear: My Best",
  "debug.clearSoundNoMistake": "Clear: No Mistake",
  "debug.clearSoundWithMistake": "Clear: With Mistake",
  "debug.confirmClearAllData":
    "Delete all local Keisando data? This cannot be undone.",
  "sound.mute": "Mute sound effects",
  "sound.unmute": "Unmute sound effects",
  "stage.stage1.name": "Stage 1",
  "stage.stage1.tag": "Addition",
  "stage.stage1.description": "Single-digit addition (0-9 + 0-9)",
  "stage.stage2.name": "Stage 2",
  "stage.stage2.tag": "Subtraction",
  "stage.stage2.description": "Single-digit subtraction (0-9 - 0-9)",
  "stage.stage3.name": "Stage 3",
  "stage.stage3.tag": "Subtraction+",
  "stage.stage3.description": "1-2 digits minus 1 digit (result 0-9)",
} as const;

export type MessageKey = keyof typeof enMessages;

const jaMessages: Record<MessageKey, string> = {
  "common.appName": "Keisando",
  "common.unknownPlayer": "不明",
  "common.backToStageSelect": "ステージ選択に戻る",
  "common.openPlayHistory": "プレイ履歴を開く",
  "common.openPlayerSelect": "プレイヤー選択を開く",
  "stageSelect.screenTag": "ステージ選択",
  "stageSelect.noPlayer": "プレイヤー未選択",
  "stageSelect.selectPlayerHint":
    "ステージを始める前にプレイヤーを選択してください",
  "stageSelect.globalBest": "全体ベスト",
  "stageSelect.myBest": "自己ベスト",
  "stageSelect.ranking": "ランキング",
  "stageSelect.openDebug": "デバッグ",
  "playerSelect.screenTag": "プレイヤー選択",
  "playerSelect.description": "使用するプレイヤーを選択",
  "playerSelect.active": "選択中",
  "playerSelect.empty": "プレイヤーはまだいません。下から登録してください。",
  "playerSelect.newPlayerName": "新しいプレイヤー名",
  "playerSelect.register": "登録",
  "playerSelect.errorNameInvalid": `名前は 1-${PLAYER_NAME_MAX_LENGTH} 文字で入力してください`,
  "playerSelect.errorNameDuplicate": "このプレイヤー名は既に存在します",
  "ranking.screenTagSuffix": "ランキング",
  "ranking.tabList": "ランキング表示",
  "ranking.globalTop10": "全体 Top10",
  "ranking.myTop10": "自己 Top10",
  "ranking.personalHint":
    "個人ランキングを見るにはプレイヤーを選択してください",
  "ranking.empty": "記録はまだありません",
  "ranking.columnRank": "#",
  "ranking.columnTime": "タイム",
  "ranking.columnPlayer": "プレイヤー",
  "ranking.columnDate": "日時",
  "history.screenTag": "プレイ履歴",
  "history.profile": "プロフィール",
  "history.joinedAt": "登録日",
  "history.lastPlayedAt": "最終プレイ日時",
  "history.lifetimeSummary": "累計サマリー",
  "history.totalPlays": "総プレイ回数",
  "history.totalClears": "総クリア回数",
  "history.lifetimeClearRate": "累計クリア率",
  "history.recentHistory": "最近の履歴 (過去10日)",
  "history.noRecentRecords": "最近の記録はありません",
  "history.columnPlayedAt": "プレイ日時",
  "history.columnStage": "ステージ",
  "history.columnResult": "結果",
  "history.columnDuration": "所要時間",
  "history.columnMistakes": "ミス数",
  "history.stageAggregates": "ステージ集計",
  "history.noStageAggregates": "ステージ集計はまだありません",
  "history.columnAttempts": "挑戦回数",
  "history.columnClears": "クリア回数",
  "history.columnBestClearTime": "最速クリアタイム",
  "playing.answered": "回答数",
  "playing.remaining": "残り",
  "playing.progress": "問題進捗",
  "playing.comboMilestone": "{count} COMBO!",
  "playing.time": "タイム",
  "playing.best": "ベスト",
  "playing.resultCorrect": "正解!",
  "playing.resultWrong": "不正解! +1問",
  "playing.resultIdle": "正しい答えを選んで",
  "playing.roundStartsIn": "開始まで",
  "playing.clearTitle": "ステージクリア!",
  "playing.nextStageUnlocked": "次のステージを解放!",
  "playing.clearTime": "クリアタイム",
  "playing.finalQuestions": "最終問題数",
  "playing.wrongAnswers": "ミス数",
  "playing.back": "戻る",
  "playing.retry": "リトライ",
  "debug.screenTag": "デバッグ",
  "debug.description": "開発用デバッグモード",
  "debug.language": "言語",
  "debug.languageSystem": "システム",
  "debug.languageJapanese": "日本語",
  "debug.languageEnglish": "英語",
  "debug.storage": "ストレージ",
  "debug.resetUnlockProgress": "ステージ解放状況をリセット (現プレイヤー)",
  "debug.clearAllData": "ローカルデータをすべて削除",
  "debug.clearConditions": "ステージクリア条件",
  "debug.clearWithinSeconds": "クリア制限時間 (秒)",
  "debug.noMistakesRequired": "ノーミス必須",
  "debug.resetClearConditions": "クリア条件を初期値に戻す",
  "debug.effects": "演出",
  "debug.comboBurst": "コンボ演出",
  "debug.clearCelebration": "クリア演出",
  "debug.clearTitle": "ステージクリア!",
  "debug.clearBadgeGlobalBest": "全体ベスト",
  "debug.clearBadgeMyBest": "自己ベスト",
  "debug.comboBurstX3": "コンボ演出: x3",
  "debug.comboBurstX5": "コンボ演出: x5",
  "debug.comboBurstX10": "コンボ演出: x10",
  "debug.clearEffectNormal": "クリア演出: 通常",
  "debug.clearEffectNoMistake": "クリア演出: ノーミス",
  "debug.clearEffectMyBest": "クリア演出: 自己ベスト",
  "debug.clearEffectGlobalBest": "クリア演出: 全体ベスト",
  "debug.sound": "サウンド",
  "debug.bgmStart": "BGM 開始",
  "debug.bgmStop": "BGM 停止",
  "debug.uiTap": "UI タップ",
  "debug.countdownTick": "カウントダウン",
  "debug.roundStart": "ラウンド開始",
  "debug.correct": "正解",
  "debug.wrong": "不正解",
  "debug.clearSoundGlobalBest": "クリア: 全体ベスト",
  "debug.clearSoundMyBest": "クリア: 自己ベスト",
  "debug.clearSoundNoMistake": "クリア: ノーミス",
  "debug.clearSoundWithMistake": "クリア: ミスあり",
  "debug.confirmClearAllData":
    "Keisando のローカルデータをすべて削除します。元に戻せません。",
  "sound.mute": "効果音をミュート",
  "sound.unmute": "効果音のミュートを解除",
  "stage.stage1.name": "Stage 1",
  "stage.stage1.tag": "足し算",
  "stage.stage1.description": "1桁どうしの足し算 (0-9 + 0-9)",
  "stage.stage2.name": "Stage 2",
  "stage.stage2.tag": "引き算",
  "stage.stage2.description": "1桁どうしの引き算 (0-9 - 0-9)",
  "stage.stage3.name": "Stage 3",
  "stage.stage3.tag": "引き算+",
  "stage.stage3.description": "1-2桁から1桁を引く (答えは0-9)",
};

const messages: Record<Locale, Record<MessageKey, string>> = {
  en: enMessages,
  ja: jaMessages,
};

type StageMessagePart = "name" | "tag" | "description";
type StageMessageKey =
  | "stage.stage1.name"
  | "stage.stage1.tag"
  | "stage.stage1.description"
  | "stage.stage2.name"
  | "stage.stage2.tag"
  | "stage.stage2.description"
  | "stage.stage3.name"
  | "stage.stage3.tag"
  | "stage.stage3.description";

const stageMessageKeys = {
  stage1: {
    name: "stage.stage1.name",
    tag: "stage.stage1.tag",
    description: "stage.stage1.description",
  },
  stage2: {
    name: "stage.stage2.name",
    tag: "stage.stage2.tag",
    description: "stage.stage2.description",
  },
  stage3: {
    name: "stage.stage3.name",
    tag: "stage.stage3.tag",
    description: "stage.stage3.description",
  },
} as const satisfies Record<string, Record<StageMessagePart, StageMessageKey>>;

type I18nContextValue = {
  locale: Locale;
  effectiveLocale: Locale;
  localeOverride: LocaleOverride;
  setLocaleOverride: Dispatch<SetStateAction<LocaleOverride>>;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const defaultContextValue: I18nContextValue = {
  locale: "en",
  effectiveLocale: "en",
  localeOverride: null,
  setLocaleOverride: () => null,
  t: (key, values) => translate("en", key, values),
};

const I18nContext = createContext<I18nContextValue>(defaultContextValue);

export const normalizeLocale = (locale: string | null | undefined): Locale => {
  if (locale?.toLowerCase().startsWith("ja")) {
    return "ja";
  }

  return "en";
};

export const detectLocaleFromNavigator = (
  languages?: readonly string[],
  language?: string,
): Locale => {
  const preferredLanguage =
    languages?.find((candidate) => candidate.length > 0) ?? language;

  return normalizeLocale(preferredLanguage);
};

export const detectLocale = (): Locale => {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return detectLocaleFromNavigator(navigator.languages, navigator.language);
};

const interpolateMessage = (
  template: string,
  values?: Record<string, string | number>,
): string => {
  if (!values) {
    return template;
  }

  return template.replaceAll(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
};

export const translate = (
  locale: Locale,
  key: MessageKey,
  values?: Record<string, string | number>,
): string => interpolateMessage(messages[locale][key], values);

const getStageMessageKey = (
  stageId: string,
  part: StageMessagePart,
): StageMessageKey | null => {
  const stageKeys = stageMessageKeys[stageId as keyof typeof stageMessageKeys];
  return stageKeys?.[part] ?? null;
};

const getStageMessage = (
  locale: Locale,
  stageId: string,
  part: StageMessagePart,
): string => {
  const key = getStageMessageKey(stageId, part);
  return key ? translate(locale, key) : stageId;
};

export const getStageName = (locale: Locale, stageId: string): string =>
  getStageMessage(locale, stageId, "name");

export const getStageTag = (locale: Locale, stageId: string): string =>
  getStageMessage(locale, stageId, "tag");

export const getStageDescription = (locale: Locale, stageId: string): string =>
  getStageMessage(locale, stageId, "description");

export const getStageLabel = (locale: Locale, stageId: string): string =>
  getStageName(locale, stageId);

type I18nProviderProps = {
  locale: Locale;
  localeOverride: LocaleOverride;
  setLocaleOverride: Dispatch<SetStateAction<LocaleOverride>>;
  children: ReactNode;
};

export const I18nProvider = ({
  locale,
  localeOverride,
  setLocaleOverride,
  children,
}: I18nProviderProps) => {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      effectiveLocale: locale,
      localeOverride,
      setLocaleOverride,
      t: (key, values) => translate(locale, key, values),
    }),
    [locale, localeOverride, setLocaleOverride],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  return useContext(I18nContext);
};
