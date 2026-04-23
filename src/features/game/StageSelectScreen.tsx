import { CircleUserRound, History, Trophy } from "lucide-react";
import { useMemo, useRef } from "react";
import { formatElapsedTime } from "../../shared/formatters";
import { STAGES } from "../../shared/stages";
import type {
  Player,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";
import { useStageSelectKeyboardNavigation } from "./useStageSelectKeyboardNavigation";

type StageSelectScreenProps = {
  activePlayer: Player | null;
  canStartStage: boolean;
  unlockedStageIds: Set<string>;
  playerNameById: Map<string, string>;
  bestGlobalByStageId: Map<string, StageRunRecord>;
  bestMyByStageId: Map<string, StageRunRecord>;
  onStartStage: (stage: StageDefinition) => void;
  onOpenRankingScreen: (stageId: string) => void;
  onOpenPlayHistory: () => void;
  onOpenPlayerSelect: () => void;
  onOpenDebug: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

const stageOperatorById: Record<string, string> = {
  stage1: "+",
  stage2: "-",
  stage3: "--",
};

export const StageSelectScreen = ({
  activePlayer,
  canStartStage,
  unlockedStageIds,
  playerNameById,
  bestGlobalByStageId,
  bestMyByStageId,
  onStartStage,
  onOpenRankingScreen,
  onOpenPlayHistory,
  onOpenPlayerSelect,
  onOpenDebug,
  isMuted,
  onToggleMute,
  onUiTap,
}: StageSelectScreenProps) => {
  const stageButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stageIndexById = useMemo(
    () => new Map(STAGES.map((stage, index) => [stage.id, index])),
    [],
  );
  useStageSelectKeyboardNavigation({ canStartStage, stageButtonRefs });

  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">Select Stage</p>
          <div className="stage-head-actions">
            <SoundToggleButton
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onUiTap={onUiTap}
            />
            <button
              className="history-icon-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onOpenPlayHistory();
              }}
              aria-label="Open play history"
              disabled={!activePlayer}
            >
              <History size={16} aria-hidden="true" />
            </button>
            <button
              className="player-trigger"
              type="button"
              onClick={() => {
                onUiTap?.();
                onOpenPlayerSelect();
              }}
              aria-label="Open player selection"
            >
              <CircleUserRound size={18} aria-hidden="true" />
              <span>{activePlayer?.name ?? "No Player"}</span>
            </button>
          </div>
        </div>
        <h1 className="title">Keisando</h1>
        {!canStartStage && (
          <p className="stage-select-hint">
            Select a player before starting a stage.
          </p>
        )}

        <div className="stage-list">
          {STAGES.map((stage, index) => {
            const stageGlobalBest = bestGlobalByStageId.get(stage.id);
            const stageMyBest =
              activePlayer === null
                ? null
                : (bestMyByStageId.get(stage.id) ?? null);
            const isUnlocked = unlockedStageIds.has(stage.id);
            const stageOrder = stageIndexById.get(stage.id);
            const stageAriaLabel =
              typeof stageOrder === "number"
                ? `Start ${stage.name}, stage ${stageOrder + 1}`
                : `Start ${stage.name}`;

            return (
              <article className="stage-item-shell" key={stage.id}>
                <button
                  className="stage-item"
                  data-operator={stageOperatorById[stage.id] ?? ""}
                  data-stage-id={stage.id}
                  type="button"
                  ref={(button) => {
                    stageButtonRefs.current[index] = button;
                  }}
                  onClick={() => {
                    onUiTap?.();
                    onStartStage(stage);
                  }}
                  disabled={!canStartStage || !isUnlocked}
                  aria-label={stageAriaLabel}
                >
                  <span className="stage-item-header">
                    <strong>{stage.name}</strong>
                    <span className="stage-item-tag">{stage.tag}</span>
                  </span>
                  <span className="stage-item-record">
                    Global Best:{" "}
                    {stageGlobalBest
                      ? `${formatElapsedTime(stageGlobalBest.elapsedMs)} (${playerNameById.get(stageGlobalBest.playerId) ?? "Unknown"})`
                      : "--:--.--"}
                  </span>
                  <span className="stage-item-record">
                    My Best:{" "}
                    {stageMyBest
                      ? formatElapsedTime(stageMyBest.elapsedMs)
                      : "--:--.--"}
                  </span>
                </button>
                <button
                  className="stage-ranking-button"
                  type="button"
                  onClick={() => {
                    onUiTap?.();
                    onOpenRankingScreen(stage.id);
                  }}
                >
                  <Trophy size={14} aria-hidden="true" />
                  <span>Ranking</span>
                </button>
              </article>
            );
          })}
        </div>
        {import.meta.env.DEV ? (
          <button
            className="debug-entry-button"
            type="button"
            onClick={() => {
              onUiTap?.();
              onOpenDebug();
            }}
          >
            Open Debug
          </button>
        ) : null}
      </section>
    </main>
  );
};
