import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
} from "react";

export type Locale = "ja" | "en";
export type LocaleOverride = Locale | null;

const enMessages = {
  "common.appName": "Keisando",
  "common.unknownPlayer": "Unknown",
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
} as const;

export type MessageKey = keyof typeof enMessages;

const jaMessages: Record<MessageKey, string> = {
  "common.appName": "Keisando",
  "common.unknownPlayer": "不明",
  "stageSelect.screenTag": "ステージ選択",
  "stageSelect.noPlayer": "プレイヤー未選択",
  "stageSelect.selectPlayerHint":
    "ステージを始める前にプレイヤーを選択してください。",
  "stageSelect.globalBest": "全体ベスト",
  "stageSelect.myBest": "自己ベスト",
  "stageSelect.ranking": "ランキング",
  "stageSelect.openDebug": "デバッグを開く",
  "playerSelect.screenTag": "プレイヤー選択",
  "playerSelect.description": "使用するプレイヤーを選択します。",
  "playerSelect.active": "選択中",
  "playerSelect.empty": "プレイヤーはまだいません。下から登録してください。",
  "playerSelect.newPlayerName": "新しいプレイヤー名",
  "playerSelect.register": "登録",
  "debug.screenTag": "デバッグ",
  "debug.description": "開発用のデバッグ操作です。",
  "debug.language": "言語",
  "debug.languageSystem": "システム",
  "debug.languageJapanese": "日本語",
  "debug.languageEnglish": "英語",
  "debug.storage": "ストレージ",
  "debug.resetUnlockProgress":
    "ステージ解放状況をリセット (アクティブプレイヤー)",
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
};

const messages: Record<Locale, Record<MessageKey, string>> = {
  en: enMessages,
  ja: jaMessages,
};

type I18nContextValue = {
  locale: Locale;
  effectiveLocale: Locale;
  localeOverride: LocaleOverride;
  setLocaleOverride: Dispatch<SetStateAction<LocaleOverride>>;
  t: (key: MessageKey) => string;
};

const defaultContextValue: I18nContextValue = {
  locale: "en",
  effectiveLocale: "en",
  localeOverride: null,
  setLocaleOverride: () => null,
  t: (key) => translate("en", key),
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

export const translate = (locale: Locale, key: MessageKey): string =>
  messages[locale][key];

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
      t: (key) => translate(locale, key),
    }),
    [locale, localeOverride, setLocaleOverride],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  return useContext(I18nContext);
};
