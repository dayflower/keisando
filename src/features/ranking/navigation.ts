import type { MessageKey } from "../../shared/i18n";
import type { RankingOrigin, Screen } from "../../shared/types";

export const getRankingBackScreen = (origin: RankingOrigin): Screen =>
  origin === "playingClear" ? "playing" : "stageSelect";

export const getRankingBackLabelKey = (origin: RankingOrigin): MessageKey =>
  origin === "playingClear" ? "common.back" : "common.backToStageSelect";
