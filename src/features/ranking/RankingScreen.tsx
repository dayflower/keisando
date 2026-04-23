import { ArrowLeft } from "lucide-react";
import { formatElapsedTime, formatRecordedAt } from "../../shared/formatters";
import { useI18n } from "../../shared/i18n";
import type {
  Player,
  RankingTab,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";

export type RankingScreenProps = {
  rankingStage: StageDefinition;
  rankingTab: RankingTab;
  activePlayer: Player | null;
  playerNameById: Map<string, string>;
  rows: StageRunRecord[];
  onSetRankingTab: (tab: RankingTab) => void;
  onBackToStageSelect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

export const RankingScreen = ({
  rankingStage,
  rankingTab,
  activePlayer,
  playerNameById,
  rows,
  onSetRankingTab,
  onBackToStageSelect,
  isMuted,
  onToggleMute,
  onUiTap,
}: RankingScreenProps) => {
  const { locale, t } = useI18n();

  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">
            {rankingStage.name} {t("ranking.screenTagSuffix")}
          </p>
          <div className="stage-head-actions">
            <button
              className="back-icon-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onBackToStageSelect();
              }}
              aria-label={t("common.backToStageSelect")}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <SoundToggleButton
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onUiTap={onUiTap}
            />
          </div>
        </div>
        <h1 className="title">Keisando</h1>
        <p className="stage-select-description">
          {rankingStage.tag} / {rankingStage.description}
        </p>

        <div
          className="ranking-tabs"
          role="tablist"
          aria-label={t("ranking.tabList")}
        >
          <button
            className={`ranking-tab ${rankingTab === "global" ? "ranking-tab-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={rankingTab === "global"}
            onClick={() => {
              onUiTap?.();
              onSetRankingTab("global");
            }}
          >
            {t("ranking.globalTop10")}
          </button>
          <button
            className={`ranking-tab ${rankingTab === "player" ? "ranking-tab-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={rankingTab === "player"}
            onClick={() => {
              onUiTap?.();
              onSetRankingTab("player");
            }}
            disabled={activePlayer === null}
          >
            {t("ranking.myTop10")}
          </button>
        </div>

        <div className="ranking-table-wrap">
          {rankingTab === "player" && activePlayer === null ? (
            <p className="stage-select-hint">{t("ranking.personalHint")}</p>
          ) : rows.length === 0 ? (
            <p className="stage-select-hint">{t("ranking.empty")}</p>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th scope="col">{t("ranking.columnRank")}</th>
                  <th scope="col">{t("ranking.columnTime")}</th>
                  {rankingTab === "global" && (
                    <th scope="col">{t("ranking.columnPlayer")}</th>
                  )}
                  <th scope="col">{t("ranking.columnDate")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{formatElapsedTime(record.elapsedMs)}</td>
                    {rankingTab === "global" && (
                      <td>
                        {playerNameById.get(record.playerId) ??
                          t("common.unknownPlayer")}
                      </td>
                    )}
                    <td>{formatRecordedAt(record.recordedAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
};
