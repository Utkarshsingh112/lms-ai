import { generateSessionRecap } from "@/lib/actions/recap.action";

const authMock = jest.fn();
const parseMock = jest.fn();
const getCompanionMock = jest.fn();
const createSupabaseClientMock = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
jest.mock("@/lib/supabase", () => ({
  createSupabaseClient: () => createSupabaseClientMock(),
}));
jest.mock("@/lib/actions/companions.action", () => ({
  getCompanion: (...args: unknown[]) => getCompanionMock(...args),
}));
jest.mock("@/lib/mock-mode", () => ({ isMockMode: false }));
jest.mock("@anthropic-ai/sdk/helpers/zod", () => ({
  zodOutputFormat: () => ({ type: "json_schema" }),
}));
jest.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    beta = { messages: { parse: (...args: unknown[]) => parseMock(...args) } };
    static RateLimitError = class RateLimitError extends Error {};
  }
  return { __esModule: true, default: Anthropic };
});

const messages = [
  { role: "assistant" as const, content: "Hello" },
  { role: "user" as const, content: "Hi" },
];

const goodOutput = {
  summary: "Covered basics.",
  key_points: ["One", "Two", "Three"],
  quiz: [
    {
      question: "Q1?",
      options: ["a", "b", "c", "d"],
      answer_index: 2,
      explanation: "Because.",
    },
  ],
};

const mockSupabase = ({
  count = 0,
  countError = null,
  insertError = null,
}: { count?: number; countError?: unknown; insertError?: unknown } = {}) => {
  const insertMock = jest.fn().mockResolvedValue({ error: insertError });
  const gteMock = jest.fn().mockResolvedValue({ count, error: countError });
  createSupabaseClientMock.mockReturnValue({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ gte: gteMock })) })),
      insert: insertMock,
    })),
  });
  return { insertMock };
};

describe("generateSessionRecap", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    authMock.mockResolvedValue({ userId: "user_1" });
    getCompanionMock.mockResolvedValue({
      id: "c1",
      subject: "science",
      topic: "cells",
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("generates, validates, saves, and returns the recap", async () => {
    const { insertMock } = mockSupabase();
    parseMock.mockResolvedValue({ stop_reason: "end_turn", parsed_output: goodOutput });

    const result = await generateSessionRecap({ companionId: "c1", messages });

    expect(result).toEqual({ status: "ok", recap: goodOutput, saved: true });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user_1", companion_id: "c1", message_count: 2 })
    );

    const request = parseMock.mock.calls[0][0];
    expect(request.model).toBe("claude-opus-5-5");
    expect(request.fallbacks).toBe("default");
    expect(request.messages[0].content).toContain("Subject: science");
    expect(request.messages[0].content).toContain("Student: Hi");
  });

  it("does not call the model for sessions that are too short", async () => {
    const result = await generateSessionRecap({
      companionId: "c1",
      messages: [messages[0]],
    });

    expect(result.status).toBe("too_short");
    expect(parseMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user and an API key", async () => {
    authMock.mockResolvedValueOnce({ userId: null });
    expect((await generateSessionRecap({ companionId: "c1", messages })).status).toBe(
      "unavailable"
    );

    delete process.env.ANTHROPIC_API_KEY;
    expect((await generateSessionRecap({ companionId: "c1", messages })).status).toBe(
      "unavailable"
    );
    expect(parseMock).not.toHaveBeenCalled();
  });

  it("enforces the daily limit before spending model credits", async () => {
    mockSupabase({ count: 20 });

    const result = await generateSessionRecap({ companionId: "c1", messages });

    expect(result.status).toBe("unavailable");
    expect(parseMock).not.toHaveBeenCalled();
  });

  it("stays closed when the summaries table is missing", async () => {
    mockSupabase({ countError: { message: "relation does not exist" } });

    const result = await generateSessionRecap({ companionId: "c1", messages });

    expect(result.status).toBe("unavailable");
    expect(parseMock).not.toHaveBeenCalled();
  });

  it("rejects malformed model output and refusals", async () => {
    mockSupabase();
    parseMock.mockResolvedValueOnce({
      stop_reason: "end_turn",
      parsed_output: { ...goodOutput, quiz: [{ ...goodOutput.quiz[0], answer_index: 9 }] },
    });
    expect((await generateSessionRecap({ companionId: "c1", messages })).status).toBe("error");

    parseMock.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    expect((await generateSessionRecap({ companionId: "c1", messages })).status).toBe("error");
  });

  it("still returns the recap when saving fails", async () => {
    mockSupabase({ insertError: { message: "denied" } });
    parseMock.mockResolvedValue({ stop_reason: "end_turn", parsed_output: goodOutput });

    const result = await generateSessionRecap({ companionId: "c1", messages });

    expect(result).toMatchObject({ status: "ok", saved: false });
  });

  it("rejects oversized input", async () => {
    const result = await generateSessionRecap({
      companionId: "c1",
      messages: Array.from({ length: 201 }, () => ({
        role: "user" as const,
        content: "x",
      })),
    });

    expect(result.status).toBe("error");
    expect(parseMock).not.toHaveBeenCalled();
  });
});
