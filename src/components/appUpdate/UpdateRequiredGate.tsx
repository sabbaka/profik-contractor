import React from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { useGetAppConfigQuery } from "@/src/api/profikApi";
import { ProfikLogo } from "@/src/components/ui/ProfikLogo";
import { Button, Text } from "@/src/components/ui/ui";
import { logError } from "@/src/utils/logger";

import { STORE_URL, updateRequired } from "@/src/features/appUpdate/appBuild";

/**
 * Stops a version the backend no longer supports: instead of the app, one
 * screen that says so and a button to the store. It cannot be dismissed —
 * the point is a build that must not keep running, because it is broken or
 * unsafe in a way an over-the-air update cannot reach.
 *
 * Sits above everything that talks to the API. It lets the app through
 * while the answer is loading and when the request fails: only a backend
 * that answered, and named a newer minimum, stops anyone. The minimum is
 * asked for again each time the app returns to the foreground, so it also
 * reaches an app that was already open when it was set.
 */
export function UpdateRequiredGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useGetAppConfigQuery(undefined, { refetchOnFocus: true });

  if (updateRequired(data)) return <UpdateRequiredScreen />;
  return <>{children}</>;
}

function UpdateRequiredScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const openStore = () => {
    Linking.openURL(STORE_URL).catch((error) =>
      logError(error, "updateRequired:openStore"),
    );
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$bgPrimary"
      paddingHorizontal={24}
      paddingTop={insets.top + 24}
      paddingBottom={insets.bottom + 24}
    >
      <YStack flex={1} ai="center" jc="center" gap={24}>
        <ProfikLogo />
        <YStack ai="center" gap={8}>
          <Text variant="display" textAlign="center">
            {t("updateRequired.title")}
          </Text>
          <Text variant="body" textAlign="center" style={{ maxWidth: 320 }}>
            {t("updateRequired.body")}
          </Text>
        </YStack>
      </YStack>
      <Button variant="primary" onPress={openStore}>
        {t("updateRequired.cta")}
      </Button>
    </YStack>
  );
}
