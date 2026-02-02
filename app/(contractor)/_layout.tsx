import { Stack } from "expo-router";
import React from "react";

export default function ContractorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="balance" />
      <Stack.Screen name="jobs/[id]" />
      <Stack.Screen name="offer-chat/[offerId]" />
    </Stack>
  );
}
