"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Infinity as Unlimited, Mic, Square } from "lucide-react";
import { AI_PROMPT_MAX } from "@/services/ai";
import { openExpert } from "./AquaHeader";
import { stopSpeaking } from "./ReplyActions";

type Props = {
  placeholder: string;
  busy: boolean;
  large: boolean;
  // Daily question limit reached: no typing, speaking or sending.
  disabled?: boolean;
  // "2 of 3 free questions left today"; empty when the quota is unknown.
  counter?: string;
  // Questions left, for the badge on send: a number, or "unlimited" in
  // testing / for admins and testers. Absent when the quota is unknown.
  left?: number | "unlimited";
  onSend: (text: string) => boolean;
  onFocusChange: (focused: boolean) => void;
};

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult:
    | ((e: {
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// Shown once the draft gets close to the server's 2,000-character limit.
const COUNT_FROM = 1600;

// Mic and send are one matched pair: same circle, same icon size and stroke.
const ACTION = 36;
const ICON = 17;
const STROKE = 2.25;

// Always mounted and always enabled. Sending while Aqua is replying completes that reply first.
export default function Composer({
  placeholder,
  busy,
  large,
  disabled = false,
  counter = "",
  left,
  onSend,
  onFocusChange,
}: Props) {
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const [listening, setListening] = useState(false);
  const [focused, setFocused] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<SpeechRec | null>(null);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(168, el.scrollHeight) + "px";
  }, [text, large, listening, hint]);
  useEffect(() => () => rec.current?.stop(), []);
  useEffect(() => {
    if (disabled) rec.current?.stop();
  }, [disabled]);

  const submit = (value = text) => {
    if (!value.trim()) return;
    if (onSend(value)) setText("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const mic = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (listening) return rec.current?.stop();
    stopSpeaking();
    if (!SR) {
      setHint("Voice isn't supported in this browser. Type instead.");
      setTimeout(() => setHint(""), 2600);
      return;
    }
    const r = new SR();
    rec.current = r;
    r.lang = "en-IN";
    r.interimResults = true;
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      setText(res[0].transcript);
      if (res.isFinal) submit(res[0].transcript);
    };
    r.onend = () => {
      setListening(false);
      onFocusChange(false);
    };
    r.onerror = () => setHint("Microphone unavailable. Type instead.");
    setListening(true);
    onFocusChange(true);
    r.start();
  };

  const canSend = !!text.trim() && !disabled;
  const replying = busy && !canSend && !disabled;
  const active = focused || listening;
  const showCount = text.length >= COUNT_FROM;
  // Empty: one row (field, mic, send). Typing, listening or a hint opens it
  // into the full text area with the toolbar underneath.
  const expanded = !!text || listening || !!hint;
  // A full pill while it's one row; a rounded card once it opens up.
  const radius = expanded ? (large ? 26 : 22) : 999;

  const actionBase = {
    width: ACTION,
    height: ACTION,
    borderRadius: "50%",
    border: 0,
    padding: 0,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    cursor: "pointer",
    transition: "background .2s, color .2s, transform .15s, box-shadow .2s",
  } as const;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        className="aq-composer"
        data-tour="composer"
        data-active={active}
        data-listening={listening}
        data-disabled={disabled}
        data-expanded={expanded}
        style={{
          position: "relative",
          width: "100%",
          borderRadius: radius,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
        onClick={(e) => {
          // Clicking the card's padding focuses the text box.
          if (e.target === e.currentTarget) ta.current?.focus();
        }}
      >
        <textarea
          ref={ta}
          aria-label="Message Aqua"
          aria-describedby="aq-composer-status"
          rows={1}
          maxLength={AI_PROMPT_MAX}
          disabled={disabled}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => {
            setFocused(true);
            onFocusChange(true);
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange(false);
          }}
          placeholder={listening ? "Listening… speak now" : placeholder}
          style={{
            display: "block",
            flex: expanded ? "1 1 100%" : "1 1 0",
            minWidth: 0,
            minHeight: expanded ? (large ? 56 : 44) : ACTION,
            maxHeight: 168,
            resize: "none",
            border: 0,
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: large ? 16.5 : 15,
            fontWeight: 500,
            lineHeight: 1.5,
            color: "var(--aq-ink)",
            padding: expanded
              ? large
                ? "14px 18px 2px"
                : "11px 16px 0"
              : large
                ? "14px 6px 14px 20px"
                : "10px 6px 10px 18px",
          }}
        />

        {/* toolbar: status on the left, the matched mic + send pair on the right;
            beside the field while empty, under it once typing */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: expanded ? "1 1 100%" : "0 0 auto",
            minWidth: 0,
            padding: expanded
              ? large
                ? "2px 8px 8px 14px"
                : "0 6px 6px 12px"
              : large
                ? "8px 8px 8px 0"
                : "4px 5px 4px 0",
            minHeight: ACTION + 8,
          }}
        >
          <div
            id="aq-composer-status"
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {listening ? (
              <span
                role="status"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#B42318",
                }}
              >
                <span aria-hidden="true" className="aq-voice-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                Listening…
              </span>
            ) : hint ? (
              <span
                role="status"
                style={{ fontSize: 12, color: "var(--aq-mut)" }}
              >
                {hint}
              </span>
            ) : (
              <>
                {expanded && active && !showCount && !disabled && (
                  <span
                    className="aq-composer-keys"
                    style={{ fontSize: 11.5, color: "var(--aq-mut2)" }}
                  >
                    <kbd>Enter</kbd> to send · <kbd>Shift</kbd> +{" "}
                    <kbd>Enter</kbd> new line
                  </span>
                )}
              </>
            )}
            {showCount && (
              <span
                aria-live="polite"
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color:
                    text.length >= AI_PROMPT_MAX ? "#B42318" : "var(--aq-mut)",
                }}
              >
                {text.length.toLocaleString("en-IN")} /{" "}
                {AI_PROMPT_MAX.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <button
            type="button"
            className="aq-icon-btn aq-composer-action"
            onClick={mic}
            disabled={disabled}
            aria-label={listening ? "Stop listening" : "Speak to Aqua"}
            aria-pressed={listening}
            title={listening ? "Stop listening" : "Speak"}
            style={{
              ...actionBase,
              background: listening ? "#B42318" : "rgba(var(--aq-ln),.06)",
              color: listening ? "#fff" : "var(--aq-ink)",
              boxShadow: listening ? "0 0 0 6px rgba(180,35,24,.14)" : "none",
              animation: listening
                ? "aqPulse 1.6s ease-in-out infinite"
                : "none",
            }}
          >
            {listening ? (
              <Square
                size={ICON - 4}
                strokeWidth={STROKE}
                fill="currentColor"
              />
            ) : (
              <Mic size={ICON} strokeWidth={STROKE} />
            )}
          </button>
          <button
            type="button"
            className="aq-icon-btn aq-composer-action"
            onClick={() => submit()}
            disabled={!canSend}
            aria-label={replying ? "Aqua is replying" : "Send"}
            title={
              replying
                ? "Aqua is replying"
                : counter
                  ? `Send · ${counter}`
                  : "Send"
            }
            style={{
              ...actionBase,
              position: "relative",
              background: canSend
                ? "linear-gradient(135deg, #10bfa4, #008B68 70%)"
                : "rgba(var(--aq-ln),.06)",
              color: canSend ? "#fff" : "var(--aq-mut2)",
              boxShadow: canSend ? "0 6px 16px rgba(0,139,104,.28)" : "none",
              cursor: canSend ? "pointer" : "default",
              opacity: 1,
            }}
          >
            {replying ? (
              <span
                aria-hidden="true"
                style={{
                  width: ICON - 2,
                  height: ICON - 2,
                  borderRadius: "50%",
                  border: `${STROKE}px solid rgba(var(--aq-ln),.18)`,
                  borderTopColor: "#008B68",
                  animation: "aqSpin .9s linear infinite",
                }}
              />
            ) : (
              <ArrowUp size={ICON} strokeWidth={STROKE} />
            )}
            {/* Questions left, as the header's count badges: a number when
                limited (red at none), an infinity sign when unlimited. */}
            {left !== undefined && (
              <span
                className="aq-badge"
                aria-hidden="true"
                style={{ background: left === 0 ? "#B42318" : "#008B68" }}
              >
                {left === "unlimited" ? (
                  <Unlimited size={11} strokeWidth={3} />
                ) : (
                  left
                )}
              </span>
            )}
          </button>
          {counter && (
            <span aria-live="polite" className="aq-sr-only">
              {counter}
            </span>
          )}
        </div>
      </div>

      <p
        className="aq-composer-note"
        style={{
          margin: 0,
          padding: "0 8px",
          fontSize: 11.5,
          lineHeight: 1.45,
          color: "var(--aq-mut)",
          textAlign: "center",
          textWrap: "balance",
        }}
      >
        {/* Phones get the one-line version so the composer stays short. */}
        <span className="aq-hide-mobile">
          Aquakart AI helps you pick the best softener. To get it installed or
          placed where you want it, talk to an{" "}
        </span>
        <span className="aq-show-mobile">
          Installation or placement help? Talk to an{" "}
        </span>
        <button
          type="button"
          onClick={openExpert}
          style={{
            border: 0,
            padding: 0,
            background: "transparent",
            font: "inherit",
            fontWeight: 700,
            color: "var(--aq-mintink)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            cursor: "pointer",
          }}
        >
          Aquakart expert
        </button>
        .
      </p>
    </div>
  );
}
