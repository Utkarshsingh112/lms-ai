import {
  createCompanion,
  getAllCompanions,
  getCompanion,
  getRecentSessions,
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

const proHas = ({ plan }: { plan?: string }) => plan === "pro";
const validInput = {
  name: "Coach",
  subject: "science",
  topic: "cells",
  voice: "female",
  style: "formal",
  duration: 15,
};

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

    authMock.mockResolvedValue({ userId: "user_123", has: proHas });
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

  it("rejects invalid input before touching the database", async () => {
    authMock.mockResolvedValue({ userId: "user_123", has: proHas });

    await expect(
      createCompanion({ ...validInput, subject: "astrology" })
    ).rejects.toThrow("Choose a valid subject.");
    expect(createSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("does not persist unexpected client-supplied fields", async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: { id: "comp_1" },
      error: null,
    });
    const insertMock = jest.fn(() => ({
      select: jest.fn(() => ({ single: singleMock })),
    }));

    authMock.mockResolvedValue({ userId: "user_123", has: proHas });
    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({ insert: insertMock })),
    });

    await createCompanion({
      ...validInput,
      author: "someone_else",
      id: "forced",
    } as never);

    expect(insertMock).toHaveBeenCalledWith({ ...validInput, author: "user_123" });
  });

  it("blocks creation when the user is at their plan limit", async () => {
    const eqMock = jest.fn().mockResolvedValue({ count: 3, error: null });
    const insertMock = jest.fn();

    authMock.mockResolvedValue({
      userId: "user_123",
      has: ({ feature }: { feature?: string }) =>
        feature === "3_companion_limit",
    });
    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: eqMock })),
        insert: insertMock,
      })),
    });

    await expect(createCompanion(validInput)).rejects.toThrow(
      "You have reached your companion limit."
    );
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rolls back the insert when a concurrent request exceeded the limit", async () => {
    const countEq = jest
      .fn()
      .mockResolvedValueOnce({ count: 2, error: null })
      .mockResolvedValueOnce({ count: 4, error: null });
    const deleteAuthorEq = jest.fn().mockResolvedValue({ error: null });
    const deleteIdEq = jest.fn(() => ({ eq: deleteAuthorEq }));
    const insertMock = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: { id: "new" }, error: null }),
      })),
    }));

    authMock.mockResolvedValue({
      userId: "user_123",
      has: ({ feature }: { feature?: string }) =>
        feature === "3_companion_limit",
    });
    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: countEq })),
        insert: insertMock,
        delete: jest.fn(() => ({ eq: deleteIdEq })),
      })),
    });

    await expect(createCompanion(validInput)).rejects.toThrow(
      "You have reached your companion limit."
    );
    expect(deleteIdEq).toHaveBeenCalledWith("id", "new");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("escapes user input in companion search filters", async () => {
    const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const orMock = jest.fn(() => ({ range: rangeMock }));
    const query = { or: orMock, range: rangeMock };

    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({ select: jest.fn(() => query) })),
    });

    await getAllCompanions({ topic: 'a,b)%"' });

    expect(orMock).toHaveBeenCalledWith(
      'topic.ilike."%a,b)\\\\%\\"%",name.ilike."%a,b)\\\\%\\"%"'
    );
  });

  it("returns no recent sessions for signed-out visitors", async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(getRecentSessions()).resolves.toEqual([]);
    expect(createSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("scopes recent sessions to the signed-in user", async () => {
    const limitMock = jest.fn().mockResolvedValue({
      data: [{ companions: { id: "c1" } }],
      error: null,
    });
    const orderMock = jest.fn(() => ({ limit: limitMock }));
    const eqMock = jest.fn(() => ({ order: orderMock }));

    authMock.mockResolvedValue({ userId: "user_123" });
    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: eqMock })) })),
    });

    await expect(getRecentSessions(5)).resolves.toEqual([{ id: "c1" }]);
    expect(eqMock).toHaveBeenCalledWith("user_id", "user_123");
  });
});
