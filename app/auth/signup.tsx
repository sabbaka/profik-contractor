import SignupScreen from '@/src/screens/Auth/SignupScreen';
import { router } from 'expo-router';
import React from 'react';

export default function SignupRoute() {
  return <SignupScreen onGoToLogin={() => router.push('/auth/login' as any)} />;
}
