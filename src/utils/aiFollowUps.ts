// Suggested follow-up questions after an assistant answer, so customers can
// clear up the rest of their query in one tap. The backend returns text only,
// so these are derived locally from the question and the reply:
//   1. If the answer asked the customer something, quick answers to that.
//   2. Otherwise follow-ups for the topic (softener, purifier, water quality, …).
// Never more than `max`, never a question already asked in this chat.

type Rule = { test: RegExp; questions: string[] };

// The assistant asked for details: offer one-tap answers.
const ASKED: Rule[] = [
  {
    test: /how many (people|members|family members)|household size|size of your (family|household)/,
    questions: ["We are 2 people", "We are 3–4 people", "We are 5 or more"],
  },
  {
    test: /borewell or (municipal|corporation)|source of (your )?water|where does your water come from/,
    questions: ["It's borewell water", "It's municipal water", "A mix of both"],
  },
  {
    test: /(know|share|have) (your )?(water )?(hardness|tds)|(hardness|tds) (level|reading)/,
    questions: ["I don't know my hardness", "How do I test my water?"],
  },
  {
    test: /apartment or (an )?independent|flat or (a )?(house|villa)/,
    questions: ["I live in an apartment", "It's an independent house"],
  },
];

// Topic follow-ups, checked in order; the first rules that match contribute.
const TOPICS: Rule[] = [
  {
    test: /soften|hardness|hard water|scal(e|ing)|limescale/,
    questions: [
      "What capacity softener do I need?",
      "How often does a softener need salt?",
      "Can a softener be installed in an apartment?",
    ],
  },
  {
    test: /\bro\b|purif|reverse osmosis|\buv\b|drinking water/,
    questions: [
      "Do I need RO or UV for my water?",
      "How often should purifier filters be changed?",
      "Does RO waste a lot of water?",
    ],
  },
  {
    test: /\btds\b|total dissolved/,
    questions: [
      "What TDS is safe to drink?",
      "How can I check my water's TDS?",
    ],
  },
  {
    test: /filter|sediment|cartridge|iron/,
    questions: [
      "Do I need a sediment pre-filter?",
      "How often should filters be changed?",
    ],
  },
  {
    test: /install(ation)?|plumb|fitting/,
    questions: [
      "What's needed for installation?",
      "Do you install in my city?",
    ],
  },
  {
    test: /warrant|service|maintenance|amc/,
    questions: [
      "What does the warranty cover?",
      "Do you offer a maintenance plan?",
    ],
  },
  {
    test: /order|deliver|track|refund|return/,
    questions: ["How do I track my order?", "What's the return policy?"],
  },
];

const GENERAL = [
  "Which softener suits my home?",
  "What TDS is safe to drink?",
  "Talk to an AquaKart expert",
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

export function suggestFollowUps(
  question: string,
  reply: string,
  asked: string[] = [],
  max = 3,
): string[] {
  const q = (question || "").toLowerCase();
  const r = (reply || "").toLowerCase();
  const seen = new Set(asked.map(norm));
  const out: string[] = [];
  const add = (list: string[]) => {
    for (const s of list) {
      if (out.length >= max) return;
      if (!seen.has(norm(s)) && !out.includes(s)) out.push(s);
    }
  };

  // Only the last part of a reply can be a question back to the customer.
  const tail = r.slice(-320);
  if (tail.includes("?"))
    for (const rule of ASKED) if (rule.test.test(tail)) add(rule.questions);
  if (out.length) return out;

  for (const rule of TOPICS)
    if (rule.test.test(q) || rule.test.test(r)) add(rule.questions);
  if (!out.length) add(GENERAL);
  return out;
}
