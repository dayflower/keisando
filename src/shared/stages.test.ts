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
    const stage4 = STAGES[3];
    const stage5 = STAGES[4];
    const stage6 = STAGES[5];

    expect(stage1?.id).toBe("stage1");
    expect(stage1?.answerMin).toBe(0);
    expect(stage1?.answerMax).toBe(18);
    expect(stage2?.id).toBe("stage2");
    expect(stage2?.answerMin).toBe(0);
    expect(stage2?.answerMax).toBe(9);
    expect(stage3?.id).toBe("stage3");
    expect(stage3?.answerMin).toBe(0);
    expect(stage3?.answerMax).toBe(9);
    expect(stage4?.id).toBe("stage4");
    expect(stage4?.answerMin).toBe(0);
    expect(stage4?.answerMax).toBe(81);
    expect(stage5?.id).toBe("stage5");
    expect(stage5?.answerMin).toBe(0);
    expect(stage5?.answerMax).toBe(9);
    expect(stage6?.id).toBe("stage6");
    expect(stage6?.answerMin).toBe(0);
    expect(stage6?.answerMax).toBe(9);
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

  it("stage4 retries zero-inclusive expressions when the retry gate allows it", () => {
    const stage4 = STAGES[3];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5);

    const expression = stage4.createExpression();

    expect(expression).toEqual({
      left: 4,
      right: 5,
      operator: "×",
      answer: 20,
    });
  });

  it("stage4 can still return zero-inclusive expressions", () => {
    const stage4 = STAGES[3];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.95);

    const expression = stage4.createExpression();

    expect(expression).toEqual({
      left: 0,
      right: 6,
      operator: "×",
      answer: 0,
    });
  });

  it("stage5 retries zero answers when the retry gate allows it", () => {
    const stage5 = STAGES[4];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5);

    const expression = stage5.createExpression();

    expect(expression).toEqual({
      left: 15,
      right: 5,
      operator: "×",
      answer: 3,
    });
  });

  it("stage5 retries answer 1 when the retry gate allows it", () => {
    const stage5 = STAGES[4];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5);

    const expression = stage5.createExpression();

    expect(expression).toEqual({
      left: 20,
      right: 5,
      operator: "×",
      answer: 4,
    });
  });

  it("stage5 can still return zero answers", () => {
    const stage5 = STAGES[4];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.95);

    const expression = stage5.createExpression();

    expect(expression).toEqual({
      left: 0,
      right: 4,
      operator: "×",
      answer: 0,
    });
  });

  it("stage5 can still return answer 1", () => {
    const stage5 = STAGES[4];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.95);

    const expression = stage5.createExpression();

    expect(expression).toEqual({
      left: 3,
      right: 3,
      operator: "×",
      answer: 1,
    });
  });

  it("stage5 formats fill-in prompts and option labels", () => {
    const stage5 = STAGES[4];

    const prompt = stage5.formatQuestion?.({
      left: 56,
      right: 8,
      operator: "×",
      answer: 7,
    });
    const optionLabel = stage5.formatOptionLabel?.(7, {
      left: 56,
      right: 8,
      operator: "×",
      answer: 7,
    });

    expect(prompt).toBe("56 = 8 × ?");
    expect(optionLabel).toBe("8 × 7");
  });

  it("stage6 retries zero dividends when the retry gate allows it", () => {
    const stage6 = STAGES[5];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5);

    const expression = stage6.createExpression();

    expect(expression).toEqual({
      left: 15,
      right: 5,
      operator: "÷",
      answer: 3,
    });
  });

  it("stage6 retries answer 1 when the retry gate allows it", () => {
    const stage6 = STAGES[5];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5);

    const expression = stage6.createExpression();

    expect(expression).toEqual({
      left: 20,
      right: 5,
      operator: "÷",
      answer: 4,
    });
  });

  it("stage6 can still return zero dividends", () => {
    const stage6 = STAGES[5];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.95);

    const expression = stage6.createExpression();

    expect(expression).toEqual({
      left: 0,
      right: 4,
      operator: "÷",
      answer: 0,
    });
  });

  it("stage6 can still return answer 1", () => {
    const stage6 = STAGES[5];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.95);

    const expression = stage6.createExpression();

    expect(expression).toEqual({
      left: 3,
      right: 3,
      operator: "÷",
      answer: 1,
    });
  });
});
