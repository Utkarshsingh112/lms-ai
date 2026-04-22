import { getDatabaseErrorMessage, getErrorMessage } from "@/lib/errors";

describe("errors helpers", () => {
  it("returns the error message from an Error instance", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("maps permission errors to a user-friendly message", () => {
    expect(
      getDatabaseErrorMessage(
        new Error("new row violates row-level security policy"),
        "fallback"
      )
    ).toBe("You do not have permission to perform this action.");
  });

  it("falls back for unknown database errors", () => {
    expect(
      getDatabaseErrorMessage(new Error("unexpected"), "fallback message")
    ).toBe("fallback message");
  });
});
