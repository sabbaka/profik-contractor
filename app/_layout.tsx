import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useState } from 'react';
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
import LoginScreen from '../src/screens/Auth/LoginScreen';
import SignupScreen from '../src/screens/Auth/SignupScreen';
import tamaguiConfig from '../tamagui.config';

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { token, loading } = useAppSelector((s) => s.auth);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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
  if (!token) {
    if (mode === 'signup') {
      return <SignupScreen onGoToLogin={() => setMode('login')} />;
    }
    return <LoginScreen onGoToSignup={() => setMode('signup')} />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <PaperProvider>
            <TamaguiProvider config={tamaguiConfig}>
              <PortalProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <AuthGate>
                    <Slot />
                  </AuthGate>
                  <StatusBar style="dark" />
                </ThemeProvider>
              </PortalProvider>
            </TamaguiProvider>
          </PaperProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
