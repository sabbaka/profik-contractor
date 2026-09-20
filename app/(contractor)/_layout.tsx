import { useThemeColors } from "@/src/theme";
import { Stack } from "expo-router";
import React from "react";

/**
 * The colour behind the navigator, not just behind each screen.
 *
 * `react-native-screens` defaults its container to the system white. Every
 * screen here paints its own background, so that default is invisible until
 * two screens are on screen at once — an interactive swipe back, or a tab
 * change — and then the gap between them flashes white through a dark app.
 * Read from the theme rather than written as a token string: it has to follow
 * an appearance switch made while the navigator is already mounted.
 */
export default function ContractorLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
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
