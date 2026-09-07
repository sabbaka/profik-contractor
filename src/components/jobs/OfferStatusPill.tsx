import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

interface OfferStatusPillProps {
  /** Offer status as the API reports it; anything unknown reads as pending. */
  status: string;
  /** `sm` is for tight rows such as the chat's job strip. */
  size?: "sm" | "md";
}

/**
 * Pending / accepted / declined state of the contractor's own offer.
 *
 * Shared by the job card and the chat's job strip so the same offer never
 * shows two different colours in two places.
 */
export function OfferStatusPill({ status, size = "md" }: OfferStatusPillProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const config =
    status === "accepted"
      ? { bg: colors.statusCompleted, text: colors.statusCompletedText, label: t("job.status.accepted") }
      : status === "declined"
        ? { bg: colors.statusCancelled, text: colors.statusCancelledText, label: t("job.status.declined") }
        : { bg: colors.statusPending, text: colors.statusPendingText, label: t("job.status.pending") };

  const small = size === "sm";

  return (
    <XStack
      backgroundColor={config.bg}
      paddingHorizontal={small ? 8 : 10}
      paddingVertical={small ? 3 : 5}
      borderRadius={9999}
      alignItems="center"
      gap={small ? 4 : 5}
    >
      <YStack
        width={small ? 5 : 6}
        height={small ? 5 : 6}
        borderRadius={9999}
        backgroundColor={config.text}
      />
      <Text
        style={{
          color: config.text,
          fontFamily: "Inter_600SemiBold",
          fontSize: small ? 10 : 11,
          lineHeight: small ? 14 : 15,
        }}
      >
        {config.label}
      </Text>
    </XStack>
  );
}
