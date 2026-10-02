import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CompanionComponent from "@/components/CompanionComponent";

type Handler = (...args: unknown[]) => void;

const handlers: Record<string, Handler> = {};
const fakeVapi = {
  on: jest.fn((event: string, handler: Handler) => {
    handlers[event] = handler;
  }),
  off: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  isMuted: jest.fn(() => false),
  setMuted: jest.fn(),
};
const addToSessionHistoryMock = jest.fn();
const playChimeMock = jest.fn();

jest.mock("@/lib/vapi.sdk", () => ({
  getVapi: () => Promise.resolve(fakeVapi),
}));

jest.mock("@/lib/actions/companions.action", () => ({
  addToSessionHistory: (...args: unknown[]) => addToSessionHistoryMock(...args),
}));

jest.mock("@/lib/chime", () => ({
  playChime: (...args: unknown[]) => playChimeMock(...args),
  readSoundPreference: () => window.localStorage.getItem("lms-ai:sounds") !== "off",
  writeSoundPreference: (enabled: boolean) =>
    window.localStorage.setItem("lms-ai:sounds", enabled ? "on" : "off"),
}));

jest.mock("next/dynamic", () => () => function LottieStub() {
  return null;
});

const emit = (event: string, ...args: unknown[]) =>
  act(() => {
    handlers[event]?.(...args);
  });

const renderSession = () =>
  render(
    <CompanionComponent
      companionId="comp_1"
      subject="science"
      topic="photosynthesis"
      name="Neura the Brainy"
      userName="Sam"
      userImage="/images/logo.svg"
      voice="female"
      style="formal"
      duration={2}
    />
  );

describe("CompanionComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    jest.useFakeTimers();
    addToSessionHistoryMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs a full session: start, countdown, transcript, summary, history", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSession();

    const startButton = await screen.findByRole("button", {
      name: "Start Session",
    });
    await user.click(startButton);

    // Voice call is configured with the companion's duration.
    expect(fakeVapi.start).toHaveBeenCalledTimes(1);
    expect(fakeVapi.start.mock.calls[0][0].maxDurationSeconds).toBe(120);

    // The button is locked while connecting, so a double click can't start two calls.
    const connecting = await screen.findByRole("button", {
      name: "Connecting",
    });
    expect(connecting).toBeDisabled();

    emit("call-start");
    expect(screen.getByText("2:00 left")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("1:55 left")).toBeInTheDocument();

    emit("message", {
      type: "transcript",
      transcriptType: "final",
      role: "assistant",
      transcript: "Hello there",
    });
    emit("message", {
      type: "transcript",
      transcriptType: "final",
      role: "user",
      transcript: "Hi tutor",
    });

    const log = screen.getByRole("log", { name: "Session transcript" });
    const lines = Array.from(log.querySelectorAll("p")).map((p) => p.textContent);
    expect(lines).toEqual(["Neura: Hello there", "Sam: Hi tutor"]);

    emit("call-end");

    expect(
      screen.getByRole("region", { name: "Session summary" })
    ).toHaveTextContent("You spent 0:05 on photosynthesis");
    expect(addToSessionHistoryMock).toHaveBeenCalledWith("comp_1");
    expect(
      screen.getByRole("button", { name: "Start Another Session" })
    ).toBeEnabled();
  });

  it("warns when the session could not be saved to history", async () => {
    addToSessionHistoryMock.mockRejectedValueOnce(new Error("db down"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    renderSession();

    await screen.findByRole("button", { name: "Start Session" });
    emit("call-start");
    emit("call-end");

    expect(
      await screen.findByText("We couldn't save this session to your history.")
    ).toBeInTheDocument();
  });

  it("stops an active call when the user navigates away", async () => {
    const { unmount } = renderSession();

    await screen.findByRole("button", { name: "Start Session" });
    emit("call-start");
    unmount();

    expect(fakeVapi.stop).toHaveBeenCalled();
  });

  it("reflects the call state on the 3D orb and drives its volume", async () => {
    const { container } = renderSession();
    await screen.findByRole("button", { name: "Start Session" });

    const stage = container.querySelector(".orb-stage") as HTMLElement;
    expect(stage).toHaveAttribute("data-state", "idle");

    emit("call-start");
    expect(stage).toHaveAttribute("data-state", "listening");

    emit("speech-start");
    expect(stage).toHaveAttribute("data-state", "speaking");

    emit("volume-level", 0.5);
    expect(stage.style.getPropertyValue("--level")).toBe("0.500");

    emit("speech-end");
    expect(stage).toHaveAttribute("data-state", "listening");
  });

  it("shows live captions for partial transcripts, then fades them", async () => {
    const { container } = renderSession();
    await screen.findByRole("button", { name: "Start Session" });
    emit("call-start");

    emit("message", {
      type: "transcript",
      transcriptType: "partial",
      role: "assistant",
      transcript: "Photosynthesis turns light",
    });

    const caption = container.querySelector(".orb-caption") as HTMLElement;
    expect(caption).toHaveClass("orb-caption-visible");
    expect(caption).toHaveTextContent("Photosynthesis turns light");

    emit("message", {
      type: "transcript",
      transcriptType: "final",
      role: "assistant",
      transcript: "Photosynthesis turns light into energy.",
    });
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(caption).not.toHaveClass("orb-caption-visible");
  });

  it("keeps only the newest words for very long captions", async () => {
    const { container } = renderSession();
    await screen.findByRole("button", { name: "Start Session" });
    emit("call-start");

    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    emit("message", {
      type: "transcript",
      transcriptType: "partial",
      role: "assistant",
      transcript: long,
    });

    const caption = container.querySelector(".orb-caption") as HTMLElement;
    expect(caption.textContent?.startsWith("…")).toBe(true);
    expect(caption.textContent).toContain("word59");
    expect(caption.textContent).not.toContain("word0 ");
  });

  it("plays chimes unless sounds are switched off", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSession();
    await screen.findByRole("button", { name: "Start Session" });

    emit("call-start");
    emit("call-end");
    expect(playChimeMock).toHaveBeenCalledWith("start");
    expect(playChimeMock).toHaveBeenCalledWith("end");

    playChimeMock.mockClear();
    await user.click(screen.getByRole("button", { name: "Sounds on" }));
    expect(screen.getByRole("button", { name: "Sounds off" })).toBeInTheDocument();
    expect(window.localStorage.getItem("lms-ai:sounds")).toBe("off");

    emit("call-start");
    expect(playChimeMock).not.toHaveBeenCalled();
  });
});
