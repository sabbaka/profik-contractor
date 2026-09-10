import { renderHook } from "@testing-library/react-native";
import { useConversationTime } from "./useConversationTime";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en-US" },
  }),
}));

/**
 * Day boundaries, not elapsed hours: a message from 23:50 last night is
 * "Yesterday" at 00:10, not "12 minutes ago". The arithmetic divides by a fixed
 * 86_400_000 and rounds, which is what makes the edges worth pinning.
 */
describe("useConversationTime", () => {
  const NOW = new Date("2026-03-10T12:00:00");

  const format = async (iso: string) => {
    const { result } = await renderHook(() => useConversationTime());
    return result.current(iso);
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("gives the clock time for something from today", () => {
    return expect(format("2026-03-10T09:30:00")).resolves.toMatch(/9|09/);
  });

  it("still says today one minute after midnight", async () => {
    await expect(format("2026-03-10T00:01:00")).resolves.not.toBe(
      "messages.yesterday",
    );
  });

  // The boundary the fixed-millisecond division exists to get right.
  it("says yesterday for ten minutes before midnight", async () => {
    await expect(format("2026-03-09T23:50:00")).resolves.toBe(
      "messages.yesterday",
    );
  });

  it("says yesterday for the whole of the previous day", async () => {
    await expect(format("2026-03-09T00:00:01")).resolves.toBe(
      "messages.yesterday",
    );
  });

  it("names the weekday inside the last week", async () => {
    await expect(format("2026-03-06T10:00:00")).resolves.toBe("Fri");
    await expect(format("2026-03-04T10:00:00")).resolves.toBe("Wed");
  });

  // Six days back is still a weekday; seven is far enough to need a date.
  it("switches to a date at exactly a week", async () => {
    await expect(format("2026-03-04T10:00:00")).resolves.toBe("Wed");
    await expect(format("2026-03-03T10:00:00")).resolves.toMatch(/Mar/);
  });

  it("uses a date for anything older", async () => {
    await expect(format("2026-01-15T10:00:00")).resolves.toMatch(/Jan/);
  });

  // A timestamp in the future would otherwise land on a negative day count.
  it("treats a future timestamp as today rather than counting backwards", async () => {
    await expect(format("2026-03-11T10:00:00")).resolves.not.toBe(
      "messages.yesterday",
    );
  });

  it("gives back an empty string for an unparseable timestamp", async () => {
    await expect(format("not-a-date")).resolves.toBe("");
    await expect(format("")).resolves.toBe("");
  });
});
