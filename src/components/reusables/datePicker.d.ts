import type { ForwardRefExoticComponent, RefAttributes } from "react";

// Types for the glass date picker (datePicker.jsx), so TypeScript callers
// such as the Aqua profile dialog get checked props.
export type AquaDatePickerProps = {
  id?: string;
  name?: string;
  /** "YYYY-MM-DD", or "" for none. */
  value?: string;
  /** Input-like event so it drops into existing form handlers. */
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  placeholder?: string;
  /** "YYYY-MM-DD" bounds; `birthday` defaults them to 1900-01-01 → today. */
  min?: string;
  max?: string;
  yearRange?: number;
  className?: string;
  disabled?: boolean;
  /** Opens on a year grid and shows the age beside the date. */
  birthday?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

declare const AquaDatePicker: ForwardRefExoticComponent<
  AquaDatePickerProps & RefAttributes<HTMLButtonElement>
>;
export default AquaDatePicker;
