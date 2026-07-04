import { FormInput } from "@/src/components/form";
import { ActivityIndicator, Button, Snackbar, Text } from "@/src/components/ui/ui";
import { useTopupForm } from "@/src/features/balance/forms";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { ChevronLeft, ShieldCheck, WalletCards } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export default function BalanceRoute() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const { form, isLoading, balance, isBalanceLoading, refetchBalance, submit } = useTopupForm({
    onSuccess: (updated, next) => {
      if (updated && next !== undefined) {
        setSnackbarMsg(`Balance updated to ${formatCzk(next)}`);
        setSnackbarVisible(true);
      }
    },
  });

  if (isBalanceLoading) {
    return <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={colors.bgSecondary} gap={12}><ActivityIndicator color={colors.accent} /><Text variant="bodySm">Loading balance…</Text></YStack>;
  }

  if (balance === undefined) {
    return <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={colors.bgSecondary} gap={12}><Text variant="h4">Couldn’t load balance</Text><Button variant="secondary" size="md" fullWidth={false} onPress={refetchBalance}>Retry</Button></YStack>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1} backgroundColor={colors.bgSecondary} paddingTop={insets.top}>
        <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
          <Pressable onPress={() => router.back()} hitSlop={10}><XStack alignItems="center" gap={2}><ChevronLeft size={25} color={colors.textPrimary} /><Text style={{ color: colors.textPrimary, fontSize: 16 }}>Back</Text></XStack></Pressable>
          <Text variant="h5">Balance</Text><XStack width={58} />
        </XStack>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 18 }} keyboardShouldPersistTaps="handled">
          <YStack borderRadius={24} overflow="hidden" padding={22} gap={14}>
            <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <XStack position="relative" zIndex={1} alignItems="center" justifyContent="space-between"><Text style={{ color: "rgba(255,255,255,0.82)", fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.5 }}>AVAILABLE BALANCE</Text><WalletCards size={23} color="#FFFFFF" /></XStack>
            <Text position="relative" zIndex={1} style={{ color: "#FFFFFF", fontFamily: "GeistMono_700Bold", fontSize: 32, lineHeight: 38 }}>{formatCzk(balance)}</Text>
            <Text position="relative" zIndex={1} style={{ color: "rgba(255,255,255,0.82)", fontFamily: "Inter_400Regular", fontSize: 13 }}>Used for contractor services and job access.</Text>
          </YStack>
          <YStack padding={20} borderRadius={20} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={16}>
            <YStack gap={4}><Text variant="h4">Add funds</Text><Text variant="bodySm">Enter the amount you’d like to add.</Text></YStack>
            <FormInput flex={0} control={form.control} name="amount" placeholder="Amount in CZK" keyboardType="numeric" />
            <Button loading={isLoading} onPress={submit}>Continue to payment</Button>
            <XStack alignItems="flex-start" gap={8}><ShieldCheck size={16} color={colors.success} /><Text variant="caption" flex={1}>Payment is completed securely in a web view, then you’ll return here automatically.</Text></XStack>
          </YStack>
        </ScrollView>
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>{snackbarMsg}</Snackbar>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
