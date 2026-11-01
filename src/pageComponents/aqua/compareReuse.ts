import type { ChatMessage } from "./types";

// A comparison already made (the same products, in any order) is reopened
// instead of being made again: no new chat bubbles, nothing sent anywhere.

export type FoundComparison = {
  // The reply that holds the comparison table.
  messageId: string;
  // In which past chat it was found; null when it's in the chat on screen.
  chatId: string | null;
  chatTitle: string | null;
};

type PastChat = { id: string; title: string; messages: ChatMessage[] };

// The same products, whatever the order.
export const sameProducts = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return set.size === new Set(b).size && b.every((id) => set.has(id));
};

const latestIn = (messages: ChatMessage[], ids: string[]) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role === "aqua" && m.table && sameProducts(m.table, ids)) return m;
  }
  return null;
};

// The newest comparison of exactly these products: the chat on screen first,
// then past chats (most recent first).
export function findComparison(
  ids: string[],
  current: ChatMessage[],
  past: PastChat[],
): FoundComparison | null {
  if (ids.length < 2) return null;
  const here = latestIn(current, ids);
  if (here) return { messageId: here.id, chatId: null, chatTitle: null };
  for (const chat of past) {
    const m = latestIn(chat.messages, ids);
    if (m) return { messageId: m.id, chatId: chat.id, chatTitle: chat.title };
  }
  return null;
}
