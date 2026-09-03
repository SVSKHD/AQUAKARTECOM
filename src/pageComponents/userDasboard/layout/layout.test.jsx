import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const readLayoutSource = (fileName) =>
  fs.readFileSync(path.join(currentDirectory, fileName), "utf8");

describe("AquaUserDashbordLayout", () => {
  it("keeps the dashboard chrome fixed and gives scrolling to content only", () => {
    const layout = readLayoutSource("layout.js");
    const header = readLayoutSource("header.js");
    const greeting = readLayoutSource("greet.js");

    expect(layout).toContain("data-dashboard-shell");
    expect(layout).toContain("h-screen overflow-hidden");
    expect(layout).toContain("data-dashboard-scroll-region");
    expect(layout).toContain(
      "min-h-0 flex-1 overflow-y-auto overscroll-contain",
    );
    expect(layout).toContain("height: 100dvh");
    expect(header).toContain("data-dashboard-sidebar");
    expect(header).toContain("sticky top-0 hidden h-full");
    expect(greeting).toContain("data-dashboard-greeting");
    expect(greeting).toContain("max-w-5xl shrink-0");
  });
});
