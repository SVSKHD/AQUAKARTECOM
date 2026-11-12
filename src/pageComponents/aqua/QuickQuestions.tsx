"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Bath,
  Building2,
  Check,
  Droplets,
  Eye,
  HelpCircle,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { quickAnswer, type QuickQuestion } from "./quizParse";

// An icon for the questions Aqua usually asks; anything else gets a "?".
const ICONS: [RegExp, ReactNode][] = [
  [/source|supply|water from/i, <Droplets key="d" size={15} />],
  [/home|house|flat|property/i, <Building2 key="h" size={15} />],
  [/bath|washroom|toilet/i, <Bath key="b" size={15} />],
  [/see|notice|problem|symptom|stain/i, <Eye key="e" size={15} />],
  [/spot|install|place|where|floor/i, <MapPin key="m" size={15} />],
  [/people|family|members|household/i, <Users key="u" size={15} />],
  [/budget|price|spend/i, <Wallet key="w" size={15} />],
];
const iconFor = (label: string) =>
  ICONS.find(([re]) => re.test(label))?.[1] || <HelpCircle size={15} />;

// Aqua's "Quick questions" as a small form: one card per question with
// single-tap choices (a text box when it has none), an optional note, and one
// Send that answers them all in a single message. Locked once sent, or once
// the chat has moved on.
export default function QuickQuestions({
  questions,
  locked,
  onSend,
  onDismiss,
  className = "",
}: {
  questions: QuickQuestion[];
  locked: boolean;
  // false when the message couldn't be sent (busy, limit reached).
  onSend: (text: string) => boolean;
  // Folds the card away (the customer would rather type).
  onDismiss?: () => void;
  className?: string;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [extra, setExtra] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const id = useId();
  const done = locked || sent;
  const message = quickAnswer(questions, answers, extra);
  const answered = questions.filter((q) => answers[q.n]?.trim()).length;
  const total = questions.length;

  const pick = (n: number, value: string) =>
    setAnswers((a) => ({ ...a, [n]: a[n] === value ? "" : value }));

  return (
    <form
      className={`aq-quiz ${className}`}
      data-locked={done}
      aria-label="Quick questions"
      onSubmit={(e) => {
        e.preventDefault();
        if (done || !message) return;
        if (onSend(message)) setSent(true);
      }}
    >
      <div className="aq-quiz-top">
        <span className="aq-quiz-badge" aria-hidden="true">
          <Sparkles size={15} />
        </span>
        <span className="aq-quiz-heading">
          <span className="aq-quiz-title">Quick questions</span>
          <span className="aq-quiz-sub">
            {sent
              ? "Sent. Aqua is sizing it for you"
              : `${answered} of ${total} answered · one tap each`}
          </span>
        </span>
        {onDismiss && !sent && (
          <button
            type="button"
            className="aq-quiz-x"
            onClick={onDismiss}
            aria-label="Hide quick questions"
            title="Type instead"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      <div
        className="aq-quiz-meter"
        aria-hidden="true"
        style={{ ["--aq-quiz-p" as string]: total ? answered / total : 0 }}
      />

      <div className="aq-quiz-grid">
        {questions.map((q) => {
          const value = answers[q.n] || "";
          return (
            <fieldset
              key={q.n}
              className="aq-quiz-q"
              data-answered={!!value.trim()}
              disabled={done}
            >
              <legend className="aq-quiz-label">
                <span className="aq-quiz-icon" aria-hidden="true">
                  {value.trim() ? <Check size={14} /> : iconFor(q.label)}
                </span>
                {q.label}
              </legend>
              {q.options.length ? (
                <div className="aq-quiz-opts">
                  {q.options.map((o) => {
                    const on = value === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        className="aq-quiz-opt"
                        aria-pressed={on}
                        onClick={() => pick(q.n, o)}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  className="aq-quiz-text"
                  aria-label={q.label}
                  value={value}
                  placeholder="Type here"
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.n]: e.target.value }))
                  }
                  maxLength={120}
                />
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="aq-quiz-foot">
        {noteOpen ? (
          <input
            id={`${id}-extra`}
            className="aq-quiz-text aq-quiz-note"
            aria-label="Anything else (optional)"
            value={extra}
            disabled={done}
            onChange={(e) => setExtra(e.target.value)}
            maxLength={300}
            placeholder="Anything else? e.g. water smells of rotten eggs"
            autoFocus
          />
        ) : (
          !done && (
            <button
              type="button"
              className="aq-quiz-add"
              onClick={() => setNoteOpen(true)}
            >
              <Plus size={14} aria-hidden="true" /> Add a note
            </button>
          )
        )}
        {sent ? (
          <span className="aq-quiz-sent" role="status">
            <Check size={14} aria-hidden="true" /> Answers sent
          </span>
        ) : (
          <button
            type="submit"
            className="aq-quiz-send"
            aria-label="Send answers"
            disabled={done || !message}
          >
            {answered
              ? `Send ${answered === total ? "all" : answered} ${answered === 1 ? "answer" : "answers"}`
              : "Pick to send"}
            <Send size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
