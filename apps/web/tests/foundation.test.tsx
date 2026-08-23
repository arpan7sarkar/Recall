import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packagePath = resolve(process.cwd(), "package.json");

describe("web test foundation", () => {
  it("declares executable unit and browser test commands", async () => {
    const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as {
      scripts?: { test?: string; "test:e2e"?: string };
    };

    expect(packageJson.scripts?.test).toBe("vitest run");
    expect(packageJson.scripts?.["test:e2e"]).toBe("playwright test");
  });

  it("can create a browser-like DOM in the test environment", () => {
    const element = document.createElement("button");
    element.textContent = "Save";

    expect(element.textContent).toBe("Save");
  });
});
