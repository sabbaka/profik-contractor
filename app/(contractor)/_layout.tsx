import React from 'react';
import { Stack } from 'expo-router';

export default function ContractorLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="jobs/[id]" options={{ title: 'Job Details' }} />
    </Stack>
  );
}
