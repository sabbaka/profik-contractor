import { FormInput, OTPInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useSignupForm } from "@/src/features/auth/forms/useSignupForm";
import { useThemeColors } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, ScrollView, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export type SignupScreenProps = { onGoToLogin?: () => void };

export default function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string>();
  const { form, isLoading, handleRequestCode, handleVerifyCode } = useSignupForm({
    onCodeSent: () => { setStep("otp"); setOtpCode(""); setOtpError(undefined); },
  });
  const { control } = form;

  const verify = async () => {
    if (otpCode.length !== 6) { setOtpError(t("auth.errors.otpAllDigits")); return; }
    setOtpError(undefined);
    await handleVerifyCode(otpCode);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1} backgroundColor={colors.bgSecondary}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          {step === "form" ? (
            <YStack gap={24}>
              <YStack gap={16}>
                <YStack width={56} height={56} borderRadius={18} overflow="hidden" alignItems="center" justifyContent="center">
                  <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Text position="relative" zIndex={1} style={{ color: "#FFFFFF", fontFamily: "Geist_700Bold", fontSize: 24 }}>P</Text>
                </YStack>
                <YStack gap={6}>
                  <Text variant="display">{t("auth.signup.title")}</Text>
                  <Text variant="body">{t("auth.signup.subtitle")}</Text>
                </YStack>
              </YStack>
              <YStack backgroundColor={colors.bgCard} borderRadius={24} borderWidth={1} borderColor={colors.borderSubtle} padding={20} gap={14}>
                <PhoneInput name="phone" control={control} placeholder={t("auth.placeholders.phone")} defaultCountryCode="CZ" flex={0} />
                <FormInput name="name" control={control} placeholder={t("auth.placeholders.name")} autoCapitalize="words" flex={0} />
                <FormInput name="email" control={control} placeholder={t("auth.placeholders.email")} autoCapitalize="none" keyboardType="email-address" flex={0} />
                <FormInput name="password" control={control} placeholder={t("auth.placeholders.password")} secureTextEntry flex={0} />
                <Button loading={isLoading} onPress={() => { Keyboard.dismiss(); handleRequestCode(); }}>{t("auth.signup.createAccount")}</Button>
              </YStack>
              <XStack justifyContent="center" gap={4}>
                <Text variant="bodySm">{t("auth.signup.alreadyHave")}</Text>
                <Pressable onPress={onGoToLogin} hitSlop={8}><Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>{t("auth.signup.signIn")}</Text></Pressable>
              </XStack>
            </YStack>
          ) : (
            <YStack gap={28} alignItems="center">
              <YStack alignItems="center" gap={8}>
                <Text variant="display" textAlign="center">{t("auth.signup.checkPhone")}</Text>
                <Text variant="body" textAlign="center">{t("auth.signup.codeSentPrompt")}</Text>
              </YStack>
              <OTPInput length={6} value={otpCode} onChange={(value) => { setOtpCode(value); setOtpError(undefined); }} error={otpError} autoFocus />
              <YStack width="100%" gap={10}>
                <Button loading={isLoading} disabled={otpCode.length !== 6} onPress={verify}>{t("auth.signup.verifyCode")}</Button>
                <Button variant="ghost" onPress={() => { setStep("form"); setOtpCode(""); setOtpError(undefined); }}>{t("common.back")}</Button>
              </YStack>
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
