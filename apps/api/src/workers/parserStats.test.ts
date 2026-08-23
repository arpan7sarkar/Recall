import { describe, expect, it } from "vitest";
import { calculateTextStats } from "./parserStats";

describe("calculateTextStats", () => {
  it("returns empty stats for missing content", () => {
    expect(calculateTextStats(null)).toEqual({ wordCount: null, readingTime: null });
  });

  it("calculates word count and at least one minute of reading time", () => {
    expect(calculateTextStats("one two\nthree")).toEqual({ wordCount: 3, readingTime: 1 });
    expect(calculateTextStats(Array.from({ length: 401 }, () => "word").join(" "))).toEqual({
      wordCount: 401,
      readingTime: 3,
    });
  });
});
