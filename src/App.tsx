import { type FormEvent, useMemo, useState } from "react";
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
import type { STAGES } from "./shared/stages";
import type { Screen } from "./shared/types";

function App() {
  const [screen, setScreen] = useState<Screen>("stageSelect");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

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
  const playingPlayer = useMemo(
    () => players.find((player) => player.id === game.playingPlayerId) ?? null,
    [game.playingPlayerId, players],
  );

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
        onClose={() => setScreen("stageSelect")}
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
      remainingCount={game.remainingCount}
      elapsedMs={game.elapsedMs}
      bestTimeMs={game.bestTimeMs}
      isCleared={game.isCleared}
      isRoundActive={game.isRoundActive}
      countdownDisplay={game.countdownDisplay}
      wrongAnswerCount={game.wrongAnswerCount}
      lastResult={game.lastResult}
      onAnswer={game.handleAnswer}
      onBackToStageSelect={backToStageSelect}
      onResetStage={game.resetStage}
    />
  );
}

export default App;
