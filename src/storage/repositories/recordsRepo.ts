import type { StageRunRecord } from "../../shared/types";
import { RECORDS_STORAGE_KEY } from "../keys";
import { loadStoredJson, saveJson } from "./storageHelpers";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const loadRecords = (): StageRunRecord[] => {
  const parsed = loadStoredJson<unknown[]>(RECORDS_STORAGE_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((candidate): candidate is StageRunRecord => {
    if (!candidate || typeof candidate !== "object") return false;
    const record = candidate as Partial<StageRunRecord>;

    return (
      typeof record.id === "string" &&
      typeof record.stageId === "string" &&
      typeof record.playerId === "string" &&
      isFiniteNumber(record.elapsedMs) &&
      record.elapsedMs > 0 &&
      isFiniteNumber(record.requiredCount) &&
      record.requiredCount > 0 &&
      isFiniteNumber(record.wrongCount) &&
      record.wrongCount >= 0 &&
      isFiniteNumber(record.recordedAt)
    );
  });
};

export const saveRecords = (records: StageRunRecord[]) => {
  saveJson(RECORDS_STORAGE_KEY, records);
};
