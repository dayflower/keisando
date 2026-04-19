import type { StageRunRecord } from "../../shared/types";
import { RECORDS_STORAGE_KEY } from "../keys";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const loadRecords = (): StageRunRecord[] => {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

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
  } catch {
    return [];
  }
};

export const saveRecords = (records: StageRunRecord[]) => {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
