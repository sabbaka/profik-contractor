import { Redirect, Slot, useSegments } from 'expo-router';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium, GeistMono_700Bold } from '@expo-google-fonts/geist-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { ThemeProvider, useThemeColors, useThemeMode } from '@/src/theme';
import { setupGlobalErrorHandlers } from '@/src/utils/setupGlobalErrorHandlers';
import { PortalProvider } from '@tamagui/portal';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { store } from '../src/store';
import { loadTokenFromStorage } from '../src/store/authSlice';
import { useAppSelector } from '../src/store/hooks';
import tamaguiConfig from '../tamagui.config';

// Wire up global JS error / unhandled-rejection handlers as early as possible,
// before any feature code runs.
setupGlobalErrorHandlers();

function PaperThemeProvider({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const { mode } = useThemeMode();
  const baseTheme = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
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

  usePushNotifications(!!token);

  useEffect(() => {
    // @ts-ignore hydrate token on app start
    dispatch(loadTokenFromStorage());
  }, [dispatch]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgPrimary,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isAuthRoute = segments[0] === 'auth';

  if (!token && !isAuthRoute) {
    return <Redirect href={"/auth/login" as any} />;
  }
  return <>{children}</>;
}

function ThemedApp() {
  const { mode } = useThemeMode();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={mode}>
      <PaperThemeProvider>
        <PortalProvider>
          <ErrorBoundary context="root">
            <AuthGate>
              <Slot />
            </AuthGate>
          </ErrorBoundary>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        </PortalProvider>
      </PaperThemeProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_500Medium,
    GeistMono_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <ThemeProvider defaultMode="light">
            <ThemedApp />
          </ThemeProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
