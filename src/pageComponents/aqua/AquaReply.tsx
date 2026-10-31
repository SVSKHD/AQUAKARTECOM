"use client";

import { Fragment } from "react";
import { parseReply } from "@/components/assistant/AssistantReply";
import type { ReplyBlock as Block } from "./replyProducts";

// Amounts in rupees: "₹31,500", "₹ 1,20,000", "Rs. 4,999", "INR 899", with
// an optional "/-" or a lakh/k suffix. Ends on a digit, so "₹14,500, and"
// leaves the comma out.
export const PRICE_RE =
  /((?:₹|\bRs\.?|\bINR)\s?\d(?:[\d,]*\d)?(?:\.\d+)?(?:\s?\/-|\s?(?:lakhs?|k)\b)?)/i;

// "(₹31,500)" reads as just the highlighted amount: the pill is the frame.
const BRACKETED = new RegExp(`\\(\\s*${PRICE_RE.source}\\s*\\)`, "gi");

// Chat replies mark every price: highlighted, with a sparkling border.
const withPrices = (text: string, key: string) =>
  text
    .replace(BRACKETED, "$1")
    .split(new RegExp(PRICE_RE.source, "gi"))
    .filter(Boolean)
    .map((part, i) =>
      new RegExp(`^${PRICE_RE.source}$`, "i").test(part) ? (
        <span key={`${key}-p${i}`} className="aq-price-hl">
          {part}
        </span>
      ) : (
        <Fragment key={`${key}-p${i}`}>{part}</Fragment>
      ),
    );

// Same markdown subset and parser as the storefront assistant, styled for Aqua
// (the App Router layout doesn't load Tailwind). Reply text only ever reaches
// React as string children, so HTML in a reply is shown as text.
export const inline = (
  text: string,
  key: string,
  opts: { prices?: boolean } = {},
) => {
  const plain = (t: string, k: string) => (opts.prices ? withPrices(t, k) : t);
  return text
    .split(/(\*\*[^*\n]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong
          key={`${key}-${i}`}
          style={{ fontWeight: 700, color: "var(--aq-ink)" }}
        >
          {plain(part.slice(2, -2), `${key}-${i}`)}
        </strong>
      ) : (
        <Fragment key={`${key}-${i}`}>{plain(part, `${key}-${i}`)}</Fragment>
      ),
    );
};

export default function AquaReply({ text }: { text: string }) {
  return <ReplyBlocks blocks={parseReply(text) as Block[]} />;
}

// Replies (not thinking steps or product notes) highlight their prices.
const PRICES = { prices: true };

export function ReplyBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((b, i) => {
        if (b.kind === "h")
          return (
            <p key={i} style={{ margin: 0, fontWeight: 700 }}>
              {inline(b.lines[0], `h${i}`, PRICES)}
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
                <li key={j}>{inline(line, `${i}-${j}`, PRICES)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={i} style={{ margin: 0 }}>
            {b.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line, `${i}-${j}`, PRICES)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
