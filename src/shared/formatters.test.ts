import { describe, expect, it } from "vitest";
import { formatRecordedAt } from "./formatters";

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
