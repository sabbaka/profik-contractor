import { FormInput, OTPInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useSignupForm } from "@/src/features/auth/forms/useSignupForm";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { YStack } from "tamagui";

export type SignupScreenProps = {
  onGoToLogin?: () => void;
};

export default function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const { form, isLoading, handleRequestCode, handleVerifyCode } =
    useSignupForm({
      onCodeSent: () => setStep("otp"),
    });
  const {
    control,
    formState: { errors },
  } = form;

  const handleBackToForm = () => {
    setStep("form");
    setOtpCode("");
    setOtpError(undefined);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <YStack
        flex={1}
        gap="$1"
        padding="$4"
        justifyContent="center"
        backgroundColor="$background"
      >
        <StatusBar style="dark" />

        {step === "form" ? (
          <YStack
            gap="$2"
            animation="quick"
            enterStyle={{ opacity: 0, x: -20 }}
          >
            <Text large style={{ color: "#000" }} marginBottom="$4">
              Sign Up
            </Text>

            <YStack gap="$4">
              <PhoneInput
                flex={0}
                name="phone"
                control={control}
                placeholder="+420 XXX XXX XXX"
                error={errors.phone?.message}
                defaultCountryCode="CZ"
              />

              <FormInput
                flex={0}
                name="name"
                control={control}
                placeholder="Name"
                autoCapitalize="words"
                error={errors.name?.message}
              />

              <FormInput
                flex={0}
                name="email"
                control={control}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email?.message}
              />

              <FormInput
                flex={0}
                name="password"
                control={control}
                placeholder="Password"
                secureTextEntry
                error={errors.password?.message}
              />
            </YStack>

            <YStack gap="$2">
              <Button
                borderRadius="$10"
                backgroundColor="$gray12"
                pressStyle={{ opacity: 0.9, scale: 0.97 }}
                fontWeight="bold"
                onPress={handleRequestCode}
                disabled={isLoading}
                marginTop="$4"
                opacity={isLoading ? 0.7 : 1}
              >
                {isLoading ? "Sending..." : "Sign Up"}
              </Button>

              <Button variant="outlined" onPress={onGoToLogin} marginTop="$2">
                Already have an account? Login
              </Button>
            </YStack>
          </YStack>
        ) : (
          <YStack
            gap="$4"
            alignItems="center"
            animation="quick"
            enterStyle={{ opacity: 0, x: 20 }}
          >
            <YStack gap="$3" alignItems="center">
              <Text large style={{ color: "#000" }}>
                Enter SMS Code
              </Text>
              <Text
                color="$gray10"
                fontSize="$4"
                textAlign="center"
                marginBottom="$4"
              >
                We sent a verification code to your phone
              </Text>
            </YStack>

            <OTPInput
              length={6}
              value={otpCode}
              onChange={setOtpCode}
              error={otpError}
              autoFocus
            />

            <YStack width="100%" gap="$2" marginTop="$6">
              <Button
                borderRadius="$10"
                backgroundColor="$gray12"
                pressStyle={{ opacity: 0.9, scale: 0.97 }}
                fontWeight="bold"
                onPress={() => handleVerifyCode(otpCode)}
                disabled={isLoading || otpCode.length !== 6}
                opacity={isLoading || otpCode.length !== 6 ? 0.7 : 1}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <Button
                variant="outlined"
                onPress={handleBackToForm}
                marginTop="$2"
              >
                Back
              </Button>
            </YStack>
          </YStack>
        )}
      </YStack>
    </TouchableWithoutFeedback>
  );
}
