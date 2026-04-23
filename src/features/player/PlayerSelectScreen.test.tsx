import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider, type Locale } from "../../shared/i18n";
import { PlayerSelectScreen } from "./PlayerSelectScreen";

type PlayerSelectScreenProps = ComponentProps<typeof PlayerSelectScreen>;

const buildProps = (
  overrides: Partial<PlayerSelectScreenProps> = {},
): PlayerSelectScreenProps => ({
  players: [],
  activePlayerId: null,
  newPlayerName: "",
  registerErrorCode: null,
  onSetNewPlayerName: () => {},
  onSelectPlayer: () => {},
  onRegisterPlayer: () => {},
  onBackToStageSelect: () => {},
  isMuted: false,
  onToggleMute: () => {},
  ...overrides,
});

const renderScreen = (
  props: Partial<PlayerSelectScreenProps> = {},
  locale: Locale = "en",
) =>
  renderToStaticMarkup(
    <I18nProvider
      locale={locale}
      localeOverride={null}
      setLocaleOverride={() => null}
    >
      <PlayerSelectScreen {...buildProps(props)} />
    </I18nProvider>,
  );

describe("PlayerSelectScreen", () => {
  it("renders translated invalid-name errors", () => {
    expect(
      renderScreen({ registerErrorCode: "playerNameInvalid" }, "en"),
    ).toContain("Name must be 1-20 characters.");
    expect(
      renderScreen({ registerErrorCode: "playerNameInvalid" }, "ja"),
    ).toContain("名前は 1-20 文字で入力してください。");
  });

  it("renders translated duplicate-name errors", () => {
    expect(
      renderScreen({ registerErrorCode: "playerNameDuplicate" }, "en"),
    ).toContain("This player name already exists.");
    expect(
      renderScreen({ registerErrorCode: "playerNameDuplicate" }, "ja"),
    ).toContain("このプレイヤー名は既に存在します。");
  });
});
