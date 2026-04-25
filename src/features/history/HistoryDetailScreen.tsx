import { ArrowLeft } from "lucide-react";
import { formatElapsedTime, formatRecordedAt } from "../../shared/formatters";
import { getStageLabel, useI18n } from "../../shared/i18n";
import type {
  Player,
  PlayerLifetimeSummary,
  PlayHistoryRecord,
  StageLifetimeSummary,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";

export type HistoryDetailScreenProps = {
  activePlayer: Player;
  historySummary: PlayerLifetimeSummary;
  historyRecords: PlayHistoryRecord[];
  stageSummaries: StageLifetimeSummary[];
  onBackToStageSelect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

export const HistoryDetailScreen = ({
  activePlayer,
  historySummary,
  historyRecords,
  stageSummaries,
  onBackToStageSelect,
  isMuted,
  onToggleMute,
  onUiTap,
}: HistoryDetailScreenProps) => {
  const { locale, t } = useI18n();

  return (
    <main className="app">
      <div className="stage-frame">
        <section className="stage-card">
          <div className="stage-head-row">
            <p className="stage-tag">{t("history.screenTag")}</p>
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

          <div className="history-section">
            <h2 className="history-section-title">{t("history.profile")}</h2>
            <p className="history-item">
              {t("history.joinedAt")}:{" "}
              {formatRecordedAt(activePlayer.createdAt, locale)}
            </p>
            <p className="history-item">
              {t("history.lastPlayedAt")}:{" "}
              {historySummary.lastPlayedAt
                ? formatRecordedAt(historySummary.lastPlayedAt, locale)
                : "-"}
            </p>
          </div>

          <div className="history-section">
            <h2 className="history-section-title">
              {t("history.lifetimeSummary")}
            </h2>
            <p className="history-item">
              {t("history.totalPlays")}: {historySummary.totalPlays}
            </p>
            <p className="history-item">
              {t("history.currentCorrectStreak")}:{" "}
              {historySummary.currentCorrectStreak}
            </p>
            <p className="history-item">
              {t("history.bestCorrectStreak")}:{" "}
              {historySummary.bestCorrectStreak}
            </p>
          </div>

          <div className="history-section">
            <h2 className="history-section-title">
              {t("history.recentHistory")}
            </h2>
            <div className="history-table-wrap">
              {historyRecords.length === 0 ? (
                <p className="stage-select-hint ranking-empty-message">
                  {t("history.noRecentRecords")}
                </p>
              ) : (
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("history.columnPlayedAt")}</th>
                      <th scope="col">{t("history.columnStage")}</th>
                      <th scope="col">{t("history.columnDuration")}</th>
                      <th scope="col">{t("history.columnMistakes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{formatRecordedAt(record.playedAt, locale)}</td>
                        <td>{getStageLabel(locale, record.stageId)}</td>
                        <td>{formatElapsedTime(record.durationMs)}</td>
                        <td>{record.mistakeCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="history-section">
            <h2 className="history-section-title">
              {t("history.stageAggregates")}
            </h2>
            <div className="history-table-wrap">
              {stageSummaries.length === 0 ? (
                <p className="stage-select-hint ranking-empty-message">
                  {t("history.noStageAggregates")}
                </p>
              ) : (
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("history.columnStage")}</th>
                      <th scope="col">{t("history.columnPlayCount")}</th>
                      <th scope="col">{t("history.columnBestClearTime")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageSummaries.map((summary) => (
                      <tr key={summary.stageId}>
                        <td>{getStageLabel(locale, summary.stageId)}</td>
                        <td>{summary.attempts}</td>
                        <td>
                          {summary.bestDurationMs !== null
                            ? formatElapsedTime(summary.bestDurationMs)
                            : "--:--.--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
