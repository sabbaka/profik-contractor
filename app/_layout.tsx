import { Redirect, Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '@/src/theme';
import { PortalProvider } from '@tamagui/portal';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { store } from '../src/store';
import { loadTokenFromStorage } from '../src/store/authSlice';
import { useAppSelector } from '../src/store/hooks';
import tamaguiConfig from '../tamagui.config';

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.accent,
    secondary: colors.accentGradientEnd,
    tertiary: colors.accentLight,
    surface: colors.bgCard,
    background: colors.bgPrimary,
    onSurface: colors.textPrimary,
    onBackground: colors.textPrimary,
    outline: colors.border,
  },
} as const;

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { token, loading } = useAppSelector((s) => s.auth);
  const segments = useSegments() as unknown as string[];
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <PaperProvider theme={paperTheme}>
            <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
              <PortalProvider>
                <AuthGate>
                  <Slot />
                </AuthGate>
                <StatusBar style="light" />
              </PortalProvider>
            </TamaguiProvider>
          </PaperProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
