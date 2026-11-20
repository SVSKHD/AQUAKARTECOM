import { useEffect, useState } from "react";
import {
  getAiChat,
  listAiChats,
  type AiChatSummary,
  type AiSavedChat,
} from "@/services/ai";

export type { AiChatSummary };

// The customer's saved Aqua chats (pinned first, then newest). null while
// loading; an empty list when there are none or they can't be read.
export function useRecentChats(token: string): AiChatSummary[] | null {
  const [state, setState] = useState<{
    key: string;
    list: AiChatSummary[];
  } | null>(null);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    listAiChats(token, { limit: 12 }).then((list) => {
      if (alive) setState({ key: token, list });
    });
    return () => {
      alive = false;
    };
  }, [token]);
  if (!token) return [];
  return state && state.key === token ? state.list : null;
}

export type ChatLoad =
  | { state: "loading" }
  | { state: "ready"; chat: AiSavedChat }
  | { state: "failed" };

// One saved chat, read in full when it's opened.
export function useSavedChat(id: string | null, token: string): ChatLoad {
  const [result, setResult] = useState<{ key: string; load: ChatLoad } | null>(
    null,
  );
  const key = id && token ? `${id}|${token}` : "";
  useEffect(() => {
    if (!key || !id) return;
    let alive = true;
    getAiChat(id, token).then((chat) => {
      if (!alive) return;
      setResult({
        key,
        load: chat?.messages.length
          ? { state: "ready", chat }
          : { state: "failed" },
      });
    });
    return () => {
      alive = false;
    };
  }, [key, id, token]);
  return result && result.key === key ? result.load : { state: "loading" };
}

export const timeAgo = (iso: string, now = Date.now()) => {
  const t = new Date(iso).getTime();
  if (!iso || Number.isNaN(t)) return "";
  const min = Math.max(0, Math.round((now - t) / 60000));
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

// Saved answers are Markdown; the preview shows them as plain text.
export const plainText = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
