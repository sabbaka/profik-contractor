import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { CircleAlert } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";
import { OFFER_COST_CZK } from "./offerPricing";

interface OfferBalanceWarningProps {
  balance: number;
}

/**
 * Replaces `OfferCostNote` when the balance will not cover an offer.
 *
 * A separate block rather than a red variant of the price note: this is a
 * blocker, not a price list, and advertising the discount to someone who
 * cannot pay reads as a taunt. The two amounts stay together on one line
 * because the comparison *is* the message.
 */
export function OfferBalanceWarning({ balance }: OfferBalanceWarningProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <XStack
      backgroundColor={colors.dangerBg}
      borderRadius={12}
      paddingVertical={10}
      paddingHorizontal={12}
      gap={10}
      alignItems="center"
    >
      <CircleAlert size={16} color={colors.dangerStrong} />
      <YStack flex={1} gap={3}>
        <Text
          style={{
            color: colors.dangerStrong,
            fontFamily: "Inter_600SemiBold",
            fontSize: 12,
            lineHeight: 16,
          }}
        >
          {t("offer.balance.title")}
        </Text>
        <Text
          style={{
            color: colors.dangerStrong,
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            lineHeight: 15,
          }}
        >
          {t("offer.balance.body", {
            price: formatCzk(OFFER_COST_CZK),
            balance: formatCzk(balance),
          })}
        </Text>
      </YStack>
    </XStack>
  );
}
