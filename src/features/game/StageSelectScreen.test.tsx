import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatRecordedAt } from "../../shared/formatters";
import { I18nProvider, type Locale } from "../../shared/i18n";
import type { PlayerLifetimeSummary } from "../../shared/types";
import { StageSelectScreen } from "./StageSelectScreen";

type StageSelectScreenProps = ComponentProps<typeof StageSelectScreen>;

const stage1RecordedAt = new Date(2025, 0, 2, 3, 4).getTime();
const stage2RecordedAt = new Date(2025, 0, 3, 4, 5).getTime();
const historySummary: PlayerLifetimeSummary = {
  playerId: "player1",
  totalPlays: 12,
  lastPlayedAt: stage2RecordedAt,
  currentCorrectStreak: 8,
  bestCorrectStreak: 21,
};

const buildProps = (
  overrides: Partial<StageSelectScreenProps> = {},
): StageSelectScreenProps => ({
  activePlayer: {
    id: "player1",
    name: "Alice",
    createdAt: new Date(2025, 0, 1, 2, 3).getTime(),
  },
  historySummary,
  canStartStage: true,
  unlockedStageIds: new Set(["stage1", "stage2", "stage3", "stage4", "stage5"]),
  playerNameById: new Map([
    ["player1", "Alice"],
    ["player2", "Bob"],
  ]),
  bestGlobalByStageId: new Map([
    [
      "stage1",
      {
        id: "global-stage1",
        stageId: "stage1",
        playerId: "player2",
        elapsedMs: 2134,
        requiredCount: 10,
        wrongCount: 0,
        recordedAt: stage1RecordedAt,
      },
    ],
  ]),
  bestMyByStageId: new Map([
    [
      "stage1",
      {
        id: "my-stage1",
        stageId: "stage1",
        playerId: "player1",
        elapsedMs: 2456,
        requiredCount: 10,
        wrongCount: 1,
        recordedAt: stage2RecordedAt,
      },
    ],
  ]),
  onStartStage: () => {},
  onOpenRankingScreen: () => {},
  onOpenPlayHistory: () => {},
  onOpenPlayerSelect: () => {},
  onOpenDebug: () => {},
  isMuted: false,
  onToggleMute: () => {},
  ...overrides,
});

const renderScreen = (
  props: Partial<StageSelectScreenProps> = {},
  locale: Locale = "en",
) =>
  renderToStaticMarkup(
    <I18nProvider
      locale={locale}
      localeOverride={null}
      setLocaleOverride={() => null}
    >
      <StageSelectScreen {...buildProps(props)} />
    </I18nProvider>,
  );

describe("StageSelectScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders best times with player names and achieved dates", () => {
    const html = renderScreen({}, "ja");

    expect(html).toContain("全体ベスト:");
    expect(html).toContain("00:02.13");
    expect(html).toContain("(Bob)");
    expect(html).toContain(formatRecordedAt(stage1RecordedAt, "ja"));
    expect(html).toContain("自己ベスト:");
    expect(html).toContain("00:02.45");
    expect(html).toContain(formatRecordedAt(stage2RecordedAt, "ja"));
  });

  it("renders compact lifetime summary above the stage list", () => {
    const html = renderScreen({}, "ja");

    expect(html).toContain("12回プレイ / 連続正解 8 / 最高連続 21");
  });

  it("does not render lifetime summary without an active player", () => {
    const html = renderScreen(
      {
        activePlayer: null,
        historySummary: null,
      },
      "ja",
    );

    expect(html).not.toContain("12回プレイ / 連続正解 8 / 最高連続 21");
  });

  it("does not render achieved dates when no best record exists", () => {
    const html = renderScreen(
      {
        bestGlobalByStageId: new Map(),
        bestMyByStageId: new Map(),
      },
      "ja",
    );

    expect(html).toContain("全体ベスト: --:--.--");
    expect(html).toContain("自己ベスト: --:--.--");
    expect(html).not.toContain(formatRecordedAt(stage1RecordedAt, "ja"));
    expect(html).not.toContain(formatRecordedAt(stage2RecordedAt, "ja"));
  });

  it("renders localized achieved dates in english", () => {
    const html = renderScreen({}, "en");

    expect(html).toContain(formatRecordedAt(stage1RecordedAt, "en"));
    expect(html).toContain(formatRecordedAt(stage2RecordedAt, "en"));
    expect(html).toContain("12 plays / streak 8 / best streak 21");
  });

  it("underlines dates recorded today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 2, 12, 0));

    const html = renderScreen({}, "ja");

    expect(html).toContain(
      "stage-item-record-meta stage-item-record-meta-today",
    );
  });

  it("does not underline dates that were not recorded today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 4, 12, 0));

    const html = renderScreen({}, "ja");

    expect(html).not.toContain("stage-item-record-meta-today");
  });
});
