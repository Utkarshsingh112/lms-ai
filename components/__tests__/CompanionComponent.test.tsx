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

jest.mock("@/lib/vapi.sdk", () => ({
  getVapi: () => Promise.resolve(fakeVapi),
}));

jest.mock("@/lib/actions/companions.action", () => ({
  addToSessionHistory: (...args: unknown[]) => addToSessionHistoryMock(...args),
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
});
