import { describe, expect, it } from "vitest";
import { createOptions } from "./logic";

describe("createOptions", () => {
  it("returns 4 unique options including answer within range", () => {
    const options = createOptions(5, 1, 20);

    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain(5);
    expect(options.every((value) => value >= 1 && value <= 20)).toBe(true);
  });
});
