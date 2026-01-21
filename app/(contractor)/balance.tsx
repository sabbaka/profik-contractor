import { FormInput } from "@/src/components/form";
import {
  ActivityIndicator,
  Button,
  Snackbar,
  Text,
} from "@/src/components/ui/ui";
import { useTopupForm } from "@/src/features/balance/forms";
import React, { useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { YStack } from "tamagui";

export default function BalanceRoute() {
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const { form, isLoading, balance, isBalanceLoading, refetchBalance, submit } =
    useTopupForm({
      onSuccess: (balanceUpdated, newBalance) => {
        if (balanceUpdated && newBalance !== undefined) {
          setSnackbarMsg(
            `Balance updated: ${new Intl.NumberFormat("cs-CZ", {
              style: "currency",
              currency: "CZK",
            }).format(newBalance)}`
          );
          setSnackbarVisible(true);
        }
      },
    });

    const { control } = form;

  if (isBalanceLoading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$4"
      >
        <ActivityIndicator size="large" color="$gray10" />
        <Text marginTop="$3">Loading balance...</Text>
      </YStack>
    );
  }

  if (balance === undefined) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$4"
      >
        <Text variant="titleMedium" marginBottom="$3">
          ❌ Failed to load balance
        </Text>
        <Button onPress={refetchBalance}>Retry</Button>
      </YStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1}>
        <YStack flex={1} padding="$4" gap="$4">
          <YStack gap="$2">
            <Text variant="titleLarge">Your Balance</Text>
            <Text variant="headlineSmall" marginTop="$2">
              {new Intl.NumberFormat("cs-CZ", {
                style: "currency",
                currency: "CZK",
              }).format(balance)}
            </Text>
          </YStack>
          <YStack gap="$3">
            <FormInput
            flex={0}
              control={control}
              name="amount"
              placeholder="Top-up amount (CZK)"
              keyboardType="numeric"
            />
            <Button
              variant="primary"
              onPress={submit}
              disabled={isLoading}
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? "Processing..." : "Top Up"}
            </Button>
            <Text fontSize={14} color="$gray10" marginTop="$2">
              You&apos;ll complete payment in a secure web view and return to
              the app automatically.
            </Text>
          </YStack>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
          >
            {snackbarMsg}
          </Snackbar>
        </YStack>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
