import { profikApi } from "@/src/api/profikApi";
import { TabBarVisibilityProvider } from "@/src/context/TabBarVisibilityContext";
import "@/src/i18n";
import authReducer from "@/src/store/authSlice";
import { ThemeProvider } from "@/src/theme";
import { PortalProvider } from "@tamagui/portal";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react-native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { TamaguiProvider, Theme } from "tamagui";
import tamaguiConfig from "@/tamagui.config";

type AuthState = ReturnType<typeof authReducer>;

/** The bearer token an `authed` render holds. Tests may assert on it. */
export const TEST_TOKEN = "test-token";

// An iPhone-sized frame with a notch and a home indicator, so screens that pad
// by the insets lay out the way they do on a device rather than against zero.
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * A fresh store per test, built like `src/store/index.ts` — same reducers,
 * same middleware — so one test's cache never answers the next one's query.
 *
 * `setupListeners` is left out on purpose: it subscribes to AppState, and
 * nothing in a test refocuses the app.
 *
 * `auth` starts hydrated (`loading: false`) rather than at the slice's own
 * initial state, which waits on SecureStore — the part `AuthGate` owns, not the
 * screens rendered here.
 */
export function makeTestStore(preloadedState?: { auth?: Partial<AuthState> }) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [profikApi.reducerPath]: profikApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(profikApi.middleware),
    // RTK batches RTK Query's notifications on requestAnimationFrame by
    // default, which jest-expo implements as a timer — one still pending when
    // the file ends fires into a torn-down environment. A microtask flushes
    // before the test moves on, and batches the same updates together.
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers({ autoBatch: { type: "tick" } }),
    preloadedState: {
      auth: { token: null, loading: false, ...preloadedState?.auth },
    },
  });
  liveStores.push(store);
  return store;
}

// RTK Query keeps an unused cache entry for 60 seconds on a timer, which
// outlives the test and holds jest open after the run. Resetting the API state
// clears those timers along with the cache.
const liveStores: { dispatch: (action: unknown) => unknown }[] = [];
afterEach(() => {
  for (const store of liveStores.splice(0)) {
    store.dispatch(profikApi.util.resetApiState());
  }
});

export type TestStore = ReturnType<typeof makeTestStore>;

export interface RenderWithProvidersOptions {
  /** Defaults to a fresh `makeTestStore`. Pass one to preload other state. */
  store?: TestStore;
  /**
   * Signed in with `TEST_TOKEN` rather than browsing as a guest. Ignored when a
   * `store` is passed — that store's `auth` is what it is.
   */
  authed?: boolean;
}

/**
 * Renders `ui` inside the providers `app/_layout.tsx` puts around every
 * screen, in the same order, with a real store. Mock the network with
 * `mockApi` from `./mockApi`, not the hooks.
 *
 * Left out, because nothing a screen asserts on depends on them: the auth gate
 * and its redirects, fonts, react-native-paper, the navigation theme, the
 * gesture root, and the keyboard provider (react-native-keyboard-controller is
 * mocked globally in `jest.setup.ts`).
 *
 * Async like RNTL 14's `render` — `await` it.
 */
export async function renderWithProviders(
  ui: React.ReactElement,
  { store, authed = false }: RenderWithProvidersOptions = {},
) {
  const testStore =
    store ?? makeTestStore(authed ? { auth: { token: TEST_TOKEN } } : {});

  const result = await render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <ReduxProvider store={testStore}>
        <ThemeProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <Theme name="light">
              <PortalProvider>
                {/* Contractor only: app/(contractor)/(tabs)/_layout.tsx
                    provides it and the Open Jobs filter sheet asks it to
                    hide the tab bar. The client app has no such context. */}
                <TabBarVisibilityProvider>{ui}</TabBarVisibilityProvider>
              </PortalProvider>
            </Theme>
          </TamaguiProvider>
        </ThemeProvider>
      </ReduxProvider>
    </SafeAreaProvider>,
  );

  return { ...result, store: testStore };
}
