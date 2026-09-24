import { FormInput, OTPInput } from "@/src/components/form";
import { GradientCircle } from "@/src/components/ui/GradientCircle";
import { NavHeader } from "@/src/components/ui/NavHeader";
import { KeyboardAwareScreen } from "@/src/components/ui/KeyboardAwareScreen";
import { Button, Text } from "@/src/components/ui/ui";
import { CountryPickerSheet } from "@/src/components/auth/CountryPickerSheet";
import {
  DEFAULT_COUNTRY,
  formatPhoneInput,
  splitCountryCode,
} from "@/src/features/auth/phone";
import { usePhoneAuth } from "@/src/features/auth/hooks/usePhoneAuth";
import { useThemeColors } from "@/src/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, MessageSquare, Smartphone } from "@tamagui/lucide-icons";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";
import { z } from "zod";

const OTP_LENGTH = 6;

export interface PhoneAuthScreenProps {
  /** Where to land after signing in; defaults to the open-jobs tab. */
  returnTo?: string;
}

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
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
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

  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

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

  const handleClose = () => {
    if (step === "code") {
      setCode("");
      changeNumber();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/(contractor)/(tabs)/open" as any);
  };

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
      <YStack paddingTop={insets.top}>
        <NavHeader showBackLabel={false} onBack={handleClose} />
      </YStack>
      {/* "layout" mode: both steps hang their content off `flex={1}`, which
          only rearranges around the keyboard when the spacer is real. */}
      <KeyboardAwareScreen
        mode="layout"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 16,
          paddingBottom: 32,
          paddingHorizontal: 20,
        }}
      >
        {step === "phone" ? (
          <YStack gap={28} flex={1}>
            <YStack gap={16}>
              <GradientCircle size={56} radius={16}>
                <Smartphone size={28} color="#FFFFFF" />
              </GradientCircle>
              <YStack gap={8}>
                <Text variant="display">{t("auth.phone.title")}</Text>
                <Text variant="body">{t("auth.phone.subtitle")}</Text>
              </YStack>
            </YStack>

            <FormInput
              name="phone"
              control={control}
              label={t("auth.labels.phone")}
              placeholder={t("auth.placeholders.phone")}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="done"
              error={phoneError ?? errors.phone?.message}
              // Inside the field, not above it: the dialling code is part of
              // the number the reader is checking against their SIM.
              prefix={
                <Pressable
                  onPress={() => setCountryPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t("a11y.chooseCountry")}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <XStack alignItems="center" gap={2}>
                    <Text
                      style={{
                        fontSize: 15,
                        lineHeight: 20,
                        fontFamily: "Inter_500Medium",
                        color: colors.textPrimary,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      +{getCountryCallingCode(country)}
                    </Text>
                    {/* No flag here. The code is the part being checked
                        against the number, and a flag beside it is a second
                        thing to read for the same fact. It stays in the
                        picker, where the job is recognising a country rather
                        than a code. */}
                    <ChevronDown size={16} color={colors.textMuted} />
                  </XStack>
                </Pressable>
              }
              onValueChange={(next) => {
                // Autofill puts the whole international number in the field,
                // beside a selector that already shows the dialling code —
                // hence the +420+420 the field used to read. The country code
                // belongs to the selector, so move it there and keep only the
                // national part here. Also catches a pasted foreign number,
                // which used to leave the two contradicting each other.
                //
                // Returned rather than written with `setValue`: the field's
                // own `onChange` runs straight after this and would put the
                // raw text back.
                const split = splitCountryCode(next);
                if (split) {
                  setCountry(split.country);
                  return formatPhoneInput(split.nationalNumber, split.country);
                }
                return formatPhoneInput(next, country);
              }}
            />

            <Button
              variant={isLoading ? "primaryDisabled" : "primary"}
              onPress={handleSubmit((data) => requestCode(data.phone, country))}
              loading={isLoading}
            >
              {t("auth.phone.continue")}
            </Button>

            {/* There used to be a line here saying "by continuing you agree
                to our Terms" — unlinked, so it asserted an agreement without
                giving anyone a way to read what they were agreeing to. That is
                browsewrap, and it is what this app moved away from. Agreement
                is now an explicit act on its own screen, straight after the
                code is verified, where the documents are one tap away. */}

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
          <YStack gap={32} flex={1} alignItems="center">
            <YStack gap={16} alignItems="center">
              <GradientCircle size={56} radius={16}>
                <MessageSquare size={28} color="#FFFFFF" />
              </GradientCircle>
              <YStack gap={8} alignItems="center">
                <Text variant="display" textAlign="center">
                  {t("auth.otp.title")}
                </Text>
                <Text variant="body" textAlign="center">
                  {t("auth.otp.subtitle", { phone })}
                </Text>
              </YStack>
            </YStack>

            <OTPInput
              length={OTP_LENGTH}
              value={code}
              onChange={setCode}
              error={codeError}
              autoFocus
            />

            <YStack width="100%" gap={16} alignItems="center" marginTop={4}>
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

              <XStack justifyContent="center">
                <Pressable
                  onPress={handleChangeNumber}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("auth.otp.changeNumber")}
                >
                  <Text variant="bodySm">{t("auth.otp.changeNumber")}</Text>
                </Pressable>
              </XStack>
            </YStack>
          </YStack>
        )}
      </KeyboardAwareScreen>

      {/* A sibling of the scrollable content, not nested inside it (it used
          to sit between FormInput and the Button above, deep inside
          KeyboardAwareScreen's ScrollView) — a Sheet is always absolutely
          positioned relative to its nearest positioned ancestor, and a
          ScrollView's content container is that ancestor's bounds, not the
          screen's. Nested there, the sheet drew a stray border tracing that
          smaller container instead of the real screen edges, and its drag
          gesture's Y-position math was computed against the same wrong
          bounds — matching "the sheet doesn't move at all" when dragging its
          handle. Every other sheet in this app (ReviewSheet, NamePromptSheet,
          AppFeedbackSheet) already sits here, as a direct child of the
          screen's own root, for the same reason. */}
      <CountryPickerSheet
        open={countryPickerOpen}
        onOpenChange={setCountryPickerOpen}
        selected={country}
        onSelect={setCountry}
      />
    </YStack>
  );
}
