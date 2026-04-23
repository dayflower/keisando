import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DebugScreen } from "./features/debug/DebugScreen";
import {
  type ClearSoundVariant,
  isNewBestRecord,
  mapClearSoundVariantToCelebration,
} from "./features/game/clearCelebration";
import {
  isStageConditionClear,
  normalizeClearCondition,
} from "./features/game/clearConditions";
import { PlayingScreen } from "./features/game/PlayingScreen";
import { StageSelectScreen } from "./features/game/StageSelectScreen";
import { useGameSession } from "./features/game/useGameSession";
import { HistoryDetailScreen } from "./features/history/HistoryDetailScreen";
import { useHistory } from "./features/history/useHistory";
import { PlayerSelectScreen } from "./features/player/PlayerSelectScreen";
import { usePlayers } from "./features/player/usePlayers";
import { RankingScreen } from "./features/ranking/RankingScreen";
import { useRankings } from "./features/ranking/useRankings";
import { useRecords } from "./features/ranking/useRecords";
import { useSoundEffects } from "./features/sound/useSoundEffects";
import { STAGES } from "./shared/stages";
import type { Screen, StageClearCondition } from "./shared/types";
import { clearAppStorage } from "./storage/repositories/debugRepo";
import {
  loadStageClearConditionOverrides,
  saveStageClearConditionOverrides,
} from "./storage/repositories/stageClearConditionsRepo";
import {
  loadUnlockedStageIdsByPlayer,
  saveUnlockedStageIdsByPlayer,
} from "./storage/repositories/unlockProgressRepo";

function App() {
  const [screen, setScreen] = useState<Screen>("stageSelect");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const {
    isMuted,
    toggleMute,
    startBgm,
    stopBgm,
    playUiTap,
    playCountdownTick,
    playRoundStart,
    playCorrect,
    playWrong,
    playClearGlobalBest,
    playClearMyBest,
    playClearNoMistake,
    playClearWithMistake,
    setMuted,
  } = useSoundEffects();
  const [stageClearConditionOverrides, setStageClearConditionOverrides] =
    useState<Record<string, StageClearCondition>>(() =>
      loadStageClearConditionOverrides(),
    );
  const [unlockedStageIdsByPlayer, setUnlockedStageIdsByPlayer] = useState<
    Record<string, string[]>
  >(() => loadUnlockedStageIdsByPlayer());

  const {
    players,
    activePlayer,
    activePlayerId,
    playerNameById,
    selectPlayer,
    registerPlayer,
    resetPlayers,
  } = usePlayers();
  const { records, addRecord, clearRecords } = useRecords();
  const {
    historyRecords,
    historySummary,
    stageSummaries,
    appendClearRecord,
    initializePlayerHistory,
    resetHistory,
  } = useHistory({ activePlayerId });
  const {
    rankingStage,
    rankingTab,
    setRankingTab,
    rankingGlobalTop10,
    rankingPlayerTop10,
    openRankingScreen,
    closeRankingScreen,
  } = useRankings({ records, activePlayerId });
  const game = useGameSession({
    activePlayer,
    records,
    onStageClear: (payload) => {
      const currentStageIndex = STAGES.findIndex(
        (stage) => stage.id === payload.stageId,
      );
      const nextStage =
        currentStageIndex >= 0 && currentStageIndex + 1 < STAGES.length
          ? STAGES[currentStageIndex + 1]
          : null;
      const stageCondition = stageClearConditionById.get(payload.stageId);
      const isConditionClear =
        stageCondition === undefined
          ? false
          : isStageConditionClear(
              payload.clearRecord.elapsedMs,
              payload.clearRecord.wrongCount,
              stageCondition,
            );

      const currentUnlockedStageIds =
        unlockedStageIdsByPlayer[payload.playerId] ?? [];
      const isNextStageNewlyUnlocked =
        nextStage !== null &&
        isConditionClear &&
        !currentUnlockedStageIds.includes(nextStage.id);

      if (isNextStageNewlyUnlocked && nextStage) {
        setUnlockedStageIdsByPlayer((prev) => ({
          ...prev,
          [payload.playerId]: [...(prev[payload.playerId] ?? []), nextStage.id],
        }));
      }

      setDidUnlockNextStageOnClear(isNextStageNewlyUnlocked);

      const globalBest =
        records
          .filter((record) => record.stageId === payload.stageId)
          .sort((a, b) =>
            a.elapsedMs === b.elapsedMs
              ? a.recordedAt - b.recordedAt
              : a.elapsedMs - b.elapsedMs,
          )[0] ?? null;
      const myBest =
        records
          .filter(
            (record) =>
              record.stageId === payload.stageId &&
              record.playerId === payload.playerId,
          )
          .sort((a, b) =>
            a.elapsedMs === b.elapsedMs
              ? a.recordedAt - b.recordedAt
              : a.elapsedMs - b.elapsedMs,
          )[0] ?? null;
      const isGlobalBestUpdated = isNewBestRecord(
        payload.clearRecord,
        globalBest,
      );
      const isMyBestUpdated = isNewBestRecord(payload.clearRecord, myBest);
      const isNoMistakeClear = payload.mistakeCount === 0;

      if (isGlobalBestUpdated) {
        clearSoundVariantRef.current = "globalBest";
      } else if (isMyBestUpdated) {
        clearSoundVariantRef.current = "myBest";
      } else {
        clearSoundVariantRef.current = isNoMistakeClear
          ? "noMistake"
          : "withMistake";
      }
      setClearCelebrationTick((prev) => prev + 1);

      addRecord(payload.clearRecord);
      appendClearRecord({
        playerId: payload.playerId,
        stageId: payload.stageId,
        score: payload.score,
        durationMs: payload.durationMs,
        playedAt: payload.playedAt,
        mistakeCount: payload.mistakeCount,
      });
    },
  });

  const canStartStage = activePlayer !== null;
  const previousCountdownRef = useRef<number | null>(null);
  const previousRoundActiveRef = useRef<boolean>(false);
  const previousAnsweredCountRef = useRef<number>(0);
  const previousClearedRef = useRef<boolean>(false);
  const clearSoundVariantRef = useRef<ClearSoundVariant>("withMistake");
  const [clearCelebrationTick, setClearCelebrationTick] = useState(0);
  const [didUnlockNextStageOnClear, setDidUnlockNextStageOnClear] =
    useState(false);
  const playingPlayer = useMemo(
    () => players.find((player) => player.id === game.playingPlayerId) ?? null,
    [game.playingPlayerId, players],
  );
  const clearCelebration = mapClearSoundVariantToCelebration(
    clearSoundVariantRef.current,
  );
  const stageClearConditionById = useMemo(() => {
    const nextMap = new Map<string, StageClearCondition>();

    for (const stage of STAGES) {
      nextMap.set(
        stage.id,
        normalizeClearCondition(
          stageClearConditionOverrides[stage.id],
          stage.defaultClearCondition,
        ),
      );
    }

    return nextMap;
  }, [stageClearConditionOverrides]);
  const unlockedStageIds = useMemo(() => {
    if (STAGES.length === 0) {
      return new Set<string>();
    }

    const unlocked = new Set<string>([STAGES[0].id]);
    if (!activePlayerId) {
      return unlocked;
    }

    for (const stageId of unlockedStageIdsByPlayer[activePlayerId] ?? []) {
      unlocked.add(stageId);
    }

    return unlocked;
  }, [activePlayerId, unlockedStageIdsByPlayer]);

  useEffect(() => {
    saveStageClearConditionOverrides(stageClearConditionOverrides);
  }, [stageClearConditionOverrides]);

  useEffect(() => {
    saveUnlockedStageIdsByPlayer(unlockedStageIdsByPlayer);
  }, [unlockedStageIdsByPlayer]);

  useEffect(() => {
    const shouldPlayBgm =
      screen === "playing" &&
      game.isPlaying &&
      game.isRoundActive &&
      !game.isCleared;
    if (shouldPlayBgm) {
      startBgm();
    } else {
      stopBgm();
    }

    return () => {
      stopBgm();
    };
  }, [
    screen,
    game.isPlaying,
    game.isRoundActive,
    game.isCleared,
    startBgm,
    stopBgm,
  ]);

  useEffect(() => {
    if (
      screen !== "playing" ||
      !game.isPlaying ||
      game.isCleared ||
      game.isRoundActive
    ) {
      previousCountdownRef.current = null;
      return;
    }

    if (previousCountdownRef.current !== game.countdownDisplay) {
      playCountdownTick();
      previousCountdownRef.current = game.countdownDisplay;
    }
  }, [
    screen,
    game.isPlaying,
    game.isCleared,
    game.isRoundActive,
    game.countdownDisplay,
    playCountdownTick,
  ]);

  useEffect(() => {
    if (
      screen === "playing" &&
      game.isPlaying &&
      !game.isCleared &&
      !previousRoundActiveRef.current &&
      game.isRoundActive
    ) {
      playRoundStart();
    }
    previousRoundActiveRef.current = game.isRoundActive;
  }, [
    screen,
    game.isPlaying,
    game.isCleared,
    game.isRoundActive,
    playRoundStart,
  ]);

  useEffect(() => {
    if (screen !== "playing" || !game.isPlaying) {
      previousAnsweredCountRef.current = game.answeredCount;
      return;
    }

    if (
      game.lastResult !== null &&
      game.answeredCount !== previousAnsweredCountRef.current
    ) {
      if (game.lastResult === "correct") {
        playCorrect();
      } else {
        playWrong();
      }
    }
    previousAnsweredCountRef.current = game.answeredCount;
  }, [
    screen,
    game.isPlaying,
    game.answeredCount,
    game.lastResult,
    playCorrect,
    playWrong,
  ]);

  useEffect(() => {
    if (
      screen === "playing" &&
      game.isPlaying &&
      game.isCleared &&
      !previousClearedRef.current
    ) {
      stopBgm();
      switch (clearSoundVariantRef.current) {
        case "globalBest":
          playClearGlobalBest();
          break;
        case "myBest":
          playClearMyBest();
          break;
        case "noMistake":
          playClearNoMistake();
          break;
        case "withMistake":
          playClearWithMistake();
          break;
        default:
          playClearWithMistake();
      }
    }
    previousClearedRef.current = game.isCleared;
  }, [
    screen,
    game.isPlaying,
    game.isCleared,
    playClearGlobalBest,
    playClearMyBest,
    playClearNoMistake,
    playClearWithMistake,
    stopBgm,
  ]);

  const backToStageSelect = () => {
    setScreen("stageSelect");
    game.stopSession();
    setDidUnlockNextStageOnClear(false);
    closeRankingScreen();
  };

  const handleStartStage = (stage: (typeof STAGES)[number]) => {
    if (!unlockedStageIds.has(stage.id)) {
      return;
    }

    setDidUnlockNextStageOnClear(false);

    if (game.startStage(stage)) {
      setScreen("playing");
    }
  };

  const handleUpdateStageClearCondition = (
    stageId: string,
    next: StageClearCondition,
  ) => {
    const targetStage = STAGES.find((stage) => stage.id === stageId);
    if (!targetStage) {
      return;
    }

    setStageClearConditionOverrides((prev) => ({
      ...prev,
      [stageId]: normalizeClearCondition(
        next,
        targetStage.defaultClearCondition,
      ),
    }));
  };

  const handleResetStageClearConditions = () => {
    setStageClearConditionOverrides({});
  };

  const handleResetUnlockProgress = () => {
    if (!activePlayerId) {
      return;
    }

    setDidUnlockNextStageOnClear(false);
    setUnlockedStageIdsByPlayer((prev) => ({
      ...prev,
      [activePlayerId]: [],
    }));
  };

  const handleOpenRanking = (stageId: string) => {
    openRankingScreen(stageId);
    setScreen("ranking");
  };

  const handleOpenPlayHistory = () => {
    if (!activePlayerId) return;
    setScreen("historyDetail");
  };

  const handleOpenPlayerSelect = () => {
    setRegisterError(null);
    setNewPlayerName("");
    setScreen("playerSelect");
  };

  const handleOpenDebug = () => {
    setScreen("debug");
  };

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      "Delete all local Keisando data? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    stopBgm();
    clearAppStorage();
    game.stopSession();
    clearRecords();
    resetPlayers();
    resetHistory();
    clearSoundVariantRef.current = "withMistake";
    setClearCelebrationTick(0);
    setDidUnlockNextStageOnClear(false);
    setStageClearConditionOverrides({});
    setUnlockedStageIdsByPlayer({});
    setRegisterError(null);
    setNewPlayerName("");
    closeRankingScreen();
    setMuted(false);
    setScreen("stageSelect");
  };

  const handleSelectPlayer = (playerId: string) => {
    selectPlayer(playerId);
    setScreen("stageSelect");
  };

  const handleRegisterPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = registerPlayer(newPlayerName);
    if (!result.ok) {
      setRegisterError(result.error);
      return;
    }

    initializePlayerHistory(result.player.id);
    setRegisterError(null);
    setNewPlayerName("");
    setScreen("stageSelect");
  };

  const rankingRows =
    rankingTab === "global" ? rankingGlobalTop10 : rankingPlayerTop10;

  if (screen === "stageSelect") {
    return (
      <StageSelectScreen
        activePlayer={activePlayer}
        canStartStage={canStartStage}
        unlockedStageIds={unlockedStageIds}
        playerNameById={playerNameById}
        records={records}
        onStartStage={handleStartStage}
        onOpenRankingScreen={handleOpenRanking}
        onOpenPlayHistory={handleOpenPlayHistory}
        onOpenPlayerSelect={handleOpenPlayerSelect}
        onOpenDebug={handleOpenDebug}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (screen === "debug") {
    return (
      <DebugScreen
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onBackToStageSelect={() => setScreen("stageSelect")}
        onPlayUiTap={playUiTap}
        onStartBgm={startBgm}
        onStopBgm={stopBgm}
        onPlayCountdownTick={playCountdownTick}
        onPlayRoundStart={playRoundStart}
        onPlayCorrect={playCorrect}
        onPlayWrong={playWrong}
        onPlayClearGlobalBest={playClearGlobalBest}
        onPlayClearMyBest={playClearMyBest}
        onPlayClearNoMistake={playClearNoMistake}
        onPlayClearWithMistake={playClearWithMistake}
        stages={STAGES}
        stageClearConditionById={stageClearConditionById}
        onUpdateStageClearCondition={handleUpdateStageClearCondition}
        onResetStageClearConditions={handleResetStageClearConditions}
        canResetUnlockProgress={activePlayerId !== null}
        onResetUnlockProgress={handleResetUnlockProgress}
        onClearAllData={handleClearAllData}
      />
    );
  }

  if (screen === "historyDetail") {
    if (!activePlayer || !historySummary) {
      return null;
    }

    return (
      <HistoryDetailScreen
        activePlayer={activePlayer}
        historySummary={historySummary}
        historyRecords={historyRecords}
        stageSummaries={stageSummaries}
        onBackToStageSelect={backToStageSelect}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (screen === "ranking") {
    if (!rankingStage) {
      return null;
    }

    return (
      <RankingScreen
        rankingStage={rankingStage}
        rankingTab={rankingTab}
        activePlayer={activePlayer}
        playerNameById={playerNameById}
        rows={rankingRows}
        onSetRankingTab={setRankingTab}
        onBackToStageSelect={backToStageSelect}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (screen === "playerSelect") {
    return (
      <PlayerSelectScreen
        players={players}
        activePlayerId={activePlayerId}
        newPlayerName={newPlayerName}
        registerError={registerError}
        onSetNewPlayerName={(name) => {
          setNewPlayerName(name);
          if (registerError) {
            setRegisterError(null);
          }
        }}
        onSelectPlayer={handleSelectPlayer}
        onRegisterPlayer={handleRegisterPlayer}
        onBackToStageSelect={() => setScreen("stageSelect")}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (!game.isPlaying || !game.selectedStage || !game.question) {
    return null;
  }

  return (
    <PlayingScreen
      selectedStage={game.selectedStage}
      playingPlayer={playingPlayer}
      question={game.question}
      answeredCount={game.answeredCount}
      requiredCount={game.requiredCount}
      currentCombo={game.currentCombo}
      comboEffectTick={game.comboEffectTick}
      comboMilestoneTick={game.comboMilestoneTick}
      comboMilestoneValue={game.comboMilestoneValue}
      comboEffectOrigin={game.comboEffectOrigin}
      remainingCount={game.remainingCount}
      elapsedMs={game.elapsedMs}
      bestTimeMs={game.bestTimeMs}
      isCleared={game.isCleared}
      isRoundActive={game.isRoundActive}
      countdownDisplay={game.countdownDisplay}
      wrongAnswerCount={game.wrongAnswerCount}
      lastResult={game.lastResult}
      clearCelebrationTier={clearCelebration.clearCelebrationTier}
      clearBestBadge={clearCelebration.clearBestBadge}
      clearCelebrationTick={clearCelebrationTick}
      didUnlockNextStageOnClear={didUnlockNextStageOnClear}
      onAnswer={game.handleAnswer}
      onBackToStageSelect={backToStageSelect}
      onResetStage={game.resetStage}
      isMuted={isMuted}
      onToggleMute={toggleMute}
      onUiTap={playUiTap}
    />
  );
}

export default App;
