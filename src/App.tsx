import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  type ClearSoundVariant,
  isNewBestRecord,
  mapClearSoundVariantToCelebration,
} from "./features/game/clearCelebration";
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
import { SoundDebugScreen } from "./features/sound/SoundDebugScreen";
import { useSoundEffects } from "./features/sound/useSoundEffects";
import type { STAGES } from "./shared/stages";
import type { Screen } from "./shared/types";

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
  } = useSoundEffects();

  const {
    players,
    activePlayer,
    activePlayerId,
    playerNameById,
    selectPlayer,
    registerPlayer,
  } = usePlayers();
  const { records, addRecord } = useRecords();
  const {
    historyRecords,
    historySummary,
    stageSummaries,
    appendClearRecord,
    initializePlayerHistory,
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
  const playingPlayer = useMemo(
    () => players.find((player) => player.id === game.playingPlayerId) ?? null,
    [game.playingPlayerId, players],
  );
  const clearCelebration = mapClearSoundVariantToCelebration(
    clearSoundVariantRef.current,
  );

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
    closeRankingScreen();
  };

  const handleStartStage = (stage: (typeof STAGES)[number]) => {
    if (game.startStage(stage)) {
      setScreen("playing");
    }
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

  const handleOpenSoundDebug = () => {
    setScreen("soundDebug");
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
        playerNameById={playerNameById}
        records={records}
        onStartStage={handleStartStage}
        onOpenRankingScreen={handleOpenRanking}
        onOpenPlayHistory={handleOpenPlayHistory}
        onOpenPlayerSelect={handleOpenPlayerSelect}
        onOpenSoundDebug={handleOpenSoundDebug}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (screen === "soundDebug") {
    return (
      <SoundDebugScreen
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
