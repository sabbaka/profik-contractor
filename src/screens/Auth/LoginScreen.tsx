import { FormInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useLoginForm } from "@/src/features/auth/forms";
import { useThemeColors } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, ScrollView, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export type LoginScreenProps = { onGoToSignup?: () => void; returnTo?: string };

export default function LoginScreen({ onGoToSignup, returnTo }: LoginScreenProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { form, isLoading, submit } = useLoginForm(returnTo);
  const { control, formState: { errors } } = form;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1} backgroundColor={colors.bgSecondary}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <YStack gap={28}>
            <YStack gap={16}>
              <YStack width={56} height={56} borderRadius={18} overflow="hidden" alignItems="center" justifyContent="center">
                <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text position="relative" zIndex={1} style={{ color: "#FFFFFF", fontFamily: "Geist_700Bold", fontSize: 24 }}>P</Text>
              </YStack>
              <YStack gap={6}>
                <Text variant="display">{t("auth.login.title")}</Text>
                <Text variant="body">{t("auth.login.subtitle")}</Text>
              </YStack>
            </YStack>

            <YStack backgroundColor={colors.bgCard} borderRadius={24} borderWidth={1} borderColor={colors.borderSubtle} padding={20} gap={16}>
              <PhoneInput name="phone" control={control} placeholder={t("auth.placeholders.phone")} error={errors.phone?.message} defaultCountryCode="CZ" flex={0} />
              <FormInput name="password" control={control} placeholder={t("auth.placeholders.password")} secureTextEntry error={errors.password?.message} flex={0} />
              <XStack justifyContent="flex-end" marginTop={-4}>
                <Pressable
                  onPress={() => router.push("/auth/forgot-password" as any)}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{t("auth.login.forgotPassword")}</Text>
                </Pressable>
              </XStack>
              <Button loading={isLoading} onPress={() => { Keyboard.dismiss(); submit(); }}>{t("auth.login.signIn")}</Button>
            </YStack>

            <XStack justifyContent="center" gap={4}>
              <Text variant="bodySm">{t("auth.login.newTo")}</Text>
              <Pressable onPress={onGoToSignup} hitSlop={8}>
                <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>{t("auth.login.createAccount")}</Text>
              </Pressable>
            </XStack>

            <XStack justifyContent="center">
              <Pressable
                onPress={() => router.replace("/(contractor)/(tabs)/open" as any)}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>{t("guest.browseJobs")}</Text>
              </Pressable>
            </XStack>
          </YStack>
        </ScrollView>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
