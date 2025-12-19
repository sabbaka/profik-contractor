import { Redirect, Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch } from 'react-redux';
import { PortalProvider } from '@tamagui/portal';
import { TamaguiProvider } from 'tamagui';
import { store } from '../src/store';
import { useAppSelector } from '../src/store/hooks';
import { loadTokenFromStorage } from '../src/store/authSlice';
import tamaguiConfig from '../tamagui.config';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#fa2a48',
    secondary: '#181818',
    tertiary: '#181818',
    surface: '#ffffff',
    background: '#ffffff',
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
          backgroundColor: '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Allow access to auth routes without token
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
            <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
              <PortalProvider>
                <AuthGate>
                  <Slot />
                </AuthGate>
                <StatusBar style="dark" />
              </PortalProvider>
            </TamaguiProvider>
          </PaperProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
