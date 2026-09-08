import { FormInput, OTPInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { usePhoneAuth } from "@/src/features/auth/hooks/usePhoneAuth";
import { useThemeColors } from "@/src/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScreen } from "@/src/components/ui/KeyboardAwareScreen";
import { XStack, YStack } from "tamagui";
import { z } from "zod";

const OTP_LENGTH = 6;

export type PhoneAuthScreenProps = {
  /** Where to land after signing in; defaults to the open-jobs tab. */
  returnTo?: string;
};

/**
 * The app's only sign-in surface. There is no separate registration and no
 * password: a phone number gets a code, and verifying it either signs the
 * person in or creates their account. The name is asked for later, when the
 * contractor first makes an offer.
 *
 * Two steps in one screen — asking for the number, then the code — so backing
 * out of the code step returns to an already-filled field. Browsing open jobs
 * without an account stays reachable from here.
 */
export default function PhoneAuthScreen({ returnTo }: PhoneAuthScreenProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const {
    step,
    phone,
    requestCode,
    verifyCode,
    resend,
    changeNumber,
    isLoading,
    phoneError,
    codeError,
    secondsUntilResend,
  } = usePhoneAuth(returnTo);

  const phoneSchema = z.object({
    phone: z.string().trim().min(1, t("auth.errors.phoneRequired")),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ phone: string }>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  // Codes arrive by SMS and are read off a notification, so waiting for a
  // Verify tap after the sixth digit is a tap for nothing.
  //
  // Each complete code is submitted exactly once. Without that, a rejected
  // code stays six digits long and every render that follows re-fires the
  // request — a tight retry loop against an endpoint that costs money.
  const lastSubmittedCode = useRef<string | null>(null);
  useEffect(() => {
    if (step !== "code") return;
    if (code.length < OTP_LENGTH) {
      // Editing after a failure re-arms it, including for the same digits.
      lastSubmittedCode.current = null;
      return;
    }
    if (lastSubmittedCode.current === code) return;
    lastSubmittedCode.current = code;
    verifyCode(code);
  }, [code, step, verifyCode]);

  const handleChangeNumber = () => {
    setCode("");
    changeNumber();
  };

  const handleResend = () => {
    setCode("");
    resend();
  };

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      {/* "layout" mode: the content is vertically centred, and centring only
          re-settles around the keyboard when the spacer is real. */}
      <KeyboardAwareScreen
        mode="layout"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: 24,
        }}
      >
        {step === "phone" ? (
          <YStack gap={28}>
            <YStack gap={16}>
              <YStack
                width={56}
                height={56}
                borderRadius={18}
                overflow="hidden"
                alignItems="center"
                justifyContent="center"
              >
                <LinearGradient
                  colors={["#FF8A2B", "#E85D00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  position="relative"
                  zIndex={1}
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Geist_700Bold",
                    fontSize: 24,
                    lineHeight: 30,
                    textAlign: "center",
                  }}
                >
                  P
                </Text>
              </YStack>
              <YStack gap={6}>
                <Text variant="display">{t("auth.phone.title")}</Text>
                <Text variant="body">{t("auth.phone.subtitle")}</Text>
              </YStack>
            </YStack>

            <YStack
              backgroundColor={colors.bgCard}
              borderRadius={24}
              borderWidth={1}
              borderColor={colors.borderSubtle}
              padding={20}
              gap={16}
            >
              <FormInput
                name="phone"
                control={control}
                placeholder={t("auth.placeholders.phone")}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="done"
                error={phoneError ?? errors.phone?.message}
                flex={0}
              />
              <Button
                loading={isLoading}
                onPress={handleSubmit((data) => {
                  Keyboard.dismiss();
                  requestCode(data.phone);
                })}
              >
                {t("auth.phone.continue")}
              </Button>
            </YStack>

            <Text variant="bodySm" textAlign="center">
              {t("auth.phone.legal")}
            </Text>

            <XStack justifyContent="center">
              <Pressable
                onPress={() =>
                  router.replace("/(contractor)/(tabs)/open" as any)
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("guest.browseJobs")}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  {t("guest.browseJobs")}
                </Text>
              </Pressable>
            </XStack>
          </YStack>
        ) : (
          <YStack gap={28} alignItems="center">
            <YStack alignItems="center" gap={8}>
              <Text variant="display" textAlign="center">
                {t("auth.otp.title")}
              </Text>
              <Text variant="body" textAlign="center">
                {t("auth.otp.subtitle", { phone })}
              </Text>
            </YStack>

            <OTPInput
              length={OTP_LENGTH}
              value={code}
              onChange={setCode}
              error={codeError}
              autoFocus
            />

            <YStack width="100%" gap={16} alignItems="center">
              {secondsUntilResend > 0 ? (
                <Text variant="bodySm">
                  {t("auth.otp.resendIn", { seconds: secondsUntilResend })}
                </Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={isLoading}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("auth.otp.resend")}
                >
                  <Text
                    style={{
                      color: colors.accent,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    {t("auth.otp.resend")}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleChangeNumber}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("auth.otp.changeNumber")}
              >
                <Text variant="bodySm">{t("auth.otp.changeNumber")}</Text>
              </Pressable>
            </YStack>
          </YStack>
        )}
      </KeyboardAwareScreen>
    </YStack>
  );
}
