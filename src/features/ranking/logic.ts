import { RANKING_LIMIT } from "../../shared/constants";
import type { StageRunRecord } from "../../shared/types";

const sortByRanking = (a: StageRunRecord, b: StageRunRecord): number => {
  if (a.elapsedMs !== b.elapsedMs) {
    return a.elapsedMs - b.elapsedMs;
  }

  return a.recordedAt - b.recordedAt;
};

export const getTopRecords = (records: StageRunRecord[]): StageRunRecord[] =>
  [...records].sort(sortByRanking).slice(0, RANKING_LIMIT);

export const buildBestRecordByStageId = (
  records: StageRunRecord[],
  playerId?: string,
): Map<string, StageRunRecord> => {
  const bestByStageId = new Map<string, StageRunRecord>();

  for (const record of records) {
    if (playerId && record.playerId !== playerId) {
      continue;
    }

    const currentBest = bestByStageId.get(record.stageId);
    if (!currentBest || sortByRanking(record, currentBest) < 0) {
      bestByStageId.set(record.stageId, record);
    }
  }

  return bestByStageId;
};

export const getPlayerBestTime = (
  records: StageRunRecord[],
  stageId: string,
  playerId: string,
): number | null => {
  const top = buildBestRecordByStageId(records, playerId).get(stageId);

  return top ? top.elapsedMs : null;
};
