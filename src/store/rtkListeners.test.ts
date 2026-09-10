import { AppState, type AppStateStatus } from "react-native";
import { nativeRtkListeners } from "./rtkListeners";

/**
 * This handler exists because RTK Query's built-in one binds `window`, which
 * React Native does not have — so `refetchOnFocus` is a silent no-op without
 * it. Silent is the point: nothing on screen says whether focus is wired, and
 * these transitions are the only way to find out.
 */
describe("nativeRtkListeners", () => {
  const onFocus = jest.fn(() => ({ type: "focus" }));
  const onFocusLost = jest.fn(() => ({ type: "focusLost" }));
  const onOnline = jest.fn(() => ({ type: "online" }));
  const onOffline = jest.fn(() => ({ type: "offline" }));

  let emit: (next: AppStateStatus) => void;
  let remove: jest.Mock;
  let dispatch: jest.Mock;

  const start = (from: AppStateStatus) => {
    (AppState as { currentState: AppStateStatus }).currentState = from;
    return nativeRtkListeners(dispatch, {
      onFocus,
      onFocusLost,
      onOnline,
      onOffline,
    } as unknown as Parameters<typeof nativeRtkListeners>[1]);
  };

  beforeEach(() => {
    remove = jest.fn();
    dispatch = jest.fn();
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, handler) => {
        emit = handler as (next: AppStateStatus) => void;
        return { remove } as ReturnType<typeof AppState.addEventListener>;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports focus when the app comes back from the background", () => {
    start("background");
    emit("active");

    expect(dispatch).toHaveBeenCalledWith({ type: "focus" });
    expect(onFocusLost).not.toHaveBeenCalled();
  });

  // iOS passes through `inactive` on the way out and back, so it counts as
  // backgrounded in both directions.
  it("treats inactive as backgrounded", () => {
    start("inactive");
    emit("active");
    expect(dispatch).toHaveBeenCalledWith({ type: "focus" });

    dispatch.mockClear();
    emit("inactive");
    expect(dispatch).toHaveBeenCalledWith({ type: "focusLost" });
  });

  it("reports focus lost when the app leaves the foreground", () => {
    start("active");
    emit("background");

    expect(dispatch).toHaveBeenCalledWith({ type: "focusLost" });
    expect(onFocus).not.toHaveBeenCalled();
  });

  // The pair that would fire a spurious refetch of every focus-bound query.
  it("stays quiet moving between two backgrounded states", () => {
    start("inactive");
    emit("background");

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("stays quiet when the state does not actually change", () => {
    start("active");
    emit("active");

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("tracks the previous state across a sequence, not just the first event", () => {
    start("active");
    emit("background");
    emit("active");
    emit("background");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "focusLost",
      "focus",
      "focusLost",
    ]);
  });

  it("unsubscribes when the returned cleanup runs", () => {
    const cleanup = start("active");
    cleanup?.();

    expect(remove).toHaveBeenCalled();
  });
});
