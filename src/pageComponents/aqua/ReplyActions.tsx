"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, Square, Volume2 } from "lucide-react";

// The reply as plain text: its own list numbering kept, markdown symbols dropped.
export const replyPlainText = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/^[ \t]*#{1,4}[ \t]+/gm, "")
    .replace(/^([ \t]*)[*•][ \t]+/gm, "$1- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// One reply is read aloud at a time across the whole chat.
let speakingId: string | null = null;
const listeners = new Set<() => void>();
const setSpeaking = (id: string | null) => {
  speakingId = id;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const synth = () =>
  typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;

export const stopSpeaking = () => {
  synth()?.cancel();
  setSpeaking(null);
};

const pickVoice = (s: SpeechSynthesis) => {
  const voices = s.getVoices();
  return (
    voices.find((v) => v.lang === "en-IN") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
};

// Also used by the blog podcast, so a reply and a blog never talk over each other.
export const useSpeaking = (id: string) =>
  useSyncExternalStore(
    subscribe,
    () => speakingId === id,
    () => false,
  );

export const canSpeak = () => !!synth();

// Which reply or blog is being read right now, for cleanups outside render.
export const speakingNow = () => speakingId;

export const speak = (id: string, text: string) => {
  const s = synth();
  if (!s) return;
  s.cancel();
  // Sentence-sized utterances: some browsers stop one long utterance after ~15s.
  const parts = text
    .replace(/\n+/g, ". ")
    .replace(/₹/g, "rupees ")
    .match(/[^.!?]+[.!?]*/g)
    ?.map((x) => x.trim())
    .filter((x) => /[a-z0-9]/i.test(x));
  if (!parts?.length) return;
  const voice = pickVoice(s);
  setSpeaking(id);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice?.lang || "en-IN";
    if (voice) u.voice = voice;
    if (i === parts.length - 1)
      u.onend = () => speakingId === id && setSpeaking(null);
    u.onerror = () => speakingId === id && setSpeaking(null);
    s.speak(u);
  });
};

const btn = {
  height: 30,
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: 0,
  borderRadius: 999,
  background: "transparent",
  color: "var(--aq-mut)",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
} as const;

export default function ReplyActions({
  id,
  text,
}: {
  id: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const speaking = useSpeaking(id);
  const speakable = canSpeak();

  // Stop reading a reply that leaves the screen (new chat, history switch).
  useEffect(
    () => () => {
      if (speakingId === id) stopSpeaking();
    },
    [id],
  );
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    const plain = replyPlainText(text);
    try {
      await navigator.clipboard.writeText(plain);
    } catch {
      // Older browsers / insecure origins: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = plain;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        marginTop: -4,
        marginLeft: -6,
        animation: "aqChipIn .4s cubic-bezier(.2,.8,.2,1) both",
      }}
    >
      <button
        type="button"
        className="aq-btn-ghost"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy reply"}
        style={{ ...btn, color: copied ? "var(--aq-mintink)" : btn.color }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
      {speakable && (
        <button
          type="button"
          className="aq-btn-ghost"
          onClick={() =>
            speaking ? stopSpeaking() : speak(id, replyPlainText(text))
          }
          aria-pressed={speaking}
          aria-label={speaking ? "Stop reading aloud" : "Read reply aloud"}
          style={{
            ...btn,
            color: speaking ? "var(--aq-mintink)" : btn.color,
            background: speaking ? "var(--aq-mint)" : "transparent",
          }}
        >
          {speaking ? (
            <Square size={12} fill="currentColor" />
          ) : (
            <Volume2 size={15} />
          )}
          {speaking ? "Stop" : "Listen"}
        </button>
      )}
      <span aria-live="polite" className="aq-sr-only">
        {copied ? "Reply copied" : ""}
      </span>
    </div>
  );
}
