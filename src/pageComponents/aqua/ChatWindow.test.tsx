import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChatWindow from "./ChatWindow";

describe("ChatWindow", () => {
  it("is a plain wrapper when not floating", () => {
    render(
      <ChatWindow floating={false} title="Chat">
        <p>hello</p>
      </ChatWindow>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("floats, minimises, and flags a new reply while minimised", () => {
    const { rerender } = render(
      <ChatWindow floating title="Villa softener" activity="a1">
        <p>hello</p>
      </ChatWindow>,
    );
    const win = screen.getByRole("dialog", {
      name: "Chat with Aqua: Villa softener",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Minimise the chat window" }),
    );
    expect(win).toHaveAttribute("data-min", "true");
    // The chat inside stays mounted while folded away.
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.queryByText("New reply")).toBeNull();
    rerender(
      <ChatWindow floating title="Villa softener" activity="a2">
        <p>hello</p>
      </ChatWindow>,
    );
    expect(screen.getByText("New reply")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Open the chat window" }),
    );
    expect(win).toHaveAttribute("data-min", "false");
    expect(screen.queryByText("New reply")).toBeNull();
  });

  it("pops out of its box and docks back", () => {
    const onDetach = vi.fn();
    const { rerender } = render(
      <ChatWindow floating={false} detachable onDetach={onDetach} title="Chat">
        <p>hello</p>
      </ChatWindow>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Pop the chat out into a window" }),
    );
    expect(onDetach).toHaveBeenLastCalledWith(true);
    rerender(
      <ChatWindow floating detachable onDetach={onDetach} title="Chat">
        <p>hello</p>
      </ChatWindow>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Put the chat back in its box" }),
    );
    expect(onDetach).toHaveBeenLastCalledWith(false);
  });

  it("keeps the chat mounted when it starts floating", () => {
    // An uncontrolled field keeps its value only if it isn't remounted.
    const Child = () => <input aria-label="draft" defaultValue="" />;
    const { rerender } = render(
      <ChatWindow floating={false} title="Chat">
        <Child />
      </ChatWindow>,
    );
    fireEvent.change(screen.getByLabelText("draft"), {
      target: { value: "kept" },
    });
    rerender(
      <ChatWindow floating title="Chat">
        <Child />
      </ChatWindow>,
    );
    expect(screen.getByLabelText("draft")).toHaveValue("kept");
  });
});
