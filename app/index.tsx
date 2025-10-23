import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { Redirect } from 'expo-router';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import { loadTokenFromStorage } from '../src/store/authSlice';
import { useAppSelector } from '../src/store/hooks';

export default function Index() {
  const dispatch = useDispatch();
  const { token, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // hydrate token on app start
    // @ts-ignore
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
  return <Redirect href="/(contractor)/open" />;
}
