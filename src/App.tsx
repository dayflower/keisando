import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DebugScreen } from "./features/debug/DebugScreen";
import { unlockAllStagesForPlayer } from "./features/debug/logic";
import { normalizeClearCondition } from "./features/game/clearConditions";
import { PlayingScreen } from "./features/game/PlayingScreen";
import { StageSelectScreen } from "./features/game/StageSelectScreen";
import { useGameSession } from "./features/game/useGameSession";
import { useStageClearFlow } from "./features/game/useStageClearFlow";
import { HistoryDetailScreen } from "./features/history/HistoryDetailScreen";
import { useHistory } from "./features/history/useHistory";
import { useBackNavigationShortcut } from "./features/navigation/useBackNavigationShortcut";
import { PlayerSelectScreen } from "./features/player/PlayerSelectScreen";
import { usePlayers } from "./features/player/usePlayers";
import { buildBestRecordByStageId } from "./features/ranking/logic";
import { RankingScreen } from "./features/ranking/RankingScreen";
import { useRankings } from "./features/ranking/useRankings";
import { useRecords } from "./features/ranking/useRecords";
import { useGameSoundEffects } from "./features/sound/useGameSoundEffects";
import { useSoundEffects } from "./features/sound/useSoundEffects";
import {
  detectLocale,
  I18nProvider,
  type LocaleOverride,
  translate,
} from "./shared/i18n";
import { STAGES } from "./shared/stages";
import type {
  PlayerRegisterErrorCode,
  Screen,
  StageClearCondition,
  StageRunRecord,
} from "./shared/types";
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
  const [detectedLocale] = useState(() => detectLocale());
  const [localeOverride, setLocaleOverride] = useState<LocaleOverride>(null);
  const [screen, setScreen] = useState<Screen>("stageSelect");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [registerErrorCode, setRegisterErrorCode] =
    useState<PlayerRegisterErrorCode | null>(null);
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
    appendPlayRecord,
    recordAnsweredQuestion,
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
  const clearFlow = useStageClearFlow({
    records,
    unlockedStageIdsByPlayer,
    setUnlockedStageIdsByPlayer,
    addRecord,
    appendPlayRecord,
    stageClearConditionById,
  });
  const game = useGameSession({
    activePlayer,
    records,
    onAnswerResolved: recordAnsweredQuestion,
    onStageFinished: clearFlow.handleStageFinish,
  });

  const canStartStage = activePlayer !== null;
  const playingPlayer = useMemo(
    () => players.find((player) => player.id === game.playingPlayerId) ?? null,
    [game.playingPlayerId, players],
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
  const locale = localeOverride ?? detectedLocale;

  useEffect(() => {
    saveStageClearConditionOverrides(stageClearConditionOverrides);
  }, [stageClearConditionOverrides]);

  useEffect(() => {
    saveUnlockedStageIdsByPlayer(unlockedStageIdsByPlayer);
  }, [unlockedStageIdsByPlayer]);

  const gameSoundEffects = useMemo(
    () => ({
      startBgm,
      stopBgm,
      playCountdownTick,
      playRoundStart,
      playCorrect,
      playWrong,
      playClearGlobalBest,
      playClearMyBest,
      playClearNoMistake,
      playClearWithMistake,
    }),
    [
      playClearGlobalBest,
      playClearMyBest,
      playClearNoMistake,
      playClearWithMistake,
      playCountdownTick,
      playCorrect,
      playRoundStart,
      playWrong,
      startBgm,
      stopBgm,
    ],
  );

  useGameSoundEffects({
    screen,
    game,
    clearSoundVariant: clearFlow.clearSoundVariant,
    soundEffects: gameSoundEffects,
  });

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

    clearFlow.resetClearFlow();
    setUnlockedStageIdsByPlayer((prev) => ({
      ...prev,
      [activePlayerId]: [],
    }));
  };

  const handleUnlockAllStages = () => {
    if (!activePlayerId) {
      return;
    }

    clearFlow.resetClearFlow();
    setUnlockedStageIdsByPlayer((prev) =>
      unlockAllStagesForPlayer(prev, activePlayerId, STAGES),
    );
  };

  const navigation = {
    backToStageSelect: () => {
      setScreen("stageSelect");
      game.stopSession();
      clearFlow.resetClearFlow();
      closeRankingScreen();
    },
    startStage: (stage: (typeof STAGES)[number]) => {
      if (!unlockedStageIds.has(stage.id)) {
        return;
      }

      clearFlow.resetClearFlow();

      if (game.startStage(stage)) {
        setScreen("playing");
      }
    },
    openRanking: (stageId: string) => {
      openRankingScreen(stageId);
      setScreen("ranking");
    },
    openPlayHistory: () => {
      if (!activePlayerId) {
        return;
      }
      setScreen("historyDetail");
    },
    openPlayerSelect: () => {
      setRegisterErrorCode(null);
      setNewPlayerName("");
      setScreen("playerSelect");
    },
    openDebug: () => {
      setScreen("debug");
    },
    selectPlayer: (playerId: string) => {
      selectPlayer(playerId);
      setScreen("stageSelect");
    },
  };

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      translate(locale, "debug.confirmClearAllData"),
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
    clearFlow.resetClearFlow();
    setStageClearConditionOverrides({});
    setUnlockedStageIdsByPlayer({});
    setRegisterErrorCode(null);
    setNewPlayerName("");
    closeRankingScreen();
    setMuted(false);
    setScreen("stageSelect");
  };

  const handleRegisterPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = registerPlayer(newPlayerName);
    if (!result.ok) {
      setRegisterErrorCode(result.errorCode);
      return;
    }

    initializePlayerHistory(result.player.id);
    setRegisterErrorCode(null);
    setNewPlayerName("");
    setScreen("stageSelect");
  };

  const rankingRows =
    rankingTab === "global" ? rankingGlobalTop10 : rankingPlayerTop10;

  useBackNavigationShortcut({
    screen,
    onBack: navigation.backToStageSelect,
    onUiTap: playUiTap,
  });

  let content: ReactNode = null;

  if (screen === "stageSelect") {
    content = (
      <StageSelectScreen
        activePlayer={activePlayer}
        canStartStage={canStartStage}
        unlockedStageIds={unlockedStageIds}
        playerNameById={playerNameById}
        bestGlobalByStageId={bestGlobalByStageId}
        bestMyByStageId={bestMyByStageId}
        onStartStage={navigation.startStage}
        onOpenRankingScreen={navigation.openRanking}
        onOpenPlayHistory={navigation.openPlayHistory}
        onOpenPlayerSelect={navigation.openPlayerSelect}
        onOpenDebug={navigation.openDebug}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (screen === "debug") {
    content = (
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
        canUnlockAllStages={
          activePlayerId !== null && unlockedStageIds.size < STAGES.length
        }
        onUnlockAllStages={handleUnlockAllStages}
        canResetUnlockProgress={activePlayerId !== null}
        onResetUnlockProgress={handleResetUnlockProgress}
        onClearAllData={handleClearAllData}
      />
    );
  }

  if (screen === "historyDetail") {
    if (!activePlayer || !historySummary) {
      content = null;
    } else {
      content = (
        <HistoryDetailScreen
          activePlayer={activePlayer}
          historySummary={historySummary}
          historyRecords={historyRecords}
          stageSummaries={stageSummaries}
          onBackToStageSelect={navigation.backToStageSelect}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onUiTap={playUiTap}
        />
      );
    }
  }

  if (screen === "ranking") {
    if (!rankingStage) {
      content = null;
    } else {
      content = (
        <RankingScreen
          rankingStage={rankingStage}
          rankingTab={rankingTab}
          activePlayer={activePlayer}
          playerNameById={playerNameById}
          rows={rankingRows}
          onSetRankingTab={setRankingTab}
          onBackToStageSelect={navigation.backToStageSelect}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onUiTap={playUiTap}
        />
      );
    }
  }

  if (screen === "playerSelect") {
    content = (
      <PlayerSelectScreen
        players={players}
        activePlayerId={activePlayerId}
        newPlayerName={newPlayerName}
        registerErrorCode={registerErrorCode}
        onSetNewPlayerName={(name) => {
          setNewPlayerName(name);
          if (registerErrorCode) {
            setRegisterErrorCode(null);
          }
        }}
        onSelectPlayer={navigation.selectPlayer}
        onRegisterPlayer={handleRegisterPlayer}
        onBackToStageSelect={() => setScreen("stageSelect")}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  if (
    screen === "playing" &&
    game.isPlaying &&
    game.selectedStage &&
    game.question
  ) {
    content = (
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
        clearCelebrationTier={clearFlow.clearCelebration.clearCelebrationTier}
        clearBestBadge={clearFlow.clearCelebration.clearBestBadge}
        clearCelebrationTick={clearFlow.clearCelebrationTick}
        didUnlockNextStageOnClear={clearFlow.didUnlockNextStageOnClear}
        onAnswer={game.handleAnswer}
        onBackToStageSelect={navigation.backToStageSelect}
        onResetStage={game.resetStage}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onUiTap={playUiTap}
      />
    );
  }

  return (
    <I18nProvider
      locale={locale}
      localeOverride={localeOverride}
      setLocaleOverride={setLocaleOverride}
    >
      {content}
    </I18nProvider>
  );
}

export default App;
