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

export const getPlayerBestTime = (
  records: StageRunRecord[],
  stageId: string,
  playerId: string,
): number | null => {
  const top = getTopRecords(
    records.filter(
      (record) => record.stageId === stageId && record.playerId === playerId,
    ),
  )[0];

  return top ? top.elapsedMs : null;
};
