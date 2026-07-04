import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef, useEffect } from "react";
import {
  ActivityIndicator as RNActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
} from "react-native";
import { Input, styled, Text as TextElement, XStack, YStack } from "tamagui";
import { useThemeColors } from "@/src/theme";

export const Text = styled(TextElement, {
  color: "$textPrimary",
  fontFamily: "Inter_400Regular",
  variants: {
    variant: {
      display: { fontFamily: "Geist_700Bold", fontSize: 32, lineHeight: 38, color: "$textPrimary" },
      h1: { fontFamily: "Geist_700Bold", fontSize: 28, lineHeight: 34, color: "$textPrimary" },
      h2: { fontFamily: "Geist_700Bold", fontSize: 24, lineHeight: 30, color: "$textPrimary" },
      h3: { fontFamily: "Geist_700Bold", fontSize: 22, lineHeight: 28, color: "$textPrimary" },
      h4: { fontFamily: "Geist_600SemiBold", fontSize: 20, lineHeight: 26, color: "$textPrimary" },
      h5: { fontFamily: "Geist_600SemiBold", fontSize: 18, lineHeight: 24, color: "$textPrimary" },
      cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 22, color: "$textPrimary" },
      bodyStrong: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 20, color: "$textPrimary" },
      body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, color: "$textSecondary" },
      bodySm: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, color: "$textSecondary" },
      caption: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, color: "$textSecondary" },
      sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 18, color: "$textMuted" },
      chip: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 16, color: "$textSecondary" },
      micro: { fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 14 },
      price: { fontFamily: "GeistMono_700Bold", fontSize: 17, lineHeight: 22, color: "$textPrimary" },
      priceLg: { fontFamily: "GeistMono_700Bold", fontSize: 22, lineHeight: 28, color: "$textPrimary" },
      priceXl: { fontFamily: "GeistMono_700Bold", fontSize: 24, lineHeight: 30, color: "$textPrimary" },
      titleLarge: { fontFamily: "Geist_700Bold", fontSize: 28, lineHeight: 34 },
      titleMedium: { fontFamily: "Geist_600SemiBold", fontSize: 18, lineHeight: 24 },
      headlineSmall: { fontFamily: "Geist_700Bold", fontSize: 24, lineHeight: 30 },
      bodyLarge: { fontFamily: "Inter_400Regular", fontSize: 16 },
      bodyMedium: { fontFamily: "Inter_400Regular", fontSize: 14 },
    },
    weight: {
      normal: { fontFamily: "Inter_400Regular" },
      medium: { fontFamily: "Inter_500Medium" },
      semibold: { fontFamily: "Inter_600SemiBold" },
      bold: { fontFamily: "Inter_700Bold" },
    },
    large: { true: { fontSize: 22, fontFamily: "Geist_700Bold" } },
  } as const,
  defaultVariants: { variant: "body" },
});

type ButtonVariant = "primary" | "primaryDisabled" | "secondary" | "soft" | "ghost" | "white" | "bordered" | "outlined" | "contained";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: "lg" | "md" | "sm";
  fullWidth?: boolean;
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const buttonSizes = {
  lg: { height: 56, padding: 24, font: 17 },
  md: { height: 44, padding: 20, font: 15 },
  sm: { height: 36, padding: 16, font: 13 },
};

export const Button = forwardRef<any, ButtonProps>(function Button(
  { variant = "primary", loading, disabled, size = "lg", fullWidth = true, children, iconLeft, iconRight, ...props },
  ref,
) {
  const dims = buttonSizes[size];
  const isPrimary = variant === "primary" || variant === "contained";
  const isDisabled = disabled || loading || variant === "primaryDisabled";
  const base = {
    height: dims.height,
    paddingHorizontal: dims.padding,
    borderRadius: 9999,
    width: fullWidth ? ("100%" as const) : ("auto" as const),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    overflow: "hidden" as const,
  };

  const content = (
    <XStack alignItems="center" justifyContent="center" gap={8}>
      {loading ? <RNActivityIndicator color={isPrimary ? "#FFFFFF" : "#FF6C00"} /> : (
        <>
          {iconLeft}
          {typeof children === "string" ? (
            <Text style={{
              color: isPrimary && !isDisabled ? "#FFFFFF" : variant === "white" || variant === "soft" || variant === "ghost" ? "#FF6C00" : "#6B7280",
              fontSize: dims.font,
              lineHeight: dims.font + 4,
              fontFamily: "Inter_600SemiBold",
            }}>{children}</Text>
          ) : children}
          {iconRight}
        </>
      )}
    </XStack>
  );

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        base,
        !isPrimary && {
          backgroundColor: variant === "soft" ? "#FFF4EB" : variant === "white" ? "#FFFFFF" : "transparent",
          borderWidth: variant === "secondary" || variant === "bordered" || variant === "outlined" ? 1.5 : 0,
          borderColor: "#E5E7EB",
        },
        isDisabled && { opacity: 0.55, backgroundColor: isPrimary ? "#E5E7EB" : undefined },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {isPrimary && !isDisabled ? (
        <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {content}
    </Pressable>
  );
});

export const TextInput = styled(Input, {
  height: 52,
  paddingHorizontal: 16,
  borderRadius: 12,
  borderWidth: 0,
  backgroundColor: "$surfaceInput",
  fontSize: 15,
  fontFamily: "Inter_400Regular",
  color: "$textPrimary",
  placeholderTextColor: "$textMuted",
});

export const Card = styled(YStack, {
  backgroundColor: "$bgCard",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "$borderSubtle",
});

export const ActivityIndicator = RNActivityIndicator;

export function Snackbar({ visible, onDismiss, duration = 3000, children }: { visible: boolean; onDismiss: () => void; duration?: number; children: React.ReactNode }) {
  const colors = useThemeColors();
  useEffect(() => {
    if (!visible || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);
  if (!visible) return null;
  return (
    <YStack position="absolute" bottom={20} left={20} right={20} backgroundColor={colors.bgCard} padding={16} borderRadius={16} borderWidth={1} borderColor={colors.border} zIndex={9999}>
      <Text variant="bodyStrong">{children}</Text>
    </YStack>
  );
}
