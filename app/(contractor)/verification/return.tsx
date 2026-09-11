import { useIdentityVerification } from "@/src/features/verification/hooks/useIdentityVerification";
import { useThemeColors } from "@/src/theme";
import { Text } from "@/src/components/ui/ui";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Spinner, YStack } from "tamagui";

/**
 * Where the browser hands control back after the hosted verification flow.
 *
 * The backend redirects here through a constant deep link rather than sending
 * the provider's own query string on, so this screen learns nothing it can
 * trust — it asks the server to reconcile and then gets out of the way.
 *
 * The screen exists at all because without a route file the deep link falls
 * through to the catch-all and shows "Not found". It is not the only path back:
 * someone who returns through the app switcher is reconciled by the hook's
 * AppState listener instead.
 */
export default function VerificationReturnRoute() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { reconcile } = useIdentityVerification();

  useEffect(() => {
    let cancelled = false;

    void reconcile().finally(() => {
      if (cancelled) return;
      // replace, not push: this screen is a hand-off, and Back from the profile
      // should not land on it.
      router.replace("/(contractor)/verification");
    });

    return () => {
      cancelled = true;
    };
  }, [reconcile]);

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap={12}
      backgroundColor={colors.bgSecondary}
    >
      <Spinner color={colors.accent} />
      <Text variant="bodySm">{t("verification.checking")}</Text>
    </YStack>
  );
}
