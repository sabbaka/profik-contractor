import { useMeQuery } from "@/src/api/profikApi";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import {
  OFFER_COST_CZK,
  OFFER_DISCOUNT_PERCENT,
  OFFER_FULL_COST_CZK,
  OFFER_HAS_DISCOUNT,
} from "./offerPricing";
import { Coins } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

/**
 * The price of sending an offer, shown above the buttons that send one.
 *
 * The job's own price is deliberately absent: the two amounts are the thing
 * contractors confuse — "2 400 Kč" on an orange button reads as the sum being
 * charged. This block carries the only number that leaves the balance, with
 * the balance itself on its own line below a divider so a ledger figure is not
 * mistaken for part of the price.
 */
export function OfferCostNote() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { data: me } = useMeQuery();

  return (
    <YStack
      backgroundColor={colors.accentLight}
      borderRadius={14}
      paddingVertical={12}
      paddingHorizontal={14}
      gap={10}
    >
      <XStack gap={10} alignItems="center">
        <Coins size={18} color={colors.accent} />
        <YStack flex={1} gap={2}>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: "Inter_500Medium",
              fontSize: 11,
              lineHeight: 15,
            }}
          >
            {t("offer.cost.label")}
          </Text>
          <XStack gap={8} alignItems="center">
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: "GeistMono_700Bold",
                fontSize: 18,
                lineHeight: 23,
              }}
            >
              {formatCzk(OFFER_COST_CZK)}
            </Text>
            {OFFER_HAS_DISCOUNT ? (
              <>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontFamily: "GeistMono_500Medium",
                    fontSize: 12,
                    lineHeight: 17,
                    textDecorationLine: "line-through",
                  }}
                >
                  {formatCzk(OFFER_FULL_COST_CZK)}
                </Text>
                <XStack
                  backgroundColor={colors.accent}
                  borderRadius={9999}
                  paddingHorizontal={8}
                  paddingVertical={3}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "Inter_700Bold",
                      fontSize: 10,
                      lineHeight: 14,
                    }}
                  >
                    {t("offer.cost.discount", { percent: OFFER_DISCOUNT_PERCENT })}
                  </Text>
                </XStack>
              </>
            ) : null}
          </XStack>
        </YStack>
      </XStack>

      {/* Brand orange at 15%: the divider has to read on `accentLight` in both
          themes, and a neutral border token disappears against it. */}
      <YStack height={1} backgroundColor="#FF6C0026" />

      <XStack justifyContent="space-between" alignItems="center" gap={8}>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          {t("offer.cost.balance")}
        </Text>
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: "GeistMono_700Bold",
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          {formatCzk(me?.balance ?? 0)}
        </Text>
      </XStack>
    </YStack>
  );
}
