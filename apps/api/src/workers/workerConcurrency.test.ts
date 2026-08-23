import { describe, expect, it } from "vitest";
import { getWorkerConcurrency } from "./workerConcurrency";

describe("getWorkerConcurrency", () => {
  it("uses a safe default for invalid values and caps configured parallelism", () => {
    expect(getWorkerConcurrency(undefined)).toBe(2);
    expect(getWorkerConcurrency("0")).toBe(2);
    expect(getWorkerConcurrency("not-a-number")).toBe(2);
    expect(getWorkerConcurrency("99")).toBe(4);
    expect(getWorkerConcurrency("3")).toBe(3);
  });
});
