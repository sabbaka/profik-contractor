import { FormInput, PhoneInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useLoginForm } from "@/src/features/auth/forms";
import { useThemeColors } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export type LoginScreenProps = { onGoToSignup?: () => void };

export default function LoginScreen({ onGoToSignup }: LoginScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { form, isLoading, submit } = useLoginForm();
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
                <Text variant="display">Welcome back</Text>
                <Text variant="body">Sign in to find work and manage your offers.</Text>
              </YStack>
            </YStack>

            <YStack backgroundColor={colors.bgCard} borderRadius={24} borderWidth={1} borderColor={colors.borderSubtle} padding={20} gap={16}>
              <PhoneInput name="phone" control={control} placeholder="+420 XXX XXX XXX" error={errors.phone?.message} defaultCountryCode="CZ" flex={0} />
              <FormInput name="password" control={control} placeholder="Password" secureTextEntry error={errors.password?.message} flex={0} />
              <Button loading={isLoading} onPress={() => { Keyboard.dismiss(); submit(); }}>Sign in</Button>
            </YStack>

            <XStack justifyContent="center" gap={4}>
              <Text variant="bodySm">New to Profik?</Text>
              <Pressable onPress={onGoToSignup} hitSlop={8}>
                <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Create account</Text>
              </Pressable>
            </XStack>
          </YStack>
        </ScrollView>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
