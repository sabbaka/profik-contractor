import { FormInput, OTPInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useSignupForm } from "@/src/features/auth/forms/useSignupForm";
import { colors } from "@/src/theme";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { XStack, YStack } from "tamagui";

export type SignupScreenProps = {
  onGoToLogin?: () => void;
};

export default function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();

  const { form, isLoading, handleRequestCode, handleVerifyCode } =
    useSignupForm({
      onCodeSent: () => {
        setStep("otp");
        setOtpCode("");
        setOtpError(undefined);
      },
    });

  const { control } = form;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtpCode("");
    setOtpError(undefined);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <YStack
        flex={1}
        gap="$1"
        padding="$5"
        justifyContent="center"
        backgroundColor={colors.bgPrimary}
      >
        <StatusBar style="light" />

        <YStack gap="$2" display={step === "form" ? "flex" : "none"}>
          <YStack
            width={48}
            height={48}
            borderRadius={14}
            backgroundColor="#7C3AED"
            alignItems="center"
            justifyContent="center"
            marginBottom="$3"
          >
            <Text fontSize={24} color={colors.textInverse}>👤</Text>
          </YStack>
          <Text fontSize={28} fontWeight="bold" color={colors.textPrimary}>
            Create account
          </Text>
          <Text fontSize={15} color={colors.textSecondary} marginBottom="$4">
            Join us and start taking jobs
          </Text>

          <YStack gap="$3">
            <PhoneInput
              flex={0}
              name="phone"
              control={control}
              placeholder="+420 XXX XXX XXX"
              defaultCountryCode="CZ"
            />

            <FormInput
              flex={0}
              name="name"
              control={control}
              placeholder="Name"
              autoCapitalize="words"
            />

            <FormInput
              flex={0}
              name="email"
              control={control}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <FormInput
              flex={0}
              name="password"
              control={control}
              placeholder="Password"
              secureTextEntry
            />
          </YStack>

          <YStack gap="$3" marginTop="$4">
            <Button
              variant="primary"
              onPress={() => {
                dismissKeyboard();
                handleRequestCode();
              }}
              disabled={isLoading}
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? "Sending..." : "Sign Up"}
            </Button>

            <XStack justifyContent="center" gap="$1">
              <Text color={colors.textSecondary} fontSize={14}>
                Already have an account?
              </Text>
              <Text
                color={colors.accent}
                fontSize={14}
                fontWeight="600"
                onPress={onGoToLogin}
              >
                Login
              </Text>
            </XStack>
          </YStack>
        </YStack>

        <YStack
          gap="$4"
          alignItems="center"
          display={step === "otp" ? "flex" : "none"}
        >
          <YStack gap="$3" alignItems="center">
            <Text fontSize={28} fontWeight="bold" color={colors.textPrimary}>
              Enter SMS Code
            </Text>
            <Text
              color={colors.textSecondary}
              fontSize={15}
              textAlign="center"
              marginBottom="$4"
            >
              We sent a verification code to your phone
            </Text>
          </YStack>

          <OTPInput
            length={6}
            value={otpCode}
            onChange={(val) => {
              setOtpCode(val);
              if (otpError) setOtpError(undefined);
            }}
            error={otpError}
            autoFocus
          />

          <YStack width="100%" gap="$3" marginTop="$6">
            <Button
              variant="primary"
              onPress={async () => {
                if (otpCode.length !== 6) {
                  setOtpError("Enter 6 digits");
                  return;
                }
                setOtpError(undefined);
                await handleVerifyCode(otpCode);
              }}
              disabled={isLoading || otpCode.length !== 6}
              opacity={isLoading || otpCode.length !== 6 ? 0.7 : 1}
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <Button variant="outlined" onPress={handleBackToForm}>
              Back
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
