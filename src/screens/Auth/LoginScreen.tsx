import { FormInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useLoginForm } from "@/src/features/auth/forms";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { YStack } from "tamagui";

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
        padding="$4"
        justifyContent="center"
        backgroundColor="$background"
      >
        <StatusBar style="dark" />
        <YStack gap="$2">
          <Text large style={{ color: "#000" }} marginBottom={"$4"}>
            Login
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
              onPress={submit}
              disabled={isLoading}
              marginTop="$4"
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <Button variant="outlined" onPress={onGoToSignup} marginTop="$2">
              Create account
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
