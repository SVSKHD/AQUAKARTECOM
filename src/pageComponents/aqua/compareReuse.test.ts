import { describe, expect, it } from "vitest";
import { findComparison, sameProducts } from "./compareReuse";
import type { ChatMessage } from "./types";

const aqua = (id: string, table?: string[]): ChatMessage => ({
  id,
  role: "aqua",
  text: "Here they are side by side.",
  ...(table ? { table } : {}),
});

describe("sameProducts", () => {
  it("ignores order, not membership", () => {
    expect(sameProducts(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameProducts(["a", "b"], ["a", "c"])).toBe(false);
    expect(sameProducts(["a", "b"], ["a", "b", "c"])).toBe(false);
  });
});

describe("findComparison", () => {
  it("finds the newest comparison of the same products in this chat", () => {
    const current = [
      aqua("m1", ["a", "b"]),
      { id: "u1", role: "user", text: "Compare these" } as ChatMessage,
      aqua("m2", ["b", "a"]),
      aqua("m3", ["a", "c"]),
    ];
    expect(findComparison(["a", "b"], current, [])).toEqual({
      messageId: "m2",
      chatId: null,
      chatTitle: null,
    });
  });

  it("then looks through past chats, most recent first", () => {
    const past = [
      { id: "s2", title: "Kitchen RO", messages: [aqua("x1", ["c", "d"])] },
      { id: "s1", title: "Borewell", messages: [aqua("y1", ["a", "b"])] },
    ];
    expect(findComparison(["b", "a"], [aqua("m1")], past)).toEqual({
      messageId: "y1",
      chatId: "s1",
      chatTitle: "Borewell",
    });
  });

  it("returns nothing for a new set, or fewer than two products", () => {
    expect(findComparison(["a", "z"], [aqua("m1", ["a", "b"])], [])).toBeNull();
    expect(findComparison(["a"], [aqua("m1", ["a"])], [])).toBeNull();
  });
});
