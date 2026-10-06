import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const readLayoutSource = (fileName) =>
  fs.readFileSync(path.join(currentDirectory, fileName), "utf8");

describe("AquaUserDashbordLayout", () => {
  it("scrolls with the page and keeps the desktop sidebar pinned", () => {
    const layout = readLayoutSource("layout.js");
    const header = readLayoutSource("header.js");

    expect(layout).toContain("data-dashboard-shell");
    expect(layout).toContain("min-h-screen");
    expect(layout).not.toContain("h-screen overflow-hidden");
    expect(header).toContain("data-dashboard-sidebar");
    expect(header).toContain("sticky top-4 hidden");
  });

  it("waits for the persisted session before deciding the user is signed out", () => {
    const layout = readLayoutSource("layout.js");

    expect(layout).toContain("state._persist?.rehydrated");
    expect(layout).toContain("SignInPrompt");
  });

  it("picks the time-based greeting after mount to avoid hydration mismatches", () => {
    const greeting = readLayoutSource("greet.js");

    expect(greeting).toContain("data-dashboard-greeting");
    expect(greeting).toMatch(/useEffect\(\(\) => \{\s*setGreeting/);
  });
});
