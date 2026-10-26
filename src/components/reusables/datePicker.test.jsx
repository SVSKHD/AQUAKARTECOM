import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AquaDatePicker from "./datePicker";

describe("AquaDatePicker (glass)", () => {
  it("birthday: opens on years, then months, then days, and emits YYYY-MM-DD", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AquaDatePicker
        name="dob"
        birthday
        value=""
        onChange={onChange}
        placeholder="Add your birthday"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Add your birthday/ }));
    expect(
      screen.getByRole("dialog", { name: "Choose your birthday" }),
    ).toBeTruthy();
    // No date yet: the year grid comes first, and future years aren't offered.
    expect(screen.getByRole("listbox", { name: "Year" })).toBeTruthy();
    expect(
      screen.queryByRole("option", {
        name: String(new Date().getFullYear() + 1),
      }),
    ).toBeNull();

    await user.click(screen.getByRole("option", { name: "1994" }));
    await user.click(screen.getByRole("option", { name: "Aug" }));
    await user.click(
      screen.getByRole("gridcell", { name: "Sunday, 21 August 1994" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      target: { name: "dob", value: "1994-08-21" },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the date with the age, and clears it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AquaDatePicker
        name="dob"
        birthday
        value="1994-08-21"
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole("button", { name: /21 Aug 1994/ });
    expect(trigger.textContent).toMatch(/\d+ years old/);
    await user.click(screen.getByRole("button", { name: "Clear date" }));
    expect(onChange).toHaveBeenCalledWith({
      target: { name: "dob", value: "" },
    });
  });

  it("Escape closes the picker and returns focus to the field", async () => {
    const user = userEvent.setup();
    render(<AquaDatePicker name="d" value="2024-05-10" onChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: /10 May 2024/ });
    await user.click(trigger);
    expect(screen.getByRole("grid")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
