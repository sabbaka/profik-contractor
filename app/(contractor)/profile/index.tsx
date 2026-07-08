import { useMeQuery } from "@/src/api/profikApi";
import { FormInput } from "@/src/components/form/FormInput";
import { AvatarCircle } from "@/src/components/ui/GradientCircle";
import { NavHeader } from "@/src/components/ui/NavHeader";
import { Button, Text } from "@/src/components/ui/ui";
import { useEditProfileForm, useUploadAvatar } from "@/src/features/auth/hooks";
import { resolveAvatarUrl } from "@/src/features/auth/utils";
import { useThemeColors } from "@/src/theme";
import { Camera } from "@tamagui/lucide-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { data: user, isLoading: isLoadingUser } = useMeQuery();
  const { pickAndUpload, isUploading } = useUploadAvatar();

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
      Alert.alert(t("common.success"), t("profile.updateSuccess"));
      router.back();
    } else {
      Alert.alert(t("common.error"), result.error || t("profile.updateFailed"));
    }
  };

  const handleChangeAvatar = async () => {
    const result = await pickAndUpload();
    if (!result.success && !result.cancelled) {
      Alert.alert(t("common.error"), result.error);
    }
  };

  const initial = ((user?.name ?? "P")[0] ?? "P").toUpperCase();
  const avatarUrl = resolveAvatarUrl(user?.avatarUrl);
  const hasAvatar = !!avatarUrl;

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
      <YStack flex={1} backgroundColor={colors.bgPrimary}>
        <YStack paddingTop={insets.top + 4}>
          <NavHeader title={t("profile.editProfile")} showBackLabel={false} />
        </YStack>

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
            <YStack alignItems="center" gap={12}>
              <Pressable
                onPress={handleChangeAvatar}
                disabled={isUploading}
                hitSlop={6}
                style={({ pressed }) => [
                  { position: "relative" },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {hasAvatar ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 9999,
                      backgroundColor: colors.surfaceInput,
                    }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <AvatarCircle size={96}>
                    <Text
                      fontSize={36}
                      lineHeight={44}
                      fontFamily="Geist_700Bold"
                      color="#FFFFFF"
                      textAlign="center"
                    >
                      {initial}
                    </Text>
                  </AvatarCircle>
                )}

                {/* Camera badge */}
                <YStack
                  position="absolute"
                  bottom={0}
                  right={0}
                  width={32}
                  height={32}
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={colors.bgPrimary}
                  borderWidth={2}
                  borderColor={colors.bgPrimary}
                >
                  <YStack
                    width={28}
                    height={28}
                    borderRadius={9999}
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={colors.accent}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Camera size={15} color="#FFFFFF" />
                    )}
                  </YStack>
                </YStack>
              </Pressable>

              <Pressable
                onPress={handleChangeAvatar}
                disabled={isUploading}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text
                  fontSize={14}
                  lineHeight={20}
                  fontFamily="Inter_600SemiBold"
                  color={colors.accent}
                >
                  {isUploading
                    ? t("profile.uploadingAvatar")
                    : t("profile.changeAvatar")}
                </Text>
              </Pressable>
            </YStack>

            {/* Fields */}
            <YStack gap={16}>
              <FormInput
                name="name"
                control={control}
                label={t("profile.name")}
                placeholder={t("profile.placeholders.name")}
                error={errors.name?.message}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <FormInput
                name="email"
                control={control}
                label={t("profile.email")}
                placeholder={t("profile.placeholders.email")}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />

              {/* Phone — read only */}
              <YStack gap={6}>
                <Text variant="sectionLabel">{t("profile.phone")}</Text>
                <XStack
                  height={52}
                  paddingHorizontal={16}
                  borderRadius={12}
                  alignItems="center"
                  backgroundColor={colors.surfaceInput}
                  opacity={0.6}
                >
                  <Text
                    fontSize={15}
                    lineHeight={20}
                    fontFamily="Inter_400Regular"
                    color={colors.textSecondary}
                  >
                    {user?.phone ?? "—"}
                  </Text>
                </XStack>
                <Text variant="caption" style={{ color: colors.textMuted }}>
                  {t("profile.phoneReadOnly")}
                </Text>
              </YStack>
            </YStack>

            <YStack flex={1} />

            <Button
              variant={isLoading || !isDirty ? "primaryDisabled" : "primary"}
              onPress={handleSubmit}
              loading={isLoading}
            >
              {t("profile.saveChanges")}
            </Button>
          </YStack>
        </ScrollView>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
