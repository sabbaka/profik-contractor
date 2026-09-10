import type { PaymentHistoryItem, PaymentStatus } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BriefcaseBusiness,
} from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

interface PaymentHistoryRowProps {
  entry: PaymentHistoryItem;
}

/**
 * One line of the balance history: what moved, how much, when, and — for a
 * fee spent on an offer — which job.
 *
 * The icon reads the *direction* of the movement (money in vs money out)
 * rather than a distinct icon per `type`. A ledger is scanned for "did this
 * add or take away" first and the exact reason second, which the label
 * already states — five different icons would each answer a question the
 * reader is asking second, not first.
 */
export function PaymentHistoryRow({ entry }: PaymentHistoryRowProps) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const credit = entry.amount > 0;
  const typeLabel = t(`balance.history.type.${typeKey(entry.type)}`);
  const dateLabel = new Date(entry.createdAt).toLocaleDateString(
    i18n.language,
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <XStack paddingVertical={14} paddingHorizontal={16} gap={12}>
      <YStack
        width={40}
        height={40}
        borderRadius={9999}
        alignItems="center"
        justifyContent="center"
        backgroundColor={credit ? colors.greenSoftBg : colors.surfaceInput}
      >
        {credit ? (
          <ArrowDownLeft size={18} color={colors.greenStrong} />
        ) : (
          <ArrowUpRight size={18} color={colors.textSecondary} />
        )}
      </YStack>

      <YStack flex={1} gap={3}>
        <XStack alignItems="center" gap={8}>
          <Text
            flex={1}
            numberOfLines={1}
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
              lineHeight: 20,
            }}
          >
            {typeLabel}
          </Text>
          <Text
            style={{
              color: credit ? colors.greenStrong : colors.textPrimary,
              fontFamily: "GeistMono_700Bold",
              fontSize: 15,
              lineHeight: 20,
            }}
          >
            {credit ? "+" : ""}
            {formatCzk(entry.amount)}
          </Text>
        </XStack>

        <XStack alignItems="center" gap={8}>
          <Text variant="caption" style={{ flex: 1 }}>
            {dateLabel}
          </Text>
          {entry.status !== "completed" ? (
            <StatusPill status={entry.status} />
          ) : null}
        </XStack>

        {entry.job ? (
          <XStack alignItems="center" gap={5} marginTop={1}>
            <BriefcaseBusiness size={11} color={colors.textMuted} />
            <Text
              flex={1}
              numberOfLines={1}
              style={{
                color: colors.textMuted,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              {entry.job.title}
            </Text>
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  );
}

/**
 * `job` is an older name for the same movement `offer_fee` now carries — see
 * the note on `PaymentType`. Neither invents its own copy.
 */
function typeKey(type: PaymentHistoryItem["type"]): string {
  if (type === "job") return "offerFee";
  return type === "offer_fee" ? "offerFee" : toCamel(type);
}

function toCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Completed entries — the overwhelming majority — carry no pill at all. */
function StatusPill({
  status,
}: {
  status: Exclude<PaymentStatus, "completed">;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const config =
    status === "failed"
      ? { bg: colors.dangerBg, text: colors.dangerStrong }
      : { bg: colors.statusPending, text: colors.statusPendingText };

  return (
    <XStack
      backgroundColor={config.bg}
      paddingHorizontal={8}
      paddingVertical={3}
      borderRadius={9999}
      alignItems="center"
      gap={4}
    >
      <YStack
        width={5}
        height={5}
        borderRadius={9999}
        backgroundColor={config.text}
      />
      <Text
        style={{
          color: config.text,
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          lineHeight: 14,
        }}
      >
        {t(`balance.history.status.${status}`)}
      </Text>
    </XStack>
  );
}
