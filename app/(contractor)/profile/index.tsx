import { useMeQuery } from "@/src/api/profikApi";
import { FormInput } from "@/src/components/form/FormInput";
import { Button, Text } from "@/src/components/ui/ui";
import { useEditProfileForm } from "@/src/features/auth/hooks";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { data: user, isLoading: isLoadingUser } = useMeQuery();

  const { form, isLoading, submit } = useEditProfileForm({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });

  const {
    control,
    formState: { errors, isDirty },
    reset,
  } = form;

  // Re-seed the form once /me arrives (the screen can mount before the query
  // resolves, so initial defaultValues come back empty).
  useEffect(() => {
    if (user) {
      reset({ name: user.name ?? "", email: user.email ?? "" });
    }
  }, [user, reset]);

  const handleSubmit = async () => {
    const result = await submit();
    if (result.success) {
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const initial = ((user?.name ?? "P")[0] ?? "P").toUpperCase();

  if (isLoadingUser && !user) {
    return (
      <YStack
        flex={1}
        backgroundColor={colors.bgPrimary}
        alignItems="center"
        justifyContent="center"
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </YStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
        <XStack
          height={48}
          paddingHorizontal={16}
          alignItems="center"
          justifyContent="space-between"
        >
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <XStack alignItems="center" gap={2}>
              <ChevronLeft size={25} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Back</Text>
            </XStack>
          </Pressable>
          <Text variant="h5">Edit Profile</Text>
          <XStack width={58} />
        </XStack>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack gap={28} flex={1}>
            {/* Avatar */}
            <YStack alignItems="center">
              <YStack
                width={96}
                height={96}
                borderRadius={9999}
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
                  fontSize={36}
                  lineHeight={44}
                  fontFamily="Geist_700Bold"
                  color="#FFFFFF"
                  textAlign="center"
                >
                  {initial}
                </Text>
              </YStack>
            </YStack>

            {/* Fields */}
            <YStack gap={16}>
              <FormInput
                name="name"
                control={control}
                label="Name"
                placeholder="Your name"
                error={errors.name?.message}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <FormInput
                name="email"
                control={control}
                label="Email"
                placeholder="you@example.com"
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </YStack>

            <YStack flex={1} />

            <Button
              variant={isLoading || !isDirty ? "primaryDisabled" : "primary"}
              onPress={handleSubmit}
              loading={isLoading}
            >
              Save Changes
            </Button>
          </YStack>
        </ScrollView>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
