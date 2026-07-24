import { Button, Text } from "@/src/components/ui/ui";
import { buildJobDetailReturnTo } from "@/src/features/auth/authReturnTo";
import { useThemeColors } from "@/src/theme";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

/** Shown to guests in place of the offer section: browsing is free, making an offer needs an account. */
export const GuestOfferCta = ({ jobId }: { jobId: string }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const returnTo = buildJobDetailReturnTo(jobId);

  return (
    <YStack
      backgroundColor={colors.bgCard}
      borderRadius={24}
      borderWidth={1}
      borderColor={colors.borderSubtle}
      padding={20}
      gap={12}
    >
      <YStack gap={4}>
        <Text variant="cardTitle">{t("guest.signInToOffer")}</Text>
        <Text variant="body">{t("guest.signInToOfferBody")}</Text>
      </YStack>
      <Button
        variant="primary"
        onPress={() =>
          router.push({ pathname: "/auth/login", params: { returnTo } } as any)
        }
      >
        {t("guest.signIn")}
      </Button>
      <Button
        variant="ghost"
        onPress={() =>
          router.push({ pathname: "/auth/signup", params: { returnTo } } as any)
        }
      >
        {t("guest.createAccount")}
      </Button>
    </YStack>
  );
};
