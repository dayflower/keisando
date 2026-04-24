import { describe, expect, it } from "vitest";
import {
  formatRecordedAt,
  isRecordedAtToday,
  isSameLocalDate,
} from "./formatters";

describe("formatRecordedAt", () => {
  it("formats timestamps differently by locale", () => {
    const recordedAt = new Date(2025, 0, 2, 3, 4).getTime();

    expect(formatRecordedAt(recordedAt, "ja")).toBe("2025/01/02 03:04");
    expect(formatRecordedAt(recordedAt, "en")).toBe("01/02/2025, 03:04");
  });

  it("returns stable output for repeated calls", () => {
    const recordedAt = new Date(2025, 0, 2, 3, 4).getTime();

    expect(formatRecordedAt(recordedAt, "ja")).toBe(
      formatRecordedAt(recordedAt, "ja"),
    );
    expect(formatRecordedAt(recordedAt, "en")).toBe(
      formatRecordedAt(recordedAt, "en"),
    );
  });
});

describe("isSameLocalDate", () => {
  it("returns true for timestamps on the same local date", () => {
    const morning = new Date(2025, 0, 2, 1, 0).getTime();
    const evening = new Date(2025, 0, 2, 23, 59).getTime();

    expect(isSameLocalDate(morning, evening)).toBe(true);
  });

  it("returns false for timestamps on different local dates", () => {
    const previousDay = new Date(2025, 0, 1, 23, 59).getTime();
    const nextDay = new Date(2025, 0, 2, 0, 0).getTime();

    expect(isSameLocalDate(previousDay, nextDay)).toBe(false);
  });
});

describe("isRecordedAtToday", () => {
  it("returns true when the timestamp is on the same local date as now", () => {
    const now = new Date(2025, 0, 2, 12, 0).getTime();
    const recordedAt = new Date(2025, 0, 2, 3, 4).getTime();

    expect(isRecordedAtToday(recordedAt, now)).toBe(true);
  });

  it("returns false when the timestamp is not on the same local date as now", () => {
    const now = new Date(2025, 0, 2, 12, 0).getTime();
    const recordedAt = new Date(2025, 0, 1, 23, 59).getTime();

    expect(isRecordedAtToday(recordedAt, now)).toBe(false);
  });
});
