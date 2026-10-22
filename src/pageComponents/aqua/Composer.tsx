"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Mic } from "lucide-react";

type Props = {
  placeholder: string;
  busy: boolean;
  large: boolean;
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

// Always mounted and always enabled. Sending while Aqua is replying completes that reply first.
export default function Composer({
  placeholder,
  busy,
  large,
  onSend,
  onFocusChange,
}: Props) {
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const [listening, setListening] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<SpeechRec | null>(null);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }, [text, large]);
  useEffect(() => () => rec.current?.stop(), []);

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

  const canSend = !!text.trim();
  const ring =
    "linear-gradient(90deg, #10BFA4, #8FE8D8, #5CC8F0, #008B68, #10BFA4)";
  const radius = large ? 28 : 26;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div style={{ position: "relative", width: "100%" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: radius + 3,
            background: ring,
            backgroundSize: "300% 100%",
            filter: "blur(14px)",
            opacity: 0.55,
            animation:
              "aqGlow 6s linear infinite, aqPulse 3.2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -1.5,
            borderRadius: radius + 1.5,
            background: ring,
            backgroundSize: "300% 100%",
            animation: "aqGlow 6s linear infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "var(--aq-surf)",
            borderRadius: radius,
            padding: large ? "12px 10px 10px 18px" : "8px 8px 8px 16px",
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <textarea
            ref={ta}
            aria-label="Message Aqua"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder={placeholder}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: large ? 52 : 34,
              maxHeight: 160,
              resize: "none",
              border: 0,
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: large ? 17 : 15,
              fontWeight: 500,
              lineHeight: 1.5,
              color: "var(--aq-ink)",
              padding: "6px 0",
              transition:
                "min-height .35s cubic-bezier(.22,.8,.24,1), font-size .25s",
            }}
          />
          <button
            type="button"
            className="aq-icon-btn"
            onClick={mic}
            aria-label={listening ? "Stop listening" : "Speak to Aqua"}
            aria-pressed={listening}
            style={{
              width: 40,
              height: 40,
              border: 0,
              boxShadow: "none",
              background: listening ? "var(--aq-mint)" : "transparent",
              color: listening ? "#008B68" : "var(--aq-mut)",
            }}
          >
            <Mic size={18} />
          </button>
          <button
            type="button"
            className="aq-icon-btn"
            onClick={() => submit()}
            disabled={!canSend}
            aria-label={busy && !canSend ? "Aqua is replying" : "Send"}
            style={{
              width: 40,
              height: 40,
              border: 0,
              background: canSend ? "#008B68" : "rgba(var(--aq-ln),.18)",
              color: "#fff",
              opacity: 1,
            }}
          >
            {busy && !canSend ? (
              <span
                aria-hidden="true"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.5)",
                  borderTopColor: "#fff",
                  animation: "aqSpin .9s linear infinite",
                }}
              />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </div>
      </div>
      {hint ? (
        <span role="status" style={{ fontSize: 11.5, color: "var(--aq-mut)" }}>
          {hint}
        </span>
      ) : large ? (
        <span style={{ fontSize: 11, color: "var(--aq-mut)" }}>
          Enter to send · Shift + Enter for a new line
        </span>
      ) : null}
    </div>
  );
}
