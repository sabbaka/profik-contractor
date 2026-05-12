import { FormInput } from "@/src/components/form";
import {
  ActivityIndicator,
  Button,
  Snackbar,
  Text,
} from "@/src/components/ui/ui";
import { useTopupForm } from "@/src/features/balance/forms";
import { colors } from "@/src/theme";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Keyboard, Pressable, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export default function BalanceRoute() {
  const insets = useSafeAreaInsets();
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
        backgroundColor={colors.bgPrimary}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text marginTop="$3" color={colors.textSecondary}>Loading balance...</Text>
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
        backgroundColor={colors.bgPrimary}
      >
        <Text variant="titleMedium" marginBottom="$3">
          Failed to load balance
        </Text>
        <Button variant="bordered" onPress={refetchBalance}>Retry</Button>
      </YStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1} paddingTop={insets.top} backgroundColor={colors.bgPrimary}>
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$2"
          alignItems="center"
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <ArrowLeft size={28} color={colors.textPrimary} />
          </Pressable>
        </XStack>
        <YStack flex={1} padding="$4" gap="$4">
          <YStack gap="$2">
            <Text variant="titleLarge">Your Balance</Text>
            <Text variant="headlineSmall" marginTop="$2" color={colors.accent}>
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
            <Text fontSize={14} color={colors.textMuted} marginTop="$2">
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

const styles = StyleSheet.create({
  backButton: {
    padding: 4,
  },
});
