import HomePage from "@/app/page";
import MyJourneyPage from "@/app/my-journey/page";

const DELAY_MS = 120;
const slow = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY_MS));

const getAllCompanionsMock = jest.fn();
const getRecentSessionsMock = jest.fn();
const getUserCompanionsMock = jest.fn();
const getUserSessionsMock = jest.fn();

jest.mock("@/lib/actions/companions.action", () => ({
  getAllCompanions: () => getAllCompanionsMock(),
  getRecentSessions: () => getRecentSessionsMock(),
  getUserCompanions: () => getUserCompanionsMock(),
  getUserSessions: () => getUserSessionsMock(),
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => Promise.resolve({ userId: "user_1" }),
  currentUser: () =>
    slow({
      id: "user_1",
      firstName: "Sam",
      lastName: "Lee",
      imageUrl: "/images/logo.svg",
      emailAddresses: [{ emailAddress: "sam@example.com" }],
    }),
}));

jest.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("unexpected redirect");
  },
}));

// Independent reads must overlap: total time should be close to one round trip,
// not the sum of all of them.
describe("pages load independent data in parallel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllCompanionsMock.mockImplementation(() => slow([]));
    getRecentSessionsMock.mockImplementation(() => slow([]));
    getUserCompanionsMock.mockImplementation(() => slow([]));
    getUserSessionsMock.mockImplementation(() => slow([]));
  });

  it("home page: popular companions and recent sessions together", async () => {
    const started = Date.now();
    await HomePage();
    expect(Date.now() - started).toBeLessThan(DELAY_MS * 1.7);
  });

  it("my journey: user, companions and sessions together", async () => {
    const started = Date.now();
    await MyJourneyPage();
    expect(Date.now() - started).toBeLessThan(DELAY_MS * 1.7);
  });
});
