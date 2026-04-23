import { afterEach, describe, expect, it, vi } from "vitest";
import { STAGES } from "./stages";

describe("STAGES", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("restores zero-inclusive answer ranges", () => {
    const stage1 = STAGES[0];
    const stage2 = STAGES[1];
    const stage3 = STAGES[2];

    expect(stage1?.id).toBe("stage1");
    expect(stage1?.answerMin).toBe(0);
    expect(stage1?.answerMax).toBe(18);
    expect(stage2?.id).toBe("stage2");
    expect(stage2?.answerMin).toBe(0);
    expect(stage2?.answerMax).toBe(9);
    expect(stage3?.id).toBe("stage3");
    expect(stage3?.answerMin).toBe(0);
    expect(stage3?.answerMax).toBe(9);
  });

  it("stage1 retries zero-inclusive expressions when the retry gate allows it", () => {
    const stage1 = STAGES[0];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5);

    const expression = stage1.createExpression();

    expect(expression).toEqual({
      left: 4,
      right: 5,
      operator: "+",
      answer: 9,
    });
  });

  it("stage1 can still return zero-inclusive expressions", () => {
    const stage1 = STAGES[0];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.95);

    const expression = stage1.createExpression();

    expect(expression).toEqual({
      left: 0,
      right: 6,
      operator: "+",
      answer: 6,
    });
  });

  it("stage2 still retries zero-heavy results before accepting a non-zero one", () => {
    const stage2 = STAGES[1];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.4);

    const expression = stage2.createExpression();

    expect(expression).toEqual({
      left: 6,
      right: 2,
      operator: "-",
      answer: 4,
    });
  });

  it("stage3 retries zero answers when the retry gate allows it", () => {
    const stage3 = STAGES[2];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5);

    const expression = stage3.createExpression();

    expect(expression).toEqual({
      left: 8,
      right: 5,
      operator: "-",
      answer: 3,
    });
  });

  it("stage3 can still return zero answers", () => {
    const stage3 = STAGES[2];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.95);

    const expression = stage3.createExpression();

    expect(expression).toEqual({
      left: 4,
      right: 4,
      operator: "-",
      answer: 0,
    });
  });
});
