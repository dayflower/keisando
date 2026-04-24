import { CircleUserRound, History, Trophy } from "lucide-react";
import { useMemo, useRef } from "react";
import {
  formatElapsedTime,
  formatRecordedAt,
  isRecordedAtToday,
} from "../../shared/formatters";
import { getStageName, getStageTag, useI18n } from "../../shared/i18n";
import { STAGES } from "../../shared/stages";
import type {
  Player,
  PlayerLifetimeSummary,
  StageDefinition,
  StageRunRecord,
} from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";
import { useStageSelectKeyboardNavigation } from "./useStageSelectKeyboardNavigation";

type StageSelectScreenProps = {
  activePlayer: Player | null;
  historySummary: PlayerLifetimeSummary | null;
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
  stage4: "×",
  stage5: "÷",
};

export const StageSelectScreen = ({
  activePlayer,
  historySummary,
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
  const { locale, t } = useI18n();
  const stageButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stageIndexById = useMemo(
    () => new Map(STAGES.map((stage, index) => [stage.id, index])),
    [],
  );
  useStageSelectKeyboardNavigation({ canStartStage, stageButtonRefs });

  const lifetimeSummaryLine =
    activePlayer && historySummary
      ? t("stageSelect.lifetimeSummaryInline", {
          totalPlays: historySummary.totalPlays,
          currentStreak: historySummary.currentCorrectStreak,
          bestStreak: historySummary.bestCorrectStreak,
        })
      : null;

  const renderBestRecord = (
    label: string,
    record: StageRunRecord | null | undefined,
    playerName?: string,
  ) => {
    if (!record) {
      return <span className="stage-item-record">{label}: --:--.--</span>;
    }

    const isTodayRecord = isRecordedAtToday(record.recordedAt);

    return (
      <span className="stage-item-record">
        <span className="stage-item-record-line">
          <span className="stage-item-record-label">{label}:</span>
          <span className="stage-item-record-value">
            {formatElapsedTime(record.elapsedMs)}
          </span>
          {playerName ? (
            <span className="stage-item-record-player">({playerName})</span>
          ) : null}
          <span
            className={`stage-item-record-meta ${
              isTodayRecord ? "stage-item-record-meta-today" : ""
            }`}
          >
            {formatRecordedAt(record.recordedAt, locale)}
          </span>
        </span>
      </span>
    );
  };

  return (
    <main className="app">
      <section className="stage-card stage-select-card">
        <div className="stage-head-row">
          <p className="stage-tag">{t("stageSelect.screenTag")}</p>
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
              aria-label={t("common.openPlayHistory")}
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
              aria-label={t("common.openPlayerSelect")}
            >
              <CircleUserRound size={18} aria-hidden="true" />
              <span>{activePlayer?.name ?? t("stageSelect.noPlayer")}</span>
            </button>
          </div>
        </div>
        <h1 className="title">{t("common.appName")}</h1>
        {!canStartStage && (
          <p className="stage-select-hint">
            {t("stageSelect.selectPlayerHint")}
          </p>
        )}
        {lifetimeSummaryLine ? (
          <p className="stage-select-inline-summary">{lifetimeSummaryLine}</p>
        ) : null}

        <div className="stage-list">
          {STAGES.map((stage, index) => {
            const stageGlobalBest = bestGlobalByStageId.get(stage.id);
            const stageMyBest =
              activePlayer === null
                ? null
                : (bestMyByStageId.get(stage.id) ?? null);
            const isUnlocked = unlockedStageIds.has(stage.id);
            const stageOrder = stageIndexById.get(stage.id);
            const stageName = getStageName(locale, stage.id);
            const stageTag = getStageTag(locale, stage.id);
            const stageAriaLabel =
              typeof stageOrder === "number"
                ? locale === "ja"
                  ? `${stageName} を開始, ステージ ${stageOrder + 1}`
                  : `Start ${stageName}, stage ${stageOrder + 1}`
                : locale === "ja"
                  ? `${stageName} を開始`
                  : `Start ${stageName}`;

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
                    <strong>{stageName}</strong>
                    <span className="stage-item-tag">{stageTag}</span>
                  </span>
                  {renderBestRecord(
                    t("stageSelect.globalBest"),
                    stageGlobalBest,
                    stageGlobalBest
                      ? (playerNameById.get(stageGlobalBest.playerId) ??
                          t("common.unknownPlayer"))
                      : undefined,
                  )}
                  {renderBestRecord(t("stageSelect.myBest"), stageMyBest)}
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
                  <span>{t("stageSelect.ranking")}</span>
                </button>
              </article>
            );
          })}
        </div>
        {import.meta.env.DEV ? (
          <div className="stage-select-footer">
            <button
              className="debug-entry-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onOpenDebug();
              }}
            >
              {t("stageSelect.openDebug")}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
};
