import LoginScreen from '@/src/screens/Auth/LoginScreen';
import { router } from 'expo-router';
import React from 'react';

export default function LoginRoute() {
  return <LoginScreen onGoToSignup={() => router.push('/auth/signup' as any)} />;
}
