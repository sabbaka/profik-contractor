import { useThemeColors } from "@/src/theme";
import { Stack } from "expo-router";

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
export default function OnboardingLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
      }}
    />
  );
}
