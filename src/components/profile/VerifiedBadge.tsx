import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { BadgeCheck } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

interface VerifiedBadgeProps {
  /** `icon` drops the words, for rows that are already full. */
  variant?: "full" | "icon";
  size?: "sm" | "md";
}

/**
 * "Identity verified" — shown only for an approved, unlapsed verification.
 *
 * Its own component rather than a case in `OfferStatusPill`: that pill speaks
 * for where a piece of work stands, and this says something about a person. It
 * is also icon-led where the pill is dot-led, so sharing one would mean
 * threading an icon prop through a component that has no other use for it.
 *
 * Reads colours through `useThemeColors()` rather than `"$token"` props, for
 * the staleness reason documented in `.claude/rules/components.md`.
 */
export function VerifiedBadge({
  variant = "full",
  size = "md",
}: VerifiedBadgeProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const small = size === "sm";
  const glyph = small ? 13 : 15;

  if (variant === "icon") {
    return (
      <BadgeCheck
        size={glyph}
        color={colors.greenStrong}
        accessibilityLabel={t("a11y.verifiedIdentity")}
      />
    );
  }

  return (
    <XStack
      backgroundColor={colors.greenSoftBg}
      paddingHorizontal={small ? 8 : 10}
      paddingVertical={small ? 3 : 5}
      borderRadius={9999}
      alignItems="center"
      gap={small ? 4 : 5}
      accessibilityLabel={t("a11y.verifiedIdentity")}
    >
      <BadgeCheck size={glyph} color={colors.greenStrong} />
      <Text
        style={{
          color: colors.greenStrong,
          fontFamily: "Inter_600SemiBold",
          fontSize: small ? 10 : 11,
          lineHeight: small ? 14 : 15,
        }}
      >
        {t("verification.badge")}
      </Text>
    </XStack>
  );
}
