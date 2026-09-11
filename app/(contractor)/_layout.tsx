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
      <Stack.Screen name="verification/index" />
      {/* Without this the profikcontractor:// deep link falls through to the
          catch-all and shows "Not found". */}
      <Stack.Screen name="verification/return" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/privacy-policy" />
      <Stack.Screen name="profile/help-support" />
      <Stack.Screen name="profile/about" />
    </Stack>
  );
}
