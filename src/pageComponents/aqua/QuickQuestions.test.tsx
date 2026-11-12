import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import QuickQuestions from "./QuickQuestions";

const questions = [
  { n: 1, label: "Water source", options: ["borewell", "municipal"] },
  { n: 2, label: "Home", options: ["flat", "villa"] },
];

describe("QuickQuestions", () => {
  it("sends every answer in one message, then locks", () => {
    const onSend = vi.fn(() => true);
    render(
      <QuickQuestions questions={questions} locked={false} onSend={onSend} />,
    );
    const send = screen.getByRole("button", { name: /send answers/i });
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "borewell" }));
    fireEvent.click(screen.getByRole("button", { name: "villa" }));
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalledWith("1 borewell, 2 villa");
    expect(screen.getByRole("status")).toHaveTextContent("Answers sent");
    expect(screen.getByRole("button", { name: "flat" })).toBeDisabled();
  });

  it("stays open when the message can't be sent", () => {
    render(
      <QuickQuestions
        questions={questions}
        locked={false}
        onSend={() => false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "municipal" }));
    fireEvent.click(screen.getByRole("button", { name: /send answers/i }));
    expect(screen.getByRole("button", { name: /send answers/i })).toBeEnabled();
  });

  it("is read-only once the chat has moved on", () => {
    render(<QuickQuestions questions={questions} locked onSend={vi.fn()} />);
    expect(screen.getByRole("button", { name: "flat" })).toBeDisabled();
  });
});
