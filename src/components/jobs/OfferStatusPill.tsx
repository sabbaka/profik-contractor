import type { JobStatus, OfferStatus } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

interface OfferStatusPillProps {
  /** Offer status as the API reports it; anything unknown reads as pending. */
  status: OfferStatus | string;
  /**
   * Status of the job the offer is on, where the caller has it. Without it the
   * pill can only speak for the offer — see the note above the component.
   */
  jobStatus?: JobStatus | string | null;
  /** `sm` is for tight rows such as the chat's job strip. */
  size?: "sm" | "md";
}

/**
 * Where a piece of work stands, from the contractor's side.
 *
 * Reads the offer *and* the job, because neither alone is the answer: an
 * accepted offer stays accepted after the client marks the job done, so a pill
 * driven by the offer told a contractor "Accepted" about work they had already
 * finished. The job is checked first, since cancelling one leaves its offers
 * untouched — the same order, and the same table, as the server's `bucketOf`.
 *
 * `jobStatus` is optional so a caller that genuinely does not have the job — a
 * chat opened from a push notification carries only an offer id — degrades to
 * the offer-only reading rather than showing nothing.
 *
 * Shared by the job card, the job detail screen and the chat's job strip so
 * the same work never shows two different states in two places.
 */
export function OfferStatusPill({
  status,
  jobStatus,
  size = "md",
}: OfferStatusPillProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const config =
    jobStatus === "canceled"
      ? {
          bg: colors.statusCancelled,
          text: colors.statusCancelledText,
          label: t("job.status.canceled"),
        }
      : status === "declined"
        ? {
            bg: colors.statusCancelled,
            text: colors.statusCancelledText,
            label: t("job.status.declined"),
          }
        : status === "accepted" && jobStatus === "in_progress"
          ? {
              bg: colors.statusOpen,
              text: colors.statusOpenText,
              label: t("job.status.in_progress"),
            }
          : status === "accepted" && jobStatus === "completed"
            ? {
                bg: colors.statusCompleted,
                text: colors.statusCompletedText,
                label: t("job.status.completed"),
              }
            : status === "accepted"
              ? {
                  bg: colors.statusCompleted,
                  text: colors.statusCompletedText,
                  label: t("job.status.accepted"),
                }
              : {
                  bg: colors.statusPending,
                  text: colors.statusPendingText,
                  label: t("job.status.pending"),
                };

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
