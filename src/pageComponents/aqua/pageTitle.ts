// Browser-tab titles for the Aqua home. Plain module (no "use client") so the
// server metadata in src/app/page.tsx and the client share one string.

// New chat / start screen: the platform itself.
export const HOME_TITLE = "Aquakart AI · Water softeners & purifiers";

const MAX = 60;

// A chat title trimmed for a tab or header: one line, cut at a word.
export const shortTitle = (title: string, max = MAX) => {
  const t = title.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
};

// Active chat: its title first so it shows in tabs and history; else the platform.
export const tabTitle = (chatTitle: string | null) => {
  const t = chatTitle && shortTitle(chatTitle);
  return t ? `${t} · Aquakart AI` : HOME_TITLE;
};
