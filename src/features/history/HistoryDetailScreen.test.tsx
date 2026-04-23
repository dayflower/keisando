import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider, type Locale } from "../../shared/i18n";
import type { HistoryDetailScreenProps } from "./HistoryDetailScreen";
import { HistoryDetailScreen } from "./HistoryDetailScreen";

const buildProps = (
  overrides: Partial<HistoryDetailScreenProps> = {},
): HistoryDetailScreenProps => ({
  activePlayer: {
    id: "player1",
    name: "Alice",
    createdAt: new Date(2025, 0, 1, 2, 3).getTime(),
  },
  historySummary: {
    playerId: "player1",
    totalPlays: 12,
    totalClears: 9,
    lastPlayedAt: new Date(2025, 0, 2, 3, 4).getTime(),
  },
  historyRecords: [
    {
      id: "history1",
      playerId: "player1",
      playedAt: new Date(2025, 0, 2, 3, 4).getTime(),
      stageId: "stage1",
      result: "clear",
      durationMs: 2134,
      mistakeCount: 1,
      appVersion: "0.0.0",
    },
  ],
  stageSummaries: [
    {
      playerId: "player1",
      stageId: "stage1",
      attempts: 5,
      clears: 4,
      bestDurationMs: 1800,
    },
  ],
  onBackToStageSelect: () => {},
  isMuted: false,
  onToggleMute: () => {},
  ...overrides,
});

const renderScreen = (
  props: Partial<HistoryDetailScreenProps> = {},
  locale: Locale = "en",
) =>
  renderToStaticMarkup(
    <I18nProvider
      locale={locale}
      localeOverride={null}
      setLocaleOverride={() => null}
    >
      <HistoryDetailScreen {...buildProps(props)} />
    </I18nProvider>,
  );

describe("HistoryDetailScreen", () => {
  it("renders translated labels and localized dates", () => {
    const html = renderScreen({}, "ja");

    expect(html).toContain("プレイ履歴");
    expect(html).toContain("プロフィール");
    expect(html).toContain("登録日: 2025/01/01 02:03");
    expect(html).toContain("最終プレイ日時: 2025/01/02 03:04");
    expect(html).toContain("最近の履歴 (過去10日)");
    expect(html).toContain("プレイ日時");
    expect(html).toContain("ステージ集計");
    expect(html).toContain("最速クリアタイム");
  });

  it("renders translated empty states", () => {
    const html = renderScreen(
      {
        historyRecords: [],
        stageSummaries: [],
      },
      "ja",
    );

    expect(html).toContain("最近の記録はありません。");
    expect(html).toContain("ステージ集計はまだありません。");
  });
});
