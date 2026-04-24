import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../shared/i18n";
import { STAGES } from "../../shared/stages";
import { DebugScreen } from "./DebugScreen";

const renderScreen = () =>
  renderToStaticMarkup(
    <I18nProvider
      locale="en"
      localeOverride={null}
      setLocaleOverride={() => null}
    >
      <DebugScreen
        isMuted={false}
        onToggleMute={() => {}}
        onBackToStageSelect={() => {}}
        onPlayUiTap={() => {}}
        onStartBgm={() => {}}
        onStopBgm={() => {}}
        onPlayCountdownTick={() => {}}
        onPlayRoundStart={() => {}}
        onPlayCorrect={() => {}}
        onPlayWrong={() => {}}
        onPlayClearGlobalBest={() => {}}
        onPlayClearMyBest={() => {}}
        onPlayClearNoMistake={() => {}}
        onPlayClearWithMistake={() => {}}
        stages={STAGES}
        stageClearConditionById={new Map()}
        stageQuestionCountById={new Map()}
        onUpdateStageClearCondition={() => {}}
        onUpdateStageQuestionCount={() => {}}
        onResetStageSettings={() => {}}
        canUnlockAllStages={true}
        onUnlockAllStages={() => {}}
        canResetUnlockProgress={true}
        onResetUnlockProgress={() => {}}
        onClearAllData={() => {}}
      />
    </I18nProvider>,
  );

describe("DebugScreen", () => {
  it("renders fixed header content and a separate scroll panel", () => {
    const html = renderScreen();

    expect(html).toContain("Debug actions for development.");
    expect(html).toContain('class="screen-fixed-panel"');
    expect(html).toContain('class="screen-scroll-panel"');
    expect(html).toContain(
      '<div class="screen-scroll-panel"><section class="debug-section"',
    );
    expect(html).toContain("Question count");
  });
});
