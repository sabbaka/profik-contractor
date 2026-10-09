import { ActivityIndicator, Button, Text } from "@/src/components/ui/ui";
import {
  useCreditPurchase,
  type CreditPurchaseResult,
} from "@/src/features/balance/hooks";
import { useThemeColors } from "@/src/theme";
import { formatCredits } from "@/src/utils/currency";
import { ShieldCheck } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

interface CreditPacksCardProps {
  /** Called once a purchase has settled, with whatever it came to. */
  onPurchased: (result: CreditPurchaseResult) => void;
}

/**
 * The iOS top-up: the App Store credit packs, cheapest first, each with its
 * StoreKit price. Takes the place of the Stripe amount form on the Balance
 * screen, which iOS never shows — App Review guideline 3.1.1 requires credits
 * to be sold through In-App Purchase, and the screen must not point to any
 * other way to pay.
 *
 * Without a RevenueCat key or a `credits` Offering it says buying is
 * unavailable rather than offering anything else. Driven by
 * `useCreditPurchase`.
 */
export function CreditPacksCard({ onPurchased }: CreditPacksCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { state, packs, purchasingId, reload, purchase } = useCreditPurchase();

  return (
    <YStack
      padding={20}
      borderRadius={20}
      backgroundColor={colors.bgCard}
      borderWidth={1}
      borderColor={colors.borderSubtle}
      gap={16}
    >
      <YStack gap={4}>
        <Text variant="h4">{t("balance.addFunds")}</Text>
        <Text variant="bodySm">{t("balance.iap.body")}</Text>
      </YStack>

      {state === "loading" ? (
        <XStack alignItems="center" gap={10} paddingVertical={8}>
          <ActivityIndicator color={colors.accent} />
          <Text variant="bodySm">{t("balance.iap.loading")}</Text>
        </XStack>
      ) : null}

      {state === "unavailable" ? (
        <Text variant="bodySm">{t("balance.iap.unavailable")}</Text>
      ) : null}

      {state === "failed" ? (
        <YStack gap={12} alignItems="flex-start">
          <Text variant="bodySm">{t("balance.iap.loadFailed")}</Text>
          <Button
            variant="secondary"
            size="md"
            fullWidth={false}
            onPress={reload}
          >
            {t("common.retry")}
          </Button>
        </YStack>
      ) : null}

      {state === "ready" ? (
        <YStack gap={10}>
          {packs.map((pack) => {
            const credits = formatCredits(pack.credits, t);
            return (
              <XStack
                key={pack.productId}
                alignItems="center"
                justifyContent="space-between"
                gap={12}
                padding={14}
                borderRadius={16}
                borderWidth={1}
                borderColor={colors.borderSubtle}
              >
                <Text variant="bodyStrong" flex={1}>
                  {credits}
                </Text>
                <Button
                  size="sm"
                  fullWidth={false}
                  loading={purchasingId === pack.productId}
                  disabled={purchasingId !== null}
                  accessibilityLabel={t("a11y.buyCredits", {
                    credits,
                    price: pack.priceString,
                  })}
                  onPress={async () => onPurchased(await purchase(pack))}
                >
                  {pack.priceString}
                </Button>
              </XStack>
            );
          })}
        </YStack>
      ) : null}

      <XStack alignItems="flex-start" gap={8}>
        <ShieldCheck size={16} color={colors.success} />
        <Text variant="caption" flex={1}>
          {t("balance.iap.secureBody")}
        </Text>
      </XStack>
    </YStack>
  );
}
