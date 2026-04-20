import { ArrowLeft } from "lucide-react";
import {
  formatAverageScore,
  formatElapsedTime,
  formatRate,
  formatRecordedAt,
} from "../../shared/formatters";
import type {
  Player,
  PlayerLifetimeSummary,
  PlayHistoryRecord,
  StageLifetimeSummary,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";

type HistoryDetailScreenProps = {
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
  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">Play History</p>
          <div className="stage-head-actions">
            <button
              className="back-icon-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onBackToStageSelect();
              }}
              aria-label="Back to stage select"
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
          <h2 className="history-section-title">Profile</h2>
          <p className="history-item">
            Joined at: {formatRecordedAt(activePlayer.createdAt)}
          </p>
          <p className="history-item">
            Last played at:{" "}
            {historySummary.lastPlayedAt
              ? formatRecordedAt(historySummary.lastPlayedAt)
              : "-"}
          </p>
        </div>

        <div className="history-section">
          <h2 className="history-section-title">Lifetime Summary</h2>
          <p className="history-item">
            Total plays: {historySummary.totalPlays}
          </p>
          <p className="history-item">
            Total clears: {historySummary.totalClears}
          </p>
          <p className="history-item">
            Lifetime clear rate:{" "}
            {formatRate(historySummary.totalClears, historySummary.totalPlays)}
          </p>
          <p className="history-item">
            Lifetime best score: {historySummary.bestScore ?? 0}
          </p>
          <p className="history-item">
            Lifetime average score:{" "}
            {formatAverageScore(
              historySummary.totalScore,
              historySummary.totalPlays,
            )}
          </p>
        </div>

        <div className="history-section">
          <h2 className="history-section-title">
            Recent History (Last 10 Days)
          </h2>
          <div className="history-table-wrap">
            {historyRecords.length === 0 ? (
              <p className="stage-select-hint">No recent records.</p>
            ) : (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th scope="col">Played at</th>
                    <th scope="col">Stage</th>
                    <th scope="col">Result</th>
                    <th scope="col">Score</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Mistakes</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{formatRecordedAt(record.playedAt)}</td>
                      <td>{record.stageId}</td>
                      <td>{record.result}</td>
                      <td>{record.score}</td>
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
          <h2 className="history-section-title">Stage Aggregates</h2>
          <div className="history-table-wrap">
            {stageSummaries.length === 0 ? (
              <p className="stage-select-hint">No stage aggregates yet.</p>
            ) : (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th scope="col">Stage</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Clears</th>
                    <th scope="col">Best score</th>
                    <th scope="col">Avg score</th>
                    <th scope="col">Best clear time</th>
                  </tr>
                </thead>
                <tbody>
                  {stageSummaries.map((summary) => (
                    <tr key={summary.stageId}>
                      <td>{summary.stageId}</td>
                      <td>{summary.attempts}</td>
                      <td>{summary.clears}</td>
                      <td>{summary.bestScore ?? 0}</td>
                      <td>
                        {formatAverageScore(
                          summary.totalScore,
                          summary.attempts,
                        )}
                      </td>
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
    </main>
  );
};
