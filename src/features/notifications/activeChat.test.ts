import { clearActiveChat, isChatOnScreen, setActiveChat } from "./activeChat";

describe("activeChat", () => {
  afterEach(() => {
    // Module-scope state — leaking between tests would make order matter.
    clearActiveChat("o1");
    clearActiveChat("o2");
  });

  it("is off screen until something sets it", () => {
    expect(isChatOnScreen("o1")).toBe(false);
    expect(isChatOnScreen(undefined)).toBe(false);
  });

  it("reports the offer that was set, and no other", () => {
    setActiveChat("o1");
    expect(isChatOnScreen("o1")).toBe(true);
    expect(isChatOnScreen("o2")).toBe(false);
  });

  it("clears when the same offer that set it clears it", () => {
    setActiveChat("o1");
    clearActiveChat("o1");
    expect(isChatOnScreen("o1")).toBe(false);
  });

  // A stale unmount (e.g. a fast screen swap where the new screen's
  // useFocusEffect runs before the old one's cleanup) must not clobber a
  // newer chat's flag — this is the whole reason clearActiveChat takes an id
  // instead of just clearing unconditionally.
  it("does not clear a different offer that became active afterwards", () => {
    setActiveChat("o1");
    setActiveChat("o2");
    clearActiveChat("o1");
    expect(isChatOnScreen("o2")).toBe(true);
  });
});
