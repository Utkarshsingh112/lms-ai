import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SessionRecap from "@/components/SessionRecap";

const generateMock = jest.fn();

jest.mock("@/lib/actions/recap.action", () => ({
  generateSessionRecap: (...args: unknown[]) => generateMock(...args),
}));

const messages = [
  { role: "assistant" as const, content: "Hello, let's start." },
  { role: "user" as const, content: "Okay." },
];

const recap = {
  summary: "You covered the basics.",
  key_points: ["Point one", "Point two"],
  quiz: [
    {
      question: "Which is correct?",
      options: ["Wrong A", "Right", "Wrong B", "Wrong C"],
      answer_index: 1,
      explanation: "Because it is.",
    },
    {
      question: "Second question?",
      options: ["Right", "Wrong", "Wrong again", "Nope"],
      answer_index: 0,
      explanation: "Second explanation.",
    },
  ],
};

describe("SessionRecap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderAndSettle = async () => {
    render(<SessionRecap companionId="c1" messages={messages} />);
    await act(async () => {
      jest.advanceTimersByTime(1300);
    });
  };

  it("waits for the transcript to settle, then shows the recap and a scored quiz", async () => {
    generateMock.mockResolvedValue({ status: "ok", recap, saved: true });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<SessionRecap companionId="c1" messages={messages} />);
    expect(generateMock).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1300);
    });

    expect(generateMock).toHaveBeenCalledWith({
      companionId: "c1",
      messages,
    });
    expect(screen.getByText("You covered the basics.")).toBeInTheDocument();
    expect(screen.getByText("Point one")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Wrong A" }));
    expect(screen.getByText(/Not quite\. Because it is\./)).toBeInTheDocument();
    // Answered questions are locked.
    expect(screen.getByRole("button", { name: "Right ✓" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Right" }));
    expect(screen.getByText("You scored 1 out of 2.")).toBeInTheDocument();
  });

  it("shows the reason when a recap is unavailable", async () => {
    generateMock.mockResolvedValue({
      status: "unavailable",
      message: "Recaps aren't set up yet.",
    });

    await renderAndSettle();

    expect(screen.getByText("Recaps aren't set up yet.")).toBeInTheDocument();
  });

  it("falls back to a friendly error when generation throws", async () => {
    generateMock.mockRejectedValue(new Error("network"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await renderAndSettle();

    expect(
      screen.getByText("We couldn't build a recap this time.")
    ).toBeInTheDocument();
  });
});
