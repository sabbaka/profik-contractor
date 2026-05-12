import { FormInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useLoginForm } from "@/src/features/auth/forms";
import { colors } from "@/src/theme";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { XStack, YStack } from "tamagui";

export type LoginScreenProps = {
  onGoToSignup?: () => void;
};

export default function LoginScreen({ onGoToSignup }: LoginScreenProps) {
  const { form, isLoading, submit } = useLoginForm();

  const {
    control,
    formState: { errors },
  } = form;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <YStack
        flex={1}
        gap={"$1"}
        padding="$5"
        justifyContent="center"
        backgroundColor={colors.bgPrimary}
      >
        <StatusBar style="light" />
        <YStack gap="$2">
          <YStack
            width={48}
            height={48}
            borderRadius={14}
            backgroundColor={colors.accent}
            alignItems="center"
            justifyContent="center"
            marginBottom="$3"
          >
            <Text fontSize={24}>✦</Text>
          </YStack>
          <Text fontSize={28} fontWeight="bold" color={colors.textPrimary}>
            Welcome back
          </Text>
          <Text fontSize={15} color={colors.textSecondary} marginBottom="$4">
            Sign in to manage your jobs
          </Text>
          <YStack gap="$3">
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
              name="password"
              control={control}
              placeholder="Password"
              secureTextEntry
              error={errors.password?.message}
            />
          </YStack>
          <YStack gap="$3" marginTop="$4">
            <Button
              variant="primary"
              onPress={() => {
                Keyboard.dismiss();
                submit();
              }}
              disabled={isLoading}
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <YStack alignItems="center" gap="$3">
              <Text color={colors.textMuted} fontSize={14}>or</Text>
              <XStack gap="$1">
                <Text color={colors.textSecondary} fontSize={14}>
                  Don't have an account?
                </Text>
                <Text
                  color={colors.accent}
                  fontSize={14}
                  fontWeight="600"
                  onPress={onGoToSignup}
                >
                  Sign Up
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
