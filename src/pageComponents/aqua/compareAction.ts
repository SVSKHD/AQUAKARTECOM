// The Compare buttons send these words (reply chips, the compare tray). They
// compare the picked products locally, so they never reach the AI; with fewer
// than two picks nothing is sent at all.
const COMPARE_ACTION = /^(compare|compare these|compare picks)$/i;

export const isCompareAction = (text: string) =>
  COMPARE_ACTION.test(text.trim());
