import { normalizeAuthReturnTo } from '@/src/features/auth/authReturnTo';
import LoginScreen from '@/src/screens/Auth/LoginScreen';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function LoginRoute() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = normalizeAuthReturnTo(params.returnTo);

  return (
    <LoginScreen
      returnTo={returnTo}
      onGoToSignup={() =>
        router.push({ pathname: '/auth/signup', params: { returnTo } } as any)
      }
    />
  );
}
