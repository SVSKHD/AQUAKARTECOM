"use client";

import { Fragment } from "react";
import { parseReply } from "@/components/assistant/AssistantReply";

type Block = { kind: "p" | "ul" | "ol" | "h"; lines: string[] };

// Same markdown subset and parser as the storefront assistant, styled for Aqua
// (the App Router layout doesn't load Tailwind). Reply text only ever reaches
// React as string children, so HTML in a reply is shown as text.
const inline = (text: string, key: string) =>
  text
    .split(/(\*\*[^*\n]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong
          key={`${key}-${i}`}
          style={{ fontWeight: 700, color: "var(--aq-ink)" }}
        >
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={`${key}-${i}`}>{part}</Fragment>
      ),
    );

export default function AquaReply({ text }: { text: string }) {
  const blocks = parseReply(text) as Block[];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((b, i) => {
        if (b.kind === "h")
          return (
            <p key={i} style={{ margin: 0, fontWeight: 700 }}>
              {inline(b.lines[0], `h${i}`)}
            </p>
          );
        if (b.kind === "ul" || b.kind === "ol") {
          const List = b.kind;
          return (
            <List
              key={i}
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {b.lines.map((line, j) => (
                <li key={j}>{inline(line, `${i}-${j}`)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={i} style={{ margin: 0 }}>
            {b.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
