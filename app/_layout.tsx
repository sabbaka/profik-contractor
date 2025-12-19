import { Redirect, Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch } from 'react-redux';
import { PortalProvider } from '@tamagui/portal';
import { TamaguiProvider } from 'tamagui';
import { store } from '../src/store';
import { useAppSelector } from '../src/store/hooks';
import { loadTokenFromStorage } from '../src/store/authSlice';
import tamaguiConfig from '../tamagui.config';

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
          <PaperProvider>
            <TamaguiProvider config={tamaguiConfig}>
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
