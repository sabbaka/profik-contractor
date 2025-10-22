import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ContractorNavigator from '../src/navigation/ContractorNavigator';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import type { RootState } from '../src/store';
import { loadTokenFromStorage } from '../src/store/authSlice';

export default function Index() {
  const dispatch = useDispatch();
  const { token, loading } = useSelector((s: RootState) => s.auth);

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

  return <ContractorNavigator />;
}
