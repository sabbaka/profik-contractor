import { toDateParam } from "./localDate";

describe("toDateParam", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toDateParam(new Date(2026, 2, 3))).toBe("2026-03-03");
  });

  it("pads single-digit months and days", () => {
    expect(toDateParam(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("does not shift across midnight the way toISOString (UTC) would", () => {
    // 23:30 local on the 2nd — a naive `toISOString().slice(0, 10)` on a
    // negative-UTC-offset device would read this as the 3rd.
    const lateEvening = new Date(2026, 2, 2, 23, 30);
    expect(toDateParam(lateEvening)).toBe("2026-03-02");
  });
});
