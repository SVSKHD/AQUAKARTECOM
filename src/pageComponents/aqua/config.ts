// Feature flags for the Aqua welcome screen. Festive cards and the trust row are
// off by default (V4 audit); flip them here to bring them back.
export type DayTheme = "lagoon" | "sunrise" | "noon";

export const aquaConfig = {
  showFestive: false,
  showTrust: false,
  suggestionChips: [
    "Help me choose a water softener",
    "My borewell water is hard",
    "I need an RO purifier",
  ],
  // "auto" follows the visitor's local time: sunrise before 11, noon until 16, lagoon after.
  dayTheme: "auto" as DayTheme | "auto",
  expertWhatsApp: "919014774667",
  splitDefault: 40,
  splitMin: 30,
  splitMax: 70,
  mobileBreakpoint: 768,
  // Panel beside the chat from this width; a bottom sheet below it.
  splitBreakpoint: 1024,
};

export const pickDayTheme = (hour = new Date().getHours()): DayTheme => {
  if (aquaConfig.dayTheme !== "auto") return aquaConfig.dayTheme;
  return hour >= 5 && hour < 11
    ? "sunrise"
    : hour >= 11 && hour < 16
      ? "noon"
      : "lagoon";
};
