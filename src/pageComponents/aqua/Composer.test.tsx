import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Composer from "./Composer";

// A stand-in recorder: start/stop like the browser's, one chunk on stop.
class FakeRecorder {
  static isTypeSupported = (t: string) => t === "audio/webm;codecs=opus";
  state = "inactive";
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_s: unknown, o?: { mimeType?: string }) {
    this.mimeType = o?.mimeType || "";
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["voice"]) });
    this.onstop?.();
  }
}

const track = { stop: vi.fn() };
const getUserMedia = vi.fn();

const setup = (
  onTranscribe = vi.fn(async (_clip: Blob) => "Which softener fits?"),
) => {
  const onSend = vi.fn(() => true);
  render(
    <Composer
      placeholder="Ask Aqua anything…"
      busy={false}
      large={false}
      onSend={onSend}
      onTranscribe={onTranscribe}
      onFocusChange={vi.fn()}
    />,
  );
  return { onSend, onTranscribe };
};

const flush = () => act(async () => {});

describe("Composer voice questions", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    getUserMedia.mockResolvedValue({ getTracks: () => [track] });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("records, then sends the words as the question", async () => {
    const { onSend, onTranscribe } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Speak to Aqua" }));
    await flush();
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(screen.getByText(/Listening… 0:00/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole("button", { name: "Stop and send" }));
    await flush();
    const clip = onTranscribe.mock.calls[0][0] as Blob;
    expect(clip.type).toBe("audio/webm;codecs=opus");
    expect(onSend).toHaveBeenCalledWith("Which softener fits?");
    expect(track.stop).toHaveBeenCalled();
  });

  it("cancel throws the recording away", async () => {
    const { onSend, onTranscribe } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Speak to Aqua" }));
    await flush();
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await flush();
    expect(onTranscribe).not.toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("explains a blocked microphone and an unheard clip", async () => {
    getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error("no"), { name: "NotAllowedError" }),
    );
    const { onSend } = setup(vi.fn(async (_clip: Blob) => ""));
    fireEvent.click(screen.getByRole("button", { name: "Speak to Aqua" }));
    await flush();
    expect(
      screen.getByText("Allow microphone access to speak to Aqua."),
    ).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));

    fireEvent.click(screen.getByRole("button", { name: "Speak to Aqua" }));
    await flush();
    act(() => vi.advanceTimersByTime(1500));
    fireEvent.click(screen.getByRole("button", { name: "Stop and send" }));
    await flush();
    expect(
      screen.getByText("Didn't catch that. Try again or type."),
    ).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });
});
