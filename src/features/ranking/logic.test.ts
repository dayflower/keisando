import { describe, expect, it } from "vitest";
import type { StageRunRecord } from "../../shared/types";
import { buildBestRecordByStageId } from "./logic";

const baseRecord = (
  id: string,
  stageId: string,
  playerId: string,
  elapsedMs: number,
  recordedAt: number,
): StageRunRecord => ({
  id,
  stageId,
  playerId,
  elapsedMs,
  requiredCount: 10,
  wrongCount: 0,
  recordedAt,
});

describe("buildBestRecordByStageId", () => {
  it("selects fastest record for each stage", () => {
    const records: StageRunRecord[] = [
      baseRecord("r1", "s1", "p1", 2500, 1000),
      baseRecord("r2", "s1", "p2", 2000, 2000),
      baseRecord("r3", "s2", "p1", 3000, 1500),
      baseRecord("r4", "s2", "p2", 3500, 1700),
    ];

    const best = buildBestRecordByStageId(records);

    expect(best.get("s1")?.id).toBe("r2");
    expect(best.get("s2")?.id).toBe("r3");
  });

  it("breaks tie by earlier recordedAt", () => {
    const records: StageRunRecord[] = [
      baseRecord("r1", "s1", "p1", 2000, 2000),
      baseRecord("r2", "s1", "p2", 2000, 1000),
    ];

    const best = buildBestRecordByStageId(records);

    expect(best.get("s1")?.id).toBe("r2");
  });

  it("filters by player when playerId is provided", () => {
    const records: StageRunRecord[] = [
      baseRecord("r1", "s1", "p1", 2500, 1000),
      baseRecord("r2", "s1", "p2", 2000, 900),
      baseRecord("r3", "s2", "p1", 3000, 1200),
    ];

    const best = buildBestRecordByStageId(records, "p1");

    expect(best.get("s1")?.id).toBe("r1");
    expect(best.get("s2")?.id).toBe("r3");
    expect(best.size).toBe(2);
  });
});
