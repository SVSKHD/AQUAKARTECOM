import { Fragment } from "react";

// Renders the assistant's plain-text reply with the small markdown subset it
// uses (paragraphs, line breaks, "- " / "1. " lists, **bold**, # headings).
// Every piece of model text is passed to React as a string child, so any HTML
// in a reply is escaped. Never switch this to dangerouslySetInnerHTML.

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^\s*#{1,4}\s+/;

export const renderInline = (text, keyPrefix) =>
  text
    .split(/(\*\*[^*\n]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${keyPrefix}-${i}`} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
      ),
    );

// Groups lines into paragraph / list blocks.
export const parseReply = (reply) => {
  const blocks = [];
  const lines = String(reply ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  let current = null;

  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const kind = BULLET.test(line)
      ? "ul"
      : NUMBERED.test(line)
        ? "ol"
        : HEADING.test(line)
          ? "h"
          : "p";
    if (kind === "h") {
      flush();
      blocks.push({ kind: "h", lines: [line.replace(HEADING, "")] });
      continue;
    }
    if (!current || current.kind !== kind) {
      flush();
      current = { kind, lines: [] };
    }
    current.lines.push(
      kind === "ul"
        ? line.replace(BULLET, "")
        : kind === "ol"
          ? line.replace(NUMBERED, "")
          : line.trim(),
    );
  }
  flush();
  return blocks;
};

export default function AssistantReply({ text }) {
  const blocks = parseReply(text);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, b) => {
        if (block.kind === "h")
          return (
            <p key={b} className="font-bold text-slate-900">
              {renderInline(block.lines[0], `h${b}`)}
            </p>
          );
        if (block.kind === "ul" || block.kind === "ol") {
          const List = block.kind;
          return (
            <List
              key={b}
              className={`space-y-1 pl-5 ${block.kind === "ul" ? "list-disc" : "list-decimal"} marker:text-emerald-600`}
            >
              {block.lines.map((line, i) => (
                <li key={i}>{renderInline(line, `${b}-${i}`)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={b}>
            {block.lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {renderInline(line, `${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
