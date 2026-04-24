import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider, type Locale } from "../../shared/i18n";
import type { RankingScreenProps } from "./RankingScreen";
import { RankingScreen } from "./RankingScreen";

const buildProps = (
  overrides: Partial<RankingScreenProps> = {},
): RankingScreenProps => ({
  rankingStage: {
    id: "stage1",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => ({ left: 1, right: 1, operator: "+", answer: 2 }),
    createOptions: () => [
      { label: "2", isCorrect: true },
      { label: "3", isCorrect: false },
      { label: "4", isCorrect: false },
      { label: "5", isCorrect: false },
    ],
  },
  rankingTab: "global",
  activePlayer: null,
  playerNameById: new Map([["player1", "Alice"]]),
  rows: [
    {
      id: "record1",
      stageId: "stage1",
      playerId: "player1",
      elapsedMs: 2134,
      requiredCount: 10,
      wrongCount: 0,
      recordedAt: new Date(2025, 0, 2, 3, 4).getTime(),
    },
  ],
  onSetRankingTab: () => {},
  onBackToStageSelect: () => {},
  isMuted: false,
  onToggleMute: () => {},
  ...overrides,
});

const renderScreen = (
  props: Partial<RankingScreenProps> = {},
  locale: Locale = "en",
) =>
  renderToStaticMarkup(
    <I18nProvider
      locale={locale}
      localeOverride={null}
      setLocaleOverride={() => null}
    >
      <RankingScreen {...buildProps(props)} />
    </I18nProvider>,
  );

describe("RankingScreen", () => {
  it("renders translated labels and localized dates", () => {
    const html = renderScreen({}, "ja");

    expect(html).toContain("Stage 1 ランキング");
    expect(html).toContain("足し算 / 1桁どうしの足し算 (0-9 + 0-9)");
    expect(html).toContain("全体 Top10");
    expect(html).toContain("タイム");
    expect(html).toContain("プレイヤー");
    expect(html).toContain("2025/01/02 03:04");
  });

  it("renders translated empty state for personal ranking", () => {
    const html = renderScreen(
      {
        rankingTab: "player",
        activePlayer: null,
      },
      "ja",
    );

    expect(html).toContain(
      "個人ランキングを見るにはプレイヤーを選択してください",
    );
  });
});
