// The one-reply questionnaire (backend docs/STOREFRONT_AI_CHAT.md, section 4).
// When Aqua needs details it ends the answer with:
//
//   Quick questions:
//   1. Water source: borewell / tanker / municipal
//   2. Bathrooms: 1 / 2 / 3 / 4+
//   Reply in one message, e.g. 1 borewell, 2 villa
//
// which the chat shows as a small form instead of text.

export type QuickQuestion = { n: number; label: string; options: string[] };
export type QuickBlock = {
  // The reply without the block, rendered as normal markdown.
  body: string;
  questions: QuickQuestion[];
  // The "Reply in one message…" line, if the reply had one.
  hint: string;
};

const clean = (line: string) => line.replace(/[*#_`]/g, "").trim();
const QUESTION = /^\s*(\d+)[.)]\s*([^:]+?):\s*(.+)$/;

// null when there's no block, or no question in it parses.
export function parseQuickQuestions(text: string): QuickBlock | null {
  const lines = text.split("\n");
  // The header on its own line, or ending a sentence ("…below. Quick questions:").
  const HEAD = /(^|\s)quick questions:?$/i;
  const start = lines.findIndex((l) => HEAD.test(clean(l)));
  if (start < 0) return null;
  const lead = lines[start]
    .replace(/[*_`#]*\s*quick questions:?\s*[*_`]*\s*$/i, "")
    .trimEnd();
  const questions: QuickQuestion[] = [];
  let hint = "";
  let end = start + 1;
  for (; end < lines.length; end += 1) {
    const line = clean(lines[end].replace(/^\s*[-•]\s*/, ""));
    if (!line) continue;
    if (/^reply in one message/i.test(line)) {
      hint = line;
      end += 1;
      break;
    }
    const m = line.match(QUESTION);
    if (!m) break;
    const options = m[3]
      .split(/\s+\/\s+/)
      .map((o) => o.trim())
      .filter(Boolean);
    questions.push({
      n: Number(m[1]),
      label: m[2].trim(),
      options: options.length >= 2 ? options : [],
    });
  }
  if (!questions.length) return null;
  const body = [...lines.slice(0, start), lead, ...lines.slice(end)]
    .join("\n")
    .trim();
  return { body, questions, hint };
}

// "1 borewell, 2 villa, 3 4+", skipping unanswered questions, then any free
// text the customer added.
export function quickAnswer(
  questions: QuickQuestion[],
  answers: Record<number, string>,
  extra = "",
): string {
  const parts = questions
    .filter((q) => answers[q.n]?.trim())
    .map((q) => `${q.n} ${answers[q.n].trim()}`);
  const note = extra.trim();
  return [parts.join(", "), note].filter(Boolean).join(". ");
}
