import { setupListeners } from "@reduxjs/toolkit/query";
import { AppState, type AppStateStatus } from "react-native";

type CustomHandler = NonNullable<Parameters<typeof setupListeners>[1]>;

const isBackgrounded = (state: AppStateStatus) =>
  state === "inactive" || state === "background";

/**
 * RTK Query's built-in listener binds `window.addEventListener`, which does not
 * exist on React Native. Calling `setupListeners(dispatch)` with no handler
 * therefore does nothing on native, and every `refetchOnFocus` flag in the app
 * is silently a no-op.
 *
 * On native we drive focus from `AppState` instead. Online/offline still needs
 * a connectivity library (NetInfo) and is left unwired until that lands — the
 * `onOnline`/`onOffline` actions are intentionally unused here.
 */
export const nativeRtkListeners: CustomHandler = (
  dispatch,
  { onFocus, onFocusLost },
) => {
  let previous = AppState.currentState;

  const subscription = AppState.addEventListener("change", (next) => {
    if (isBackgrounded(previous) && next === "active") {
      dispatch(onFocus());
    } else if (previous === "active" && isBackgrounded(next)) {
      dispatch(onFocusLost());
    }
    previous = next;
  });

  return () => subscription.remove();
};
