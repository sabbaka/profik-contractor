import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { store } from '../src/store';
import { useAppSelector } from '../src/store/hooks';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loadTokenFromStorage } from '../src/store/authSlice';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../src/screens/Auth/LoginScreen';

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { token, loading } = useAppSelector((s) => s.auth);
  useEffect(() => {
    // @ts-ignore hydrate token on app start
    dispatch(loadTokenFromStorage());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!token) {
    return <LoginScreen />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            <Slot />
          </AuthGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}
