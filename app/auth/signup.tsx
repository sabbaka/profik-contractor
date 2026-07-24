import { normalizeAuthReturnTo } from '@/src/features/auth/authReturnTo';
import SignupScreen from '@/src/screens/Auth/SignupScreen';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function SignupRoute() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = normalizeAuthReturnTo(params.returnTo);

  return (
    <SignupScreen
      returnTo={returnTo}
      onGoToLogin={() =>
        router.push({ pathname: '/auth/login', params: { returnTo } } as any)
      }
    />
  );
}
