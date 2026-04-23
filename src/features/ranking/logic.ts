import { RANKING_LIMIT } from "../../shared/constants";
import type { StageRunRecord } from "../../shared/types";

export const sortByRanking = (a: StageRunRecord, b: StageRunRecord): number => {
  if (a.elapsedMs !== b.elapsedMs) {
    return a.elapsedMs - b.elapsedMs;
  }

  return a.recordedAt - b.recordedAt;
};

export const selectStageRecords = (
  records: StageRunRecord[],
  stageId: string,
): StageRunRecord[] => records.filter((record) => record.stageId === stageId);

export const selectPlayerStageRecords = (
  records: StageRunRecord[],
  stageId: string,
  playerId: string,
): StageRunRecord[] =>
  records.filter(
    (record) => record.stageId === stageId && record.playerId === playerId,
  );

export const getTopRecords = (records: StageRunRecord[]): StageRunRecord[] =>
  [...records].sort(sortByRanking).slice(0, RANKING_LIMIT);

export const selectStageTopRecords = (
  records: StageRunRecord[],
  stageId: string,
): StageRunRecord[] => getTopRecords(selectStageRecords(records, stageId));

export const selectPlayerStageTopRecords = (
  records: StageRunRecord[],
  stageId: string,
  playerId: string,
): StageRunRecord[] =>
  getTopRecords(selectPlayerStageRecords(records, stageId, playerId));

export const selectBestRecord = (
  records: StageRunRecord[],
  stageId: string,
  playerId?: string,
): StageRunRecord | null => {
  const scopedRecords =
    playerId === undefined
      ? selectStageRecords(records, stageId)
      : selectPlayerStageRecords(records, stageId, playerId);

  return scopedRecords.reduce<StageRunRecord | null>((best, record) => {
    if (!best || sortByRanking(record, best) < 0) {
      return record;
    }

    return best;
  }, null);
};

export const buildBestRecordByStageId = (
  records: StageRunRecord[],
  playerId?: string,
): Map<string, StageRunRecord> => {
  const bestByStageId = new Map<string, StageRunRecord>();
  const scopedRecords =
    playerId === undefined
      ? records
      : records.filter((record) => record.playerId === playerId);
  const stageIds = new Set(scopedRecords.map((record) => record.stageId));

  for (const stageId of stageIds) {
    const bestRecord = selectBestRecord(scopedRecords, stageId);
    if (bestRecord) {
      bestByStageId.set(stageId, bestRecord);
    }
  }

  return bestByStageId;
};

export const getPlayerBestTime = (
  records: StageRunRecord[],
  stageId: string,
  playerId: string,
): number | null => {
  const top = selectBestRecord(records, stageId, playerId);

  return top ? top.elapsedMs : null;
};
