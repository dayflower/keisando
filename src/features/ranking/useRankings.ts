import { useMemo, useState } from "react";
import { STAGES } from "../../shared/stages";
import type { RankingTab, StageRunRecord } from "../../shared/types";
import { selectPlayerStageTopRecords, selectStageTopRecords } from "./logic";

type UseRankingsInput = {
  records: StageRunRecord[];
  activePlayerId: string | null;
};

export const useRankings = ({ records, activePlayerId }: UseRankingsInput) => {
  const [rankingStageId, setRankingStageId] = useState<string | null>(null);
  const [rankingTab, setRankingTab] = useState<RankingTab>("global");

  const rankingStage = useMemo(
    () => STAGES.find((stage) => stage.id === rankingStageId) ?? null,
    [rankingStageId],
  );

  const rankingGlobalTop10 = useMemo(() => {
    if (!rankingStageId) return [];
    return selectStageTopRecords(records, rankingStageId);
  }, [rankingStageId, records]);

  const rankingPlayerTop10 = useMemo(() => {
    if (!rankingStageId || !activePlayerId) return [];
    return selectPlayerStageTopRecords(records, rankingStageId, activePlayerId);
  }, [rankingStageId, activePlayerId, records]);

  const openRankingScreen = (stageId: string) => {
    setRankingStageId(stageId);
    setRankingTab("global");
  };

  const closeRankingScreen = () => {
    setRankingStageId(null);
    setRankingTab("global");
  };

  return {
    rankingStageId,
    rankingStage,
    rankingTab,
    setRankingTab,
    rankingGlobalTop10,
    rankingPlayerTop10,
    openRankingScreen,
    closeRankingScreen,
  };
};
