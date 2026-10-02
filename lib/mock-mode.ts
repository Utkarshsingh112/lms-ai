// Local-only switch (see scripts/dev-mock.mjs): skips the Clerk browser
// provider and uses a scripted voice session. Always false in production.
export const isMockMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_MOCK_VAPI === "true";
