import { afterEach, describe, expect, it, vi } from "vitest";
import { STAGES } from "./stages";

describe("STAGES", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides createOptions for every stage", () => {
    expect(STAGES.map((stage) => stage.id)).toEqual([
      "stage1",
      "stage2",
      "stage3",
      "stage4",
      "stage5",
      "stage6",
      "stage7",
      "stage8",
      "stage9",
    ]);
    expect(
      STAGES.every((stage) => typeof stage.createOptions === "function"),
    ).toBe(true);
  });

  it("numeric stages return four options including the correct answer", () => {
    const stage1Options = STAGES[0].createOptions(
      { left: 9, right: 9, operator: "+", answer: 18 },
      "en",
    );
    const stage5Options = STAGES[4].createOptions(
      { left: 56, right: 8, operator: "×", answer: 7 },
      "en",
    );
    const stage7Options = STAGES[6].createOptions(
      { left: 58, right: 7, operator: "×", answer: 8, remainder: 2 },
      "en",
    );

    expect(stage1Options).toHaveLength(4);
    expect(stage1Options.some((option) => option.label === "18")).toBe(true);
    expect(stage5Options).toHaveLength(4);
    expect(stage5Options.some((option) => option.label === "8 × 7")).toBe(true);
    expect(stage7Options).toHaveLength(4);
    expect(stage7Options.some((option) => option.label === "8 (56)")).toBe(
      true,
    );
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

  it("stage7 keeps remainders above zero and below the multiplier", () => {
    const stage7 = STAGES[6];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.75)
      .mockReturnValueOnce(0.1);

    const expression = stage7.createExpression();

    expect(expression).toEqual({
      left: 65,
      right: 8,
      operator: "×",
      answer: 8,
      remainder: 1,
    });
  });

  it("stage7 retries answer 1 when the retry gate allows it", () => {
    const stage7 = STAGES[6];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0);

    const expression = stage7.createExpression();

    expect(expression).toEqual({
      left: 13,
      right: 6,
      operator: "×",
      answer: 2,
      remainder: 1,
    });
  });

  it("stage7 never uses 1 as the multiplier", () => {
    const stage7 = STAGES[6];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const expression = stage7.createExpression();

    expect(expression.right).toBe(2);
    expect(expression.remainder).toBe(1);
  });

  it("stage7 formats remainder prompts and option labels", () => {
    const stage7 = STAGES[6];

    const prompt = stage7.formatQuestion?.({
      left: 58,
      right: 7,
      operator: "×",
      answer: 8,
      remainder: 2,
    });
    const optionLabel = stage7.formatOptionLabel?.(8, {
      left: 58,
      right: 7,
      operator: "×",
      answer: 8,
      remainder: 2,
    });

    expect(prompt).toBe("58 = 7 × ? + 2");
    expect(optionLabel).toBe("8 (56)");
  });

  it("stage8 retries remainder 0 when the retry gate allows it", () => {
    const stage8 = STAGES[7];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.875)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    const expression = stage8.createExpression();

    expect(expression).toEqual({
      left: 23,
      right: 6,
      operator: "÷",
      answer: 3,
      remainder: 5,
    });
  });

  it("stage8 retries answer 0 when the retry gate allows it", () => {
    const stage8 = STAGES[7];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    const expression = stage8.createExpression();

    expect(expression).toEqual({
      left: 23,
      right: 6,
      operator: "÷",
      answer: 3,
      remainder: 5,
    });
  });

  it("stage8 can still return answer 0", () => {
    const stage8 = STAGES[7];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.95);

    const expression = stage8.createExpression();

    expect(expression).toEqual({
      left: 1,
      right: 4,
      operator: "÷",
      answer: 0,
      remainder: 1,
    });
  });

  it("stage8 can still return remainder 0", () => {
    const stage8 = STAGES[7];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.875)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.95);

    const expression = stage8.createExpression();

    expect(expression).toEqual({
      left: 72,
      right: 9,
      operator: "÷",
      answer: 8,
      remainder: 0,
    });
  });

  it("stage8 retries answer 1 when the retry gate allows it", () => {
    const stage8 = STAGES[7];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    const expression = stage8.createExpression();

    expect(expression).toEqual({
      left: 29,
      right: 6,
      operator: "÷",
      answer: 4,
      remainder: 5,
    });
  });

  it("stage8 formats remainder division option labels", () => {
    const stage8 = STAGES[7];

    const prompt = stage8.formatQuestion?.({
      left: 73,
      right: 9,
      operator: "÷",
      answer: 8,
      remainder: 1,
    });
    const optionsJa = stage8.createOptions(
      {
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      },
      "ja",
    );
    const optionsEn = stage8.createOptions(
      {
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      },
      "en",
    );

    expect(prompt).toBeUndefined();
    expect(optionsJa?.some((option) => option.label === "8 … 1")).toBe(true);
    expect(optionsEn?.some((option) => option.label === "8 R 1")).toBe(true);
    expect(
      optionsJa?.every((option) => {
        const [quotientText, remainderText] = option.label.split(" … ");
        const quotient = Number(quotientText);
        const remainder = Number(remainderText);

        return (
          Number.isInteger(quotient) &&
          Number.isInteger(remainder) &&
          remainder >= 0 &&
          remainder < 9
        );
      }),
    ).toBe(true);
  });

  it("stage8 keeps distractor remainders within the divisor range", () => {
    const stage8 = STAGES[7];

    const options = stage8.createOptions(
      {
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      },
      "en",
    );

    expect(options).toHaveLength(4);
    expect(
      options?.every((option) => {
        const [quotientText, remainderText] = option.label.split(" R ");
        const quotient = Number(quotientText);
        const remainder = Number(remainderText);

        return (
          Number.isInteger(quotient) &&
          quotient >= 0 &&
          quotient <= 9 &&
          Number.isInteger(remainder) &&
          remainder >= 0 &&
          remainder < 9
        );
      }),
    ).toBe(true);
  });

  it("stage8 includes a distractor with the correct quotient and wrong remainder", () => {
    const stage8 = STAGES[7];

    const options = stage8.createOptions(
      {
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      },
      "en",
    );

    expect(
      options?.some(
        (option) => option.label.startsWith("8 R ") && option.label !== "8 R 1",
      ),
    ).toBe(true);
  });

  it("stage9 can delegate to stage1 expressions", () => {
    const stage9 = STAGES[8];
    const randomSpy = vi.spyOn(Math, "random");

    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5);

    const expression = stage9.createExpression();

    expect(expression).toEqual({
      left: 4,
      right: 5,
      operator: "+",
      answer: 9,
    });
  });

  it("stage9 uses remainder-aware division options for stage8-style questions", () => {
    const stage9 = STAGES[8];

    const options = stage9.createOptions(
      {
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      },
      "en",
    );

    expect(options).toHaveLength(4);
    expect(options?.some((option) => option.label === "8 R 1")).toBe(true);
  });

  it("stage9 uses numeric options for non-division questions", () => {
    const stage9 = STAGES[8];

    const options = stage9.createOptions(
      {
        left: 6,
        right: 7,
        operator: "×",
        answer: 42,
      },
      "en",
    );

    expect(options).toHaveLength(4);
    expect(options?.filter((option) => option.isCorrect)).toHaveLength(1);
    expect(options?.some((option) => option.label === "42")).toBe(true);
  });
});
