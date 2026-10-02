import {
  createCompanion,
  getAllCompanions,
  getCompanionsPage,
  getCompanion,
  getRecentSessions,
} from "@/lib/actions/companions.action";

const authMock = jest.fn();
const createSupabaseClientMock = jest.fn();
const revalidatePathMock = jest.fn();
const revalidateTagMock = jest.fn();
const createAnonSupabaseClientMock = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

jest.mock("@/lib/supabase", () => ({
  createSupabaseClient: () => createSupabaseClientMock(),
  createAnonSupabaseClient: () => createAnonSupabaseClientMock(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
  // Run the wrapped function directly; caching itself is Next's concern.
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
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
    // By default the anonymous (cacheable) read is unavailable, so listing
    // falls back to the signed-in client like before.
    createAnonSupabaseClientMock.mockImplementation(() => {
      throw new Error("anon unavailable");
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
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
    expect(revalidateTagMock).toHaveBeenCalledWith("companions");
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
    const orderMock = jest.fn(() => query);

    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({ order: orderMock })),
      })),
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

  it("reports whether another page of companions exists", async () => {
    const rows = Array.from({ length: 4 }, (_, index) => ({ id: `c${index}` }));
    const rangeMock = jest.fn().mockResolvedValue({ data: rows, error: null });

    createSupabaseClientMock.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({ range: rangeMock })),
        })),
      })),
    });

    const result = await getCompanionsPage({ limit: 3, page: 2 });

    expect(rangeMock).toHaveBeenCalledWith(3, 6);
    expect(result.companions).toHaveLength(3);
    expect(result.hasMore).toBe(true);
  });

  describe("public list caching", () => {
    const anonRows = (rows: unknown[], error: unknown = null) => {
      const rangeMock = jest.fn().mockResolvedValue({ data: rows, error });
      createAnonSupabaseClientMock.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              ilike: jest.fn(() => ({ range: rangeMock })),
              range: rangeMock,
            })),
          })),
        })),
      });
      return rangeMock;
    };

    it("serves unfiltered lists from the anonymous cached read", async () => {
      anonRows([{ id: "a" }, { id: "b" }]);

      const result = await getAllCompanions({ limit: 3 });

      expect(result).toEqual([{ id: "a" }, { id: "b" }]);
      expect(createSupabaseClientMock).not.toHaveBeenCalled();
    });

    it("double-checks empty anonymous results with the signed-in client", async () => {
      anonRows([]);
      const rangeMock = jest
        .fn()
        .mockResolvedValue({ data: [{ id: "private" }], error: null });
      createSupabaseClientMock.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({ range: rangeMock })),
          })),
        })),
      });

      await expect(getAllCompanions({})).resolves.toEqual([{ id: "private" }]);
    });

    it("falls back to the signed-in client when the cached read fails", async () => {
      anonRows([], { message: "permission denied" });
      const rangeMock = jest.fn().mockResolvedValue({ data: [{ id: "x" }], error: null });
      createSupabaseClientMock.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({ range: rangeMock })),
          })),
        })),
      });

      await expect(getAllCompanions({})).resolves.toEqual([{ id: "x" }]);
    });

    it("never caches free-text searches", async () => {
      const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const orMock = jest.fn(() => ({ range: rangeMock }));
      createSupabaseClientMock.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({ order: jest.fn(() => ({ or: orMock })) })),
        })),
      });

      await getAllCompanions({ topic: "cells" });

      expect(createAnonSupabaseClientMock).not.toHaveBeenCalled();
      expect(orMock).toHaveBeenCalled();
    });
  });
});
