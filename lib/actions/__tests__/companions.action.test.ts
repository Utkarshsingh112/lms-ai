import {
  createCompanion,
  getCompanion,
} from "@/lib/actions/companions.action";

const authMock = jest.fn();
const createSupabaseClientMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

jest.mock("@/lib/supabase", () => ({
  createSupabaseClient: () => createSupabaseClientMock(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

describe("companions.action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a companion and revalidates dependent pages", async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: { id: "comp_123", name: "Coach" },
      error: null,
    });
    const selectMock = jest.fn(() => ({ single: singleMock }));
    const insertMock = jest.fn(() => ({ select: selectMock }));

    authMock.mockResolvedValue({ userId: "user_123" });
    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({
        insert: insertMock,
      })),
    });

    const result = await createCompanion({
      name: "Coach",
      subject: "science",
      topic: "cells",
      voice: "female",
      style: "formal",
      duration: 15,
    });

    expect(insertMock).toHaveBeenCalledWith({
      author: "user_123",
      duration: 15,
      name: "Coach",
      style: "formal",
      subject: "science",
      topic: "cells",
      voice: "female",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/companions");
    expect(revalidatePathMock).toHaveBeenCalledWith("/my-journey");
    expect(result).toEqual({ id: "comp_123", name: "Coach" });
  });

  it("throws a user-friendly error when the user is not signed in", async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(
      createCompanion({
        name: "Coach",
        subject: "science",
        topic: "cells",
        voice: "female",
        style: "formal",
        duration: 15,
      })
    ).rejects.toThrow("You must be signed in to create a companion.");
  });

  it("returns null when the companion does not exist", async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const eqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({
        select: selectMock,
      })),
    });

    await expect(getCompanion("missing")).resolves.toBeNull();
    expect(eqMock).toHaveBeenCalledWith("id", "missing");
  });
});
