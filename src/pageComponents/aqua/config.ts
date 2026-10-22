// Feature flags for the Aqua welcome screen. Festive cards and the trust row are
// off by default (V4 audit); flip them here to bring them back.
export const aquaConfig = {
  showFestive: false,
  showTrust: false,
  suggestionChips: [
    "Help me choose a water softener",
    "I need an RO purifier for drinking water",
    "Show products under ₹25,000",
  ],
  expertWhatsApp: "919014774667",
  splitDefault: 40,
  splitMin: 30,
  splitMax: 70,
  mobileBreakpoint: 768,
};
