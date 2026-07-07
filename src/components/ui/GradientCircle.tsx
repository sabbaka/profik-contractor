import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { YStack } from "tamagui";

interface GradientCircleProps {
  size?: number;
  radius?: number;
  children?: React.ReactNode;
  /** Alternative gradient (e.g. avatar). Defaults to brand orange. */
  colors?: readonly [string, string, ...string[]];
}

/**
 * Rounded gradient container (used for the title icon on Login/SignUp,
 * user avatars, "check confirmed" hero, etc.).
 */
export function GradientCircle({
  size = 56,
  radius,
  children,
  colors = ["#FF8A2B", "#E85D00"] as const,
}: GradientCircleProps) {
  const r = radius ?? Math.min(16, size / 2);
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={r === size / 2 ? 9999 : r}
      ai="center"
      jc="center"
      overflow="hidden"
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </YStack>
  );
}

/** Avatar with a subtle gradient background (for user pictures / initials). */
export function AvatarCircle({
  size = 44,
  children,
  colors,
}: {
  size?: number;
  initials?: string;
  children?: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
}) {
  return (
    <GradientCircle
      size={size}
      radius={9999}
      colors={colors ?? (["#FF8A2B", "#E85D00"] as const)}
    >
      {children}
    </GradientCircle>
  );
}

export default GradientCircle;
