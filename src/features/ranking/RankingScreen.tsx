import { ArrowLeft } from "lucide-react";
import { formatElapsedTime, formatRecordedAt } from "../../shared/formatters";
import type {
  Player,
  RankingTab,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";

type RankingScreenProps = {
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
  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">{rankingStage.name} Rankings</p>
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
        <p className="stage-select-description">
          {rankingStage.tag} / {rankingStage.description}
        </p>

        <div className="ranking-tabs" role="tablist" aria-label="Ranking views">
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
            Global Top10
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
            My Top10
          </button>
        </div>

        <div className="ranking-table-wrap">
          {rankingTab === "player" && activePlayer === null ? (
            <p className="stage-select-hint">
              Select a player to view personal rankings.
            </p>
          ) : rows.length === 0 ? (
            <p className="stage-select-hint">No records yet.</p>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Time</th>
                  {rankingTab === "global" && <th scope="col">Player</th>}
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{formatElapsedTime(record.elapsedMs)}</td>
                    {rankingTab === "global" && (
                      <td>
                        {playerNameById.get(record.playerId) ?? "Unknown"}
                      </td>
                    )}
                    <td>{formatRecordedAt(record.recordedAt)}</td>
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
