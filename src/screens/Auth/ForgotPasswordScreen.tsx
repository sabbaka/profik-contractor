import { FormInput, OTPInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useForgotPassword } from "@/src/features/auth/hooks";
import { useThemeColors } from "@/src/theme";
import { KeyRound } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

interface ForgotPasswordFormData {
  phone: string;
  newPassword: string;
}

type Step = "phone" | "otp";

function GradientBadge() {
  return (
    <YStack width={56} height={56} borderRadius={16} overflow="hidden" alignItems="center" justifyContent="center">
      <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <KeyRound size={28} color="#FFFFFF" />
    </YStack>
  );
}

export default function ForgotPasswordScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("phone");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const { requestCode, verifyAndReset, isLoading } = useForgotPassword();

  const form = useForm<ForgotPasswordFormData>({
    defaultValues: { phone: "", newPassword: "" },
  });

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = form;

  const handleRequestCode = async (data: ForgotPasswordFormData) => {
    const result = await requestCode(data.phone);
    if (result.success) {
      setStep("otp");
      setOtpCode("");
      setOtpError(undefined);
    } else {
      Alert.alert("Error", result.error || "Failed to send code");
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }

    setOtpError(undefined);
    const { phone, newPassword } = getValues();

    const result = await verifyAndReset(phone, otpCode, newPassword);
    if (!result.success) {
      setOtpError(result.error || "Invalid code");
    }
  };

  const handleBackToForm = () => {
    setStep("phone");
    setOtpCode("");
    setOtpError(undefined);
  };

  const phoneValue = getValues("phone");

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1} backgroundColor={colors.bgSecondary}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {step === "phone" ? (
            <YStack gap={28} flex={1}>
              <YStack gap={16}>
                <GradientBadge />
                <YStack gap={8}>
                  <Text variant="display">Reset password</Text>
                  <Text variant="body">
                    Enter your phone and a new password — we&apos;ll send you a
                    verification code.
                  </Text>
                </YStack>
              </YStack>

              <YStack gap={12}>
                <PhoneInput
                  name="phone"
                  control={control}
                  placeholder="+420 XXX XXX XXX"
                  error={errors.phone?.message}
                  defaultCountryCode="CZ"
                  flex={0}
                />
                <FormInput
                  name="newPassword"
                  control={control}
                  placeholder="Create a new password"
                  secureTextEntry
                  error={errors.newPassword?.message}
                  flex={0}
                />
              </YStack>

              <YStack gap={12}>
                <Button
                  variant={isLoading ? "primaryDisabled" : "primary"}
                  onPress={handleSubmit(handleRequestCode)}
                  loading={isLoading}
                >
                  Send code
                </Button>
                <Button variant="ghost" onPress={() => router.back()}>
                  Back to login
                </Button>
              </YStack>
            </YStack>
          ) : (
            <YStack gap={32} flex={1} alignItems="center">
              <YStack gap={16} alignItems="center">
                <GradientBadge />
                <YStack gap={8} alignItems="center">
                  <Text variant="display" textAlign="center">
                    Enter the code
                  </Text>
                  <Text variant="body" textAlign="center">
                    We sent a 6-digit code to{"\n"}
                    {phoneValue || "your phone"}
                  </Text>
                </YStack>
              </YStack>

              <OTPInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                error={otpError}
                autoFocus
              />

              <YStack width="100%" gap={12} marginTop={12}>
                <Button
                  variant={
                    isLoading || otpCode.length !== 6
                      ? "primaryDisabled"
                      : "primary"
                  }
                  onPress={handleVerify}
                  loading={isLoading}
                >
                  Reset password
                </Button>
                <Button variant="ghost" onPress={handleBackToForm}>
                  Back
                </Button>
              </YStack>
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
