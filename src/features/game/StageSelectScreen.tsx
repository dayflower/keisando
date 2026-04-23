import { CircleUserRound, History, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { formatElapsedTime } from "../../shared/formatters";
import { STAGES } from "../../shared/stages";
import type {
  Player,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { buildBestRecordByStageId } from "../ranking/logic";
import { SoundToggleButton } from "../sound/SoundToggleButton";

type StageSelectScreenProps = {
  activePlayer: Player | null;
  canStartStage: boolean;
  unlockedStageIds: Set<string>;
  playerNameById: Map<string, string>;
  records: StageRunRecord[];
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

export const getStageFocusMoveTarget = (
  currentIndex: number,
  key: string,
  totalCount: number,
): number | null => {
  if (totalCount <= 0) {
    return null;
  }

  const lastIndex = totalCount - 1;

  if (key === "ArrowUp" || key === "ArrowLeft") {
    return currentIndex <= 0 ? lastIndex : currentIndex - 1;
  }

  if (key === "ArrowDown" || key === "ArrowRight") {
    return currentIndex >= lastIndex ? 0 : currentIndex + 1;
  }

  return null;
};

export const isStageSelectBlurKey = (key: string): boolean => key === "Escape";

export const StageSelectScreen = ({
  activePlayer,
  canStartStage,
  unlockedStageIds,
  playerNameById,
  records,
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

  const bestGlobalByStageId = useMemo(
    () => buildBestRecordByStageId(records),
    [records],
  );
  const bestMyByStageId = useMemo(() => {
    if (!activePlayer) {
      return new Map<string, StageRunRecord>();
    }

    return buildBestRecordByStageId(records, activePlayer.id);
  }, [activePlayer, records]);

  useEffect(() => {
    if (!canStartStage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isStageSelectBlurKey(event.key)) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          activeElement !== document.body
        ) {
          event.preventDefault();
          activeElement.blur();
        }
        return;
      }

      const stageButtons = stageButtonRefs.current.filter(
        (button): button is HTMLButtonElement => button !== null,
      );
      const focusedIndex = stageButtons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const fromIndex = focusedIndex === -1 ? 0 : focusedIndex;
      const targetIndex = getStageFocusMoveTarget(
        fromIndex,
        event.key,
        stageButtons.length,
      );

      if (targetIndex === null) {
        return;
      }

      event.preventDefault();
      stageButtons[targetIndex]?.focus();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canStartStage]);

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
        <p className="stage-select-description">
          Choose a stage to start Time Attack.
        </p>
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
