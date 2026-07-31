import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Combobox from "./Combobox";

describe("Combobox", () => {
  const options = [
    { id: "softener", title: "Water Softener" },
    { id: "filter", title: "Sand Filter" },
  ];

  it("renders label and placeholder", () => {
    render(
      <Combobox
        label="Product type"
        data={options}
        placeholder="Choose product"
      />,
    );

    expect(screen.getByText(/product type/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/choose product/i)).toBeInTheDocument();
  });

  it("filters options by typed query", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Product type" data={options} />);

    await user.type(screen.getByRole("combobox"), "sand");

    expect(await screen.findByText(/sand filter/i)).toBeInTheDocument();
    expect(screen.queryByText(/water softener/i)).not.toBeInTheDocument();
  });

  it("calls onSelect with selected original item", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Combobox label="Product type" data={options} onSelect={onSelect} />,
    );

    await user.type(screen.getByRole("combobox"), "water");
    await user.click(await screen.findByText(/water softener/i));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(options[0]);
    });
  });

  it("supports string options", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Combobox label="Brand" data={["Kent", "Racold"]} onSelect={onSelect} />,
    );

    await user.type(screen.getByRole("combobox"), "Kent");
    await user.click(await screen.findByText("Kent"));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith("Kent");
    });
  });
});
