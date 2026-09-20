import {
  DarkTheme,
  DefaultTheme,
  Redirect,
  Slot,
  ThemeProvider as NavigationThemeProvider,
  useSegments,
} from "expo-router";
import {
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
} from "@expo-google-fonts/inter-tight";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import "../src/i18n";
import "react-native-reanimated";

import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";
import { isGuestAccessibleRoute } from "@/src/features/auth/guestRoutes";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { ThemeProvider, useThemeColors, useThemeMode } from "@/src/theme";
import {
  getHasSeenOnboarding,
  subscribeToOnboardingState,
} from "@/src/utils/onboardingStorage";
import { setupGlobalErrorHandlers } from "@/src/utils/setupGlobalErrorHandlers";
import { PortalProvider } from "@tamagui/portal";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import * as Sentry from "@sentry/react-native";
import { TamaguiProvider, Theme } from "tamagui";
import { store } from "../src/store";
import { loadTokenFromStorage } from "../src/store/authSlice";
import { useAppSelector } from "../src/store/hooks";
import tamaguiConfig from "../tamagui.config";

// Crash reporting. Without EXPO_PUBLIC_SENTRY_DSN (e.g. local dev) this is a
// no-op, so the app runs fine before the Sentry project exists.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
});

// Wire up global JS error / unhandled-rejection handlers as early as possible,
// before any feature code runs.
setupGlobalErrorHandlers();

// Hold the native splash until fonts are ready. Without this the splash hides
// immediately and the user stares at a blank screen while Inter/Inter Tight
// load.
SplashScreen.preventAutoHideAsync().catch(() => {});

function PaperThemeProvider({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const { mode } = useThemeMode();
  const baseTheme = mode === "dark" ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      secondary: colors.accentGradientEnd,
      surface: colors.bgCard,
      background: colors.bgPrimary,
      onSurface: colors.textPrimary,
      onBackground: colors.textPrimary,
      outline: colors.border,
    },
  } as const;
  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { token, loading } = useAppSelector((s) => s.auth);
  const segments = useSegments() as unknown as string[];
  const colors = useThemeColors();
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState<
    boolean | null
  >(null);

  usePushNotifications(token);

  // The native window sits behind every screen and is white by default, so
  // it shows in the rounded corners of a screen mid-transition no matter what
  // the navigators paint on top — painting `contentStyle`/`sceneStyle` alone
  // did not remove it. Follows the theme rather than a fixed colour so a dark
  // app on a light OS (or the reverse) is not white either.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bgPrimary).catch(() => {});
  }, [colors.bgPrimary]);

  useEffect(() => {
    // @ts-ignore hydrate token on app start
    dispatch(loadTokenFromStorage());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToOnboardingState((value) => {
      if (mounted) setHasSeenOnboardingState(value);
    });

    getHasSeenOnboarding()
      .then((value) => {
        if (mounted) {
          setHasSeenOnboardingState(value);
        }
      })
      .catch(() => {
        if (mounted) {
          setHasSeenOnboardingState(false);
        }
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (loading || hasSeenOnboarding === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgPrimary,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isAuthRoute = segments[0] === "auth";
  const isOnboardingRoute = segments[0] === "onboarding";

  if (!token && !isAuthRoute && !isOnboardingRoute) {
    if (!hasSeenOnboarding) {
      return <Redirect href={"/onboarding" as any} />;
    }

    if (!isGuestAccessibleRoute(segments)) {
      return <Redirect href={"/(contractor)/(tabs)/open" as any} />;
    }
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {children}
    </View>
  );
}

/**
 * Hands the navigators the app's own palette. Without a navigation theme they
 * fall back to the built-in light one — a pale grey ground that no screen ever
 * paints, but that the navigator containers do, so it shows through in the
 * rounded corners of a screen mid-push or mid-swipe-back on a dark app. Imported
 * from `expo-router`, not `@react-navigation/native`: since SDK 56 the router
 * refuses to bundle a direct react-navigation import. Kept apart from
 * `ThemedApp` because it has to sit *inside* `<Theme>` to read the colours the
 * user's appearance choice resolves to.
 */
function NavigationTheme({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const colors = useThemeColors();
  const base = mode === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.bgPrimary,
          card: colors.bgPrimary,
          border: colors.borderSubtle,
          text: colors.textPrimary,
          primary: colors.accent,
        },
      }}
    >
      {children}
    </NavigationThemeProvider>
  );
}

function ThemedApp() {
  const { mode } = useThemeMode();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={mode}>
      {/* `defaultTheme` only seeds the initial theme. The explicit <Theme>
          wrapper is what re-themes the tree when the user switches
          appearance at runtime. */}
      <Theme name={mode}>
        <PaperThemeProvider>
          <PortalProvider>
            <ErrorBoundary context="root">
              <NavigationTheme>
                <AuthGate>
                  <Slot />
                </AuthGate>
              </NavigationTheme>
            </ErrorBoundary>
            <StatusBar style={mode === "dark" ? "light" : "dark"} />
          </PortalProvider>
        </PaperThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}

export default Sentry.wrap(RootLayout);

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Above AuthGate on purpose: AuthGate returns an early <View> while it
            hydrates, and a provider below it would tear its native view down
            and rebuild it on every launch. Above PortalProvider too, so modal
            Sheets stay inside the keyboard context. Takes no props — it reads
            edge-to-edge from the platform and warns if you pass it in. */}
        <KeyboardProvider>
          <ReduxProvider store={store}>
            <ThemeProvider>
              <ThemedApp />
            </ThemeProvider>
          </ReduxProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
