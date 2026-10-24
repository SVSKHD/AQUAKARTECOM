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
  // Most tests only care about the reply: route the stream through `sendAiChat`
  // (a plain mock); streaming-specific tests override streamAiChat directly.
  const sendAiChat = vi.fn();
  const streamAiChat = vi.fn(async (prompt, history, opts) => ({
    reply: await sendAiChat(prompt, history, opts),
    thoughts: [],
    quota: null,
    streamed: true,
  }));
  const getAiQuota = vi.fn(async () => null);
  // Saved chats: none by default. Tests fire `rejectToken` to simulate a 401.
  const rejected = new Set();
  return {
    ...actual,
    getAiStatus: vi.fn(),
    getAiQuota,
    sendAiChat,
    streamAiChat,
    listAiChats: vi.fn(async () => []),
    getAiChat: vi.fn(async () => null),
    carryGuestQuota: vi.fn(async () => null),
    onTokenRejected: (fn) => {
      rejected.add(fn);
      return () => rejected.delete(fn);
    },
    rejectToken: (t) => rejected.forEach((fn) => fn(t)),
  };
});

const ai = await import("@/services/ai");
const {
  default: AssistantWidget,
  ASSISTANT_SUGGESTIONS,
  isAssistantRoute,
} = await import("./AssistantWidget");

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

const setup = (pathname = "/", { token } = {}) => {
  const store = createStore(rootReducer);
  if (token)
    store.dispatch({
      type: "LOGGED_IN_USER",
      payload: { token, user: { name: "Asha" } },
    });
  const utils = render(
    <Provider store={store}>
      <AssistantWidget pathname={pathname} />
    </Provider>,
  );
  return { store, ...utils };
};

let lastStore;
const openWidget = async (opts) => {
  lastStore = setup("/", opts).store;
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
    setup("/quotation/[id]");
    await waitFor(() => expect(ai.getAiStatus).toHaveBeenCalled(), {
      timeout: 3000,
    });
    expect(
      screen.queryByRole("button", { name: "Open AquaKart assistant" }),
    ).toBeNull();
  });

  it("shows on a customer's invoice but not other invoice routes", async () => {
    expect(isAssistantRoute("/invoice/[id]")).toBe(true);
    for (const p of ["/invoices", "/invoice/access", "/admin/crm/invoice/[id]"])
      expect(isAssistantRoute(p)).toBe(false);
    setup("/invoice/[id]");
    expect(
      await screen.findByRole(
        "button",
        { name: "Open AquaKart assistant" },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
  });

  it("opens as a drawer with the page's questions and products", async () => {
    ai.sendAiChat.mockResolvedValueOnce("It pairs well.");
    const { store } = setup("/invoice/[id]");
    act(() => {
      store.dispatch({
        type: "SET_ASSISTANT_CONTEXT",
        payload: {
          variant: "drawer",
          subtitle: "Help with your receipt AQ-1",
          suggestions: ["How do I maintain my Kent Softener?"],
          products: [
            {
              id: "ro-1",
              title: "Kent Grand RO",
              price: 15000,
              mrp: 18000,
              href: "/product/ro-1",
              inStock: true,
              warranty: "1 year",
              question: "Tell me about Kent Grand RO.",
            },
          ],
        },
      });
    });
    await waitFor(
      () => expect(store.getState().assistant.available).toBe(true),
      {
        timeout: 3000,
      },
    );
    act(() => {
      store.dispatch({ type: "OPEN_ASSISTANT", payload: { tab: "products" } });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "AquaKart assistant",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      within(dialog).getByText("Help with your receipt AQ-1"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("tab", { name: /Products for you/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(within(dialog).getByText("Kent Grand RO")).toBeInTheDocument();
    expect(within(dialog).getByText("Warranty 1 year")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Ask AI/ }));
    await waitFor(() =>
      expect(ai.sendAiChat).toHaveBeenCalledWith(
        "Tell me about Kent Grand RO.",
        expect.anything(),
        expect.anything(),
      ),
    );
    expect(within(dialog).getByRole("tab", { name: /Chat/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await within(dialog).findByText("It pairs well."),
    ).toBeInTheDocument();
  });

  it("offers the page's purchase questions in the drawer", async () => {
    const { store } = setup("/invoice/[id]");
    act(() => {
      store.dispatch({
        type: "SET_ASSISTANT_CONTEXT",
        payload: {
          variant: "drawer",
          suggestions: ["How do I maintain my Kent Softener?"],
        },
      });
    });
    await waitFor(
      () => expect(store.getState().assistant.available).toBe(true),
      {
        timeout: 3000,
      },
    );
    act(() => {
      store.dispatch({ type: "OPEN_ASSISTANT", payload: {} });
    });
    const dialog = await screen.findByRole("dialog", {
      name: "AquaKart assistant",
    });
    expect(
      within(dialog).getByRole("button", {
        name: "How do I maintain my Kent Softener?",
      }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("tablist")).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: ASSISTANT_SUGGESTIONS[0] }),
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
    await openWidget({ token: "tok" });
    fireEvent.click(
      screen.getByRole("button", { name: "What TDS is safe to drink?" }),
    );
    // "Show thinking" is on by default, so the wait shows "Thinking…".
    expect(await screen.findByRole("status")).toHaveTextContent("Thinking");
    expect(
      screen.getByRole("button", { name: "Waiting for the assistant" }),
    ).toBeDisabled();
    await act(async () => reply.resolve("Below **500 ppm** is safe."));
    expect(await screen.findByText("500 ppm")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
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
    await openWidget({ token: "tok" });
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
  });

  it("doesn't store a guest's conversation", async () => {
    ai.sendAiChat.mockResolvedValueOnce("Below 500 ppm.");
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "What TDS is safe to drink?" }),
    );
    await screen.findByText("Below 500 ppm.");
    expect(window.sessionStorage.getItem("aquakart.assistant.v1")).toBeNull();
  });

  it("resumes the latest saved chat after a refresh and continues that session", async () => {
    ai.listAiChats.mockResolvedValueOnce([{ id: "s1", title: "TDS" }]);
    ai.getAiChat.mockResolvedValueOnce({
      id: "s1",
      messages: [
        { role: "user", text: "What TDS is safe?" },
        { role: "assistant", text: "Below 500 ppm." },
      ],
    });
    ai.sendAiChat.mockResolvedValueOnce("Yes.");
    await openWidget({ token: "tok" });
    expect(await screen.findByText("Below 500 ppm.")).toBeInTheDocument();
    expect(ai.getAiChat).toHaveBeenCalledWith("s1", "tok");
    const input = screen.getByLabelText("Message the AquaKart assistant");
    fireEvent.change(input, { target: { value: "Is 300 fine?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("Yes.");
    expect(ai.streamAiChat).toHaveBeenLastCalledWith(
      "Is 300 fine?",
      [
        { role: "user", text: "What TDS is safe?" },
        { role: "assistant", text: "Below 500 ppm." },
      ],
      expect.objectContaining({ token: "tok", sessionId: "s1" }),
    );
  });

  it("keeps a guest's chat on login and counts their questions into the account", async () => {
    ai.streamAiChat.mockResolvedValueOnce({
      reply: "Below 500 ppm.",
      thoughts: [],
      quota: {
        tier: "guest",
        limit: 3,
        used: 1,
        remaining: 2,
        resetsAt: "2026-10-23T18:30:00.000Z",
      },
      streamed: true,
    });
    ai.carryGuestQuota.mockResolvedValueOnce({
      tier: "user",
      limit: 5,
      used: 1,
      remaining: 4,
      resetsAt: "2026-10-23T18:30:00.000Z",
    });
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "What TDS is safe to drink?" }),
    );
    await screen.findByText("Below 500 ppm.");
    act(() =>
      lastStore.dispatch({
        type: "LOGGED_IN_USER",
        payload: { token: "tok", user: { name: "Asha" } },
      }),
    );
    expect(
      await screen.findByText("4 of 5 questions left today"),
    ).toBeInTheDocument();
    expect(ai.carryGuestQuota).toHaveBeenCalledWith("tok");
    // The guest conversation stays, isn't replaced by a saved one, and is now stored.
    expect(screen.getByText("Below 500 ppm.")).toBeInTheDocument();
    expect(ai.listAiChats).not.toHaveBeenCalled();
    expect(
      JSON.parse(window.sessionStorage.getItem("aquakart.assistant.v1")),
    ).toHaveLength(2);
  });

  it("logs out when the server rejects the stored token", async () => {
    await openWidget({ token: "stale" });
    act(() => ai.rejectToken("stale"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your session expired. Please log in again.",
    );
    expect(lastStore.getState().userData?.token ?? null).toBeNull();
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

// Drives streamAiChat by hand: returns controls to emit thought/delta events.
const controlledStream = () => {
  const ctl = {};
  ai.streamAiChat.mockImplementationOnce(
    (prompt, history, opts) =>
      new Promise((resolve, reject) => {
        Object.assign(ctl, { prompt, history, opts, resolve, reject });
        opts.signal?.addEventListener("abort", () =>
          reject(new ai.AiError("aborted", "Request cancelled")),
        );
      }),
  );
  return ctl;
};

const STEPS = [
  {
    title: "Assessing hardness",
    text: "400 ppm is very hard water. Scale forms quickly at that level. Geysers and taps suffer most.",
  },
  {
    title: "Sizing a softener",
    text: "- Household of four\n- 20 L resin covers it\n- Volume-based regeneration saves salt",
  },
];

describe("AssistantWidget thinking steps", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    ai.getAiStatus.mockResolvedValue(true);
  });
  afterEach(() => vi.clearAllMocks());

  it("shows live steps with nested sub-steps, then collapses them when the answer starts", async () => {
    const s = controlledStream();
    await openWidget({ token: "tok" });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Do I need a softener for 400 ppm hardness?",
      }),
    );
    await waitFor(() => expect(s.opts).toBeDefined());
    expect(s.opts.thinking).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Thinking");

    act(() => s.opts.onThought(0, STEPS[0]));
    act(() => s.opts.onThought(1, STEPS[1]));
    expect(screen.getByText("Assessing hardness")).toBeInTheDocument();
    // Sentences become sub-steps, first two shown, the rest behind "Show 1 more".
    expect(screen.getByText("400 ppm is very hard water.")).toBeInTheDocument();
    expect(screen.queryByText("Geysers and taps suffer most.")).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Show 1 more" })[0]);
    expect(
      screen.getByText("Geysers and taps suffer most."),
    ).toBeInTheDocument();
    // A list in the thought becomes list sub-steps.
    expect(screen.getByText("Household of four")).toBeInTheDocument();

    // Same index again with longer text: upsert, not a new step.
    act(() =>
      s.opts.onThought(1, {
        ...STEPS[1],
        title: "Sizing a softener (4 people)",
      }),
    );
    expect(screen.queryByText("Sizing a softener")).toBeNull();
    expect(
      screen.getByText("Sizing a softener (4 people)"),
    ).toBeInTheDocument();

    act(() => s.opts.onDelta("Yes, a softener "));
    const toggle = screen.getByRole("button", { name: /Thought for 2 steps/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Assessing hardness")).toBeNull();
    expect(screen.getByText(/Yes, a softener/)).toBeInTheDocument();

    await act(async () =>
      s.resolve({
        reply: "Yes, a softener is recommended at **400 ppm**.",
        thoughts: STEPS,
        streamed: true,
      }),
    );
    expect(await screen.findByText("400 ppm")).toBeInTheDocument();
    const done = screen.getByRole("button", { name: /Thought for 2 steps/ });
    fireEvent.click(done);
    expect(screen.getByText("Sizing a softener")).toBeInTheDocument();

    // Thoughts are stored with the message but never sent back as history.
    const stored = JSON.parse(
      window.sessionStorage.getItem("aquakart.assistant.v1"),
    );
    expect(stored[1].thoughts).toHaveLength(2);
    const next = controlledStream();
    const input = screen.getByLabelText("Message the AquaKart assistant");
    fireEvent.change(input, { target: { value: "Thanks" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(next.history).toBeDefined());
    expect(next.history).toEqual([
      { role: "user", text: "Do I need a softener for 400 ppm hardness?" },
      {
        role: "assistant",
        text: "Yes, a softener is recommended at **400 ppm**.",
      },
    ]);
  });

  it("keeps restored steps collapsed", async () => {
    window.sessionStorage.setItem(
      "aquakart.assistant.v1",
      JSON.stringify([
        { role: "user", text: "Hi" },
        { role: "assistant", text: "Hello.", thoughts: STEPS },
      ]),
    );
    await openWidget();
    expect(
      screen.getByRole("button", { name: /Thought for 2 steps/ }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Assessing hardness")).toBeNull();
  });

  it("sends thinking: false when the setting is off, and remembers it", async () => {
    const s = controlledStream();
    await openWidget();
    const toggle = screen.getByRole("button", { name: "Show thinking steps" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("aquakart.assistant.thinking")).toBe(
      "off",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "What TDS is safe to drink?" }),
    );
    await waitFor(() => expect(s.opts).toBeDefined());
    expect(s.opts.thinking).toBe(false);
    expect(
      await screen.findByRole("status", { name: "Assistant is typing" }),
    ).toBeInTheDocument();
  });

  it("aborts the answer in flight when a new message is sent", async () => {
    const first = controlledStream();
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "Which softener for my home?" }),
    );
    await waitFor(() => expect(first.opts).toBeDefined());
    act(() => first.opts.onDelta("Partial answer"));

    const second = controlledStream();
    const input = screen.getByLabelText("Message the AquaKart assistant");
    fireEvent.change(input, { target: { value: "Actually, for a flat?" } });
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(second.opts).toBeDefined());
    expect(first.opts.signal.aborted).toBe(true);
    expect(screen.getByText("Stopped")).toBeInTheDocument();
    expect(second.history).toEqual([]);
    expect(screen.queryByText("Partial answer")).toBeNull();
  });

  it("aborts on Clear chat and on close", async () => {
    const s = controlledStream();
    const dialog = await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "Which softener for my home?" }),
    );
    await waitFor(() => expect(s.opts).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Clear chat" }));
    expect(s.opts.signal.aborted).toBe(true);

    const t = controlledStream();
    fireEvent.click(
      screen.getByRole("button", { name: "What TDS is safe to drink?" }),
    );
    await waitFor(() => expect(t.opts).toBeDefined());
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(t.opts.signal.aborted).toBe(true);
  });

  it("shows a mid-stream error with the partial text greyed out and a retry", async () => {
    const s = controlledStream();
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "Which softener for my home?" }),
    );
    await waitFor(() => expect(s.opts).toBeDefined());
    act(() => s.opts.onDelta("A 20 L softener"));
    const err = new ai.AiError(
      "unavailable",
      "Assistant is unavailable right now.",
      503,
    );
    err.partial = "A 20 L softener";
    await act(async () => s.reject(err));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Assistant is unavailable right now.");
    expect(within(alert).getByText("A 20 L softener")).toHaveClass(
      "text-slate-400",
    );
    expect(
      within(alert).getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});

describe("AssistantWidget support note", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    ai.getAiStatus.mockResolvedValue(true);
    ai.sendAiChat.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it("shows the support note with Call and WhatsApp under the latest answer only", async () => {
    ai.sendAiChat
      .mockResolvedValueOnce("A 20 L softener suits you.")
      .mockResolvedValueOnce("Every 6–12 months.");
    await openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "Which softener for my home?" }),
    );
    await screen.findByText("A 20 L softener suits you.");
    expect(
      screen.getByText(/AI suggestions help you shortlist models/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Call AquaKart support/ }),
    ).toHaveAttribute("href", "tel:+919014774667");
    const wa = screen.getByRole("link", { name: "WhatsApp" });
    expect(wa).toHaveAttribute("target", "_blank");
    expect(decodeURIComponent(wa.getAttribute("href"))).toContain(
      '"Which softener for my home?"',
    );

    const input = screen.getByLabelText("Message the AquaKart assistant");
    fireEvent.change(input, {
      target: { value: "How often should filters be changed?" },
    });
    fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("Every 6–12 months.");
    expect(screen.getAllByRole("link", { name: "WhatsApp" })).toHaveLength(1);
    expect(
      decodeURIComponent(
        screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href"),
      ),
    ).toContain("filters be changed");
  });
});

describe("AssistantWidget daily question limits", () => {
  const guest = {
    tier: "guest",
    limit: 3,
    used: 1,
    remaining: 2,
    resetsAt: "2026-10-23T18:30:00.000Z",
  };
  beforeEach(() => {
    window.sessionStorage.clear();
    ai.getAiStatus.mockResolvedValue(true);
    ai.sendAiChat.mockReset();
    ai.getAiQuota.mockResolvedValue(guest);
  });
  afterEach(() => {
    ai.getAiQuota.mockReset().mockResolvedValue(null);
    vi.clearAllMocks();
  });

  const limitError = (overrides) =>
    Object.assign(
      new ai.AiError(
        "daily_limit",
        "You've used your 3 free questions for today.",
        429,
      ),
      {
        loginRequired: true,
        quota: { ...guest, used: 3, remaining: 0 },
        ...overrides,
      },
    );

  it("shows the server's counter and updates it from each answer", async () => {
    ai.streamAiChat.mockResolvedValueOnce({
      reply: "Hi there.",
      thoughts: [],
      streamed: true,
      quota: { ...guest, used: 2, remaining: 1 },
    });
    await openWidget();
    expect(
      await screen.findByText("2 of 3 free questions left today"),
    ).toBeInTheDocument();
    expect(ai.getAiQuota).toHaveBeenCalledWith(null, expect.anything());
    const input = screen.getByLabelText("Message the AquaKart assistant");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      await screen.findByText("1 of 3 free questions left today"),
    ).toBeInTheDocument();
  });

  it("on AI_DAILY_LIMIT for a guest disables the input and offers login, keeping the question", async () => {
    ai.streamAiChat.mockRejectedValueOnce(limitError());
    const { store } = setup();
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Open AquaKart assistant" },
        { timeout: 3000 },
      ),
    );
    const input = await screen.findByLabelText(
      "Message the AquaKart assistant",
    );
    fireEvent.change(input, { target: { value: "One more?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(input).toBeDisabled());
    // Shown in the composer (and announced once to screen readers).
    expect(
      within(input.closest("form")).getByText(
        "You've used your 3 free questions for today.",
      ),
    ).toBeInTheDocument();
    expect(input).toHaveValue("One more?");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Log in for 5 questions a day/ }),
    );
    expect(store.getState().authDialog).toBe(true);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "AquaKart assistant" }),
      ).not.toBeInTheDocument(),
    );

    ai.getAiQuota.mockResolvedValue({
      tier: "user",
      limit: 5,
      used: 0,
      remaining: 5,
      resetsAt: guest.resetsAt,
    });
    act(() =>
      store.dispatch({
        type: "LOGGED_IN_USER",
        payload: { token: "tok", user: { name: "Asha" } },
      }),
    );
    await screen.findByRole("dialog", { name: "AquaKart assistant" });
    expect(
      await screen.findByText("5 of 5 questions left today"),
    ).toBeInTheDocument();
    expect(ai.getAiQuota).toHaveBeenCalledWith("tok", expect.anything());
    expect(
      screen.getByLabelText("Message the AquaKart assistant"),
    ).not.toBeDisabled();
  });

  it("for a customer at the limit says when questions come back, in IST", async () => {
    ai.getAiQuota.mockResolvedValue({
      tier: "user",
      limit: 5,
      used: 5,
      remaining: 0,
      resetsAt: guest.resetsAt,
    });
    await openWidget();
    expect(
      await screen.findByText("You've used all 5 of today's questions."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Come back after midnight\. Questions reset at 12:00 am IST, Sat 24 Oct\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Log in/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Message the AquaKart assistant"),
    ).toBeDisabled();
  });
});
