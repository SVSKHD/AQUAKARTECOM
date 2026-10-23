import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import rootReducer from "@/store";

vi.mock("@/services/ai", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAiStatus: vi.fn(), sendAiChat: vi.fn() };
});

const ai = await import("@/services/ai");
const { default: AssistantWidget, ASSISTANT_SUGGESTIONS } =
  await import("./AssistantWidget");

beforeAll(() => {
  window.matchMedia ||= (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
});

const setup = (pathname = "/") => {
  const store = createStore(rootReducer);
  const utils = render(
    <Provider store={store}>
      <AssistantWidget pathname={pathname} />
    </Provider>,
  );
  return { store, ...utils };
};

const openWidget = async () => {
  setup();
  fireEvent.click(
    await screen.findByRole(
      "button",
      { name: "Open AquaKart assistant" },
      { timeout: 3000 },
    ),
  );
  return screen.findByRole("dialog", { name: "AquaKart assistant" });
};

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("AssistantWidget", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    ai.getAiStatus.mockResolvedValue(true);
    ai.sendAiChat.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it("stays hidden when the assistant isn't configured", async () => {
    ai.getAiStatus.mockResolvedValue(false);
    setup();
    await waitFor(() => expect(ai.getAiStatus).toHaveBeenCalled(), {
      timeout: 3000,
    });
    expect(
      screen.queryByRole("button", { name: "Open AquaKart assistant" }),
    ).toBeNull();
  });

  it("stays hidden on printable document routes", async () => {
    setup("/invoice/[id]");
    await waitFor(() => expect(ai.getAiStatus).toHaveBeenCalled(), {
      timeout: 3000,
    });
    expect(
      screen.queryByRole("button", { name: "Open AquaKart assistant" }),
    ).toBeNull();
  });

  it("opens with starter suggestions and focuses the composer", async () => {
    await openWidget();
    for (const s of ASSISTANT_SUGGESTIONS)
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByLabelText("Message the AquaKart assistant"),
      ).toHaveFocus(),
    );
  });

  it("shows a typing indicator, disables send, then renders the reply and announces it", async () => {
    const reply = deferred();
    ai.sendAiChat.mockReturnValueOnce(reply.promise);
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "What TDS is safe to drink?" }),
    );
    expect(
      await screen.findByRole("status", { name: "Assistant is typing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Waiting for the assistant" }),
    ).toBeDisabled();
    await act(async () => reply.resolve("Below **500 ppm** is safe."));
    expect(await screen.findByText("500 ppm")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Assistant is typing" }),
    ).toBeNull();
    expect(
      document.querySelector('[aria-live="polite"]').textContent,
    ).toContain("Below **500 ppm** is safe.");
    expect(
      JSON.parse(window.sessionStorage.getItem("aquakart.assistant.v1")),
    ).toEqual([
      { role: "user", text: "What TDS is safe to drink?" },
      { role: "assistant", text: "Below **500 ppm** is safe." },
    ]);
  });

  it("on 429 keeps the user's text and leaves the failed turn out of history", async () => {
    ai.sendAiChat
      .mockResolvedValueOnce("Hello! How can I help?")
      .mockRejectedValueOnce(
        new ai.AiError(
          "rate_limited",
          "You're sending messages too fast, please wait a moment.",
          429,
        ),
      )
      .mockResolvedValueOnce("ok");
    const dialog = await openWidget();
    const input = screen.getByLabelText("Message the AquaKart assistant");

    fireEvent.change(input, { target: { value: "Hi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("Hello! How can I help?");

    fireEvent.change(input, { target: { value: "Which softener?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You're sending messages too fast",
    );
    expect(input).toHaveValue("Which softener?");
    expect(
      within(dialog).queryByText("Which softener?", { selector: "p" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(ai.sendAiChat).toHaveBeenCalledTimes(3));
    expect(ai.sendAiChat.mock.calls[2][1]).toEqual([
      { role: "user", text: "Hi" },
      { role: "assistant", text: "Hello! How can I help?" },
    ]);
  });

  it("on 503 offers a retry that resends the same prompt", async () => {
    ai.sendAiChat
      .mockRejectedValueOnce(
        new ai.AiError(
          "unavailable",
          "Assistant is unavailable right now.",
          503,
        ),
      )
      .mockResolvedValueOnce("Every 6–12 months.");
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", {
        name: "How often should filters be changed?",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Assistant is unavailable right now.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Every 6–12 months.")).toBeInTheDocument();
    expect(ai.sendAiChat.mock.calls[1][0]).toBe(
      "How often should filters be changed?",
    );
  });

  it("shows the server's message when the safety filter blocks a prompt", async () => {
    ai.sendAiChat.mockRejectedValueOnce(
      new ai.AiError("blocked", "I can't help with that request.", 422),
    );
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "Which softener for my home?" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "I can't help with that request.",
    );
  });

  it("pre-fills the composer from 'Ask about this product' without sending", async () => {
    const { store } = setup();
    await screen.findByRole(
      "button",
      { name: "Open AquaKart assistant" },
      { timeout: 3000 },
    );
    act(() =>
      store.dispatch({
        type: "OPEN_ASSISTANT",
        payload: {
          prefill:
            "Tell me about Softener 20 L. Is it right for hard water in my home?",
        },
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText("Message the AquaKart assistant"),
      ).toHaveValue(
        "Tell me about Softener 20 L. Is it right for hard water in my home?",
      ),
    );
    expect(ai.sendAiChat).not.toHaveBeenCalled();
  });

  it("clears the chat and its stored history", async () => {
    ai.sendAiChat.mockResolvedValueOnce("Sure.");
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "Which softener for my home?" }),
    );
    await screen.findByText("Sure.");
    fireEvent.click(screen.getByRole("button", { name: "Clear chat" }));
    expect(screen.queryByText("Sure.")).toBeNull();
    expect(
      screen.getByRole("button", { name: ASSISTANT_SUGGESTIONS[0] }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem("aquakart.assistant.v1")).toBeNull();
  });

  it("restores the conversation from sessionStorage", async () => {
    window.sessionStorage.setItem(
      "aquakart.assistant.v1",
      JSON.stringify([
        { role: "user", text: "Hi" },
        { role: "assistant", text: "Welcome back." },
      ]),
    );
    await openWidget();
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const dialog = await openWidget();
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      await screen.findByRole("button", { name: "Open AquaKart assistant" }),
    ).toBeInTheDocument();
  });
});
