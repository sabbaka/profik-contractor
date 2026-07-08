import {
  useDeleteAccountMutation,
  useMeQuery,
} from "@/src/api/profikApi";
import { Text } from "@/src/components/ui/ui";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { extractErrorMessage } from "@/src/features/auth/types";
import { resolveAvatarUrl } from "@/src/features/auth/utils";
import { useThemeColors, useThemeMode } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import {
  getStoredLanguage,
  setStoredLanguage,
  type AppLanguage,
} from "@/src/utils/languageStorage";
import {
  Bell,
  ChevronRight,
  Edit3,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Moon,
  Shield,
  Trash2,
  WalletCards,
} from "@tamagui/lucide-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

interface RowProps {
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  value?: string;
  onPress?: () => void;
}

function ProfileRow({ label, iconBg, icon, value, onPress }: RowProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <XStack
        paddingVertical={14}
        paddingHorizontal={16}
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="center" gap={12}>
          <YStack
            width={36}
            height={36}
            borderRadius={10}
            alignItems="center"
            justifyContent="center"
            backgroundColor={iconBg}
          >
            {icon}
          </YStack>
          <Text style={{ fontSize: 15, fontFamily: "Inter_500Medium" }}>
            {label}
          </Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          {value ? (
            <Text variant="bodySm" style={{ color: colors.textMuted }}>
              {value}
            </Text>
          ) : null}
          <ChevronRight size={20} color={colors.textMuted} />
        </XStack>
      </XStack>
    </Pressable>
  );
}

function Divider() {
  const colors = useThemeColors();
  return (
    <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
  );
}

export default function ProfileRoute() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { data: user } = useMeQuery();
  const { logout } = useAuth();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  const { preference, setPreference } = useThemeMode();
  const [language, setLanguage] = useState<AppLanguage>(
    (i18n.language as AppLanguage) === "cs" ? "cs" : "en"
  );

  useEffect(() => {
    getStoredLanguage().then((stored) => {
      if (stored) setLanguage(stored);
    });
  }, []);

  const name = user?.name ?? "—";
  const email = user?.email ?? "";
  const initial = (name[0] ?? "P").toUpperCase();
  const avatarUrl = resolveAvatarUrl(user?.avatarUrl);

  const appearanceLabel =
    preference === "system"
      ? t("profile.appearance.system")
      : preference === "dark"
        ? t("profile.appearance.dark")
        : t("profile.appearance.light");

  const handleAppearancePress = () => {
    Alert.alert(t("profile.appearance.title"), undefined, [
      { text: t("profile.appearance.system"), onPress: () => setPreference("system") },
      { text: t("profile.appearance.light"), onPress: () => setPreference("light") },
      { text: t("profile.appearance.dark"), onPress: () => setPreference("dark") },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const handleChangeLanguage = async (lng: AppLanguage) => {
    setLanguage(lng);
    await i18n.changeLanguage(lng);
    await setStoredLanguage(lng);
  };

  const handleLanguagePress = () => {
    Alert.alert(t("profile.language.title"), undefined, [
      { text: t("profile.language.english"), onPress: () => handleChangeLanguage("en") },
      { text: t("profile.language.czech"), onPress: () => handleChangeLanguage("cs") },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteAccount().unwrap();
      Alert.alert(
        t("profile.deleteSuccessTitle"),
        t("profile.deleteSuccessMessage"),
        [{ text: t("common.ok"), onPress: logout }]
      );
    } catch (error) {
      Alert.alert(
        t("common.error"),
        extractErrorMessage(error) || t("profile.deleteFailed")
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t("profile.deleteTitle"),
      t("profile.deleteDescription"),
      [
        { text: t("profile.deleteCancel"), style: "cancel" },
        {
          text: t("profile.deleteConfirm"),
          style: "destructive",
          onPress: () => {
            void handleDeleteConfirmed();
          },
        },
      ]
    );
  };

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      {/* Hero */}
      <YStack
        paddingTop={16}
        paddingHorizontal={20}
        paddingBottom={24}
        alignItems="center"
        gap={14}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 9999,
              backgroundColor: colors.surfaceInput,
            }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <YStack
            width={80}
            height={80}
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
              fontSize={32}
              lineHeight={40}
              fontFamily="Geist_700Bold"
              color="#FFFFFF"
              textAlign="center"
            >
              {initial}
            </Text>
          </YStack>
        )}
        <YStack alignItems="center" gap={2}>
          <Text variant="h3">{name}</Text>
          <Text variant="bodySm">{email}</Text>
        </YStack>
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          onPress={() => router.push("/(contractor)/profile" as any)}
          hitSlop={6}
        >
          <XStack
            height={36}
            paddingHorizontal={20}
            borderRadius={9999}
            borderWidth={1.5}
            borderColor={colors.border}
            alignItems="center"
            justifyContent="center"
            gap={6}
          >
            <Edit3 size={14} color={colors.textSecondary} />
            <Text variant="caption" style={{ fontFamily: "Inter_500Medium" }}>
              {t("profile.editProfile")}
            </Text>
          </XStack>
        </Pressable>
      </YStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <Pressable
          onPress={() => router.push("/(contractor)/balance" as any)}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <YStack borderRadius={20} overflow="hidden" padding={18} gap={5}>
            <LinearGradient
              colors={["#FF8A2B", "#E85D00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <XStack
              position="relative"
              zIndex={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.82)",
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                {t("profile.balance.available")}
              </Text>
              <WalletCards size={20} color="#FFFFFF" />
            </XStack>
            <Text
              position="relative"
              zIndex={1}
              style={{
                color: "#FFFFFF",
                fontFamily: "GeistMono_700Bold",
                fontSize: 25,
              }}
            >
              {formatCzk(user?.balance ?? 0)}
            </Text>
            <Text
              position="relative"
              zIndex={1}
              style={{
                color: "rgba(255,255,255,0.84)",
                fontFamily: "Inter_400Regular",
                fontSize: 12,
              }}
            >
              {t("profile.balance.tapToAddFunds")}
            </Text>
          </YStack>
        </Pressable>

        {/* Settings */}
        <YStack
          backgroundColor={colors.bgCard}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.borderSubtle}
          overflow="hidden"
        >
          <ProfileRow
            label={t("profile.menu.notifications")}
            iconBg={colors.warningBg}
            icon={<Bell size={18} color={colors.warningText} />}
            onPress={() => Linking.openSettings()}
          />
          <Divider />
          <ProfileRow
            label={t("profile.menu.language")}
            iconBg={colors.infoBg}
            icon={<Globe size={18} color={colors.infoStrong} />}
            value={
              language === "cs"
                ? t("profile.language.czech")
                : t("profile.language.english")
            }
            onPress={handleLanguagePress}
          />
          <Divider />
          <ProfileRow
            label={t("profile.menu.appearance")}
            iconBg={colors.infoBg}
            icon={<Moon size={18} color={colors.purple} />}
            value={appearanceLabel}
            onPress={handleAppearancePress}
          />
        </YStack>

        {/* About */}
        <YStack
          backgroundColor={colors.bgCard}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.borderSubtle}
          overflow="hidden"
        >
          <ProfileRow
            label={t("profile.menu.privacyPolicy")}
            iconBg={colors.greenSoftBg}
            icon={<Shield size={18} color={colors.greenStrong} />}
            onPress={() =>
              router.push("/(contractor)/profile/privacy-policy" as any)
            }
          />
          <Divider />
          <ProfileRow
            label={t("profile.menu.helpSupport")}
            iconBg={colors.accentLight}
            icon={<HelpCircle size={18} color={colors.accent} />}
            onPress={() =>
              router.push("/(contractor)/profile/help-support" as any)
            }
          />
          <Divider />
          <ProfileRow
            label={t("profile.menu.about")}
            iconBg={colors.surfaceInput}
            icon={<Info size={18} color={colors.textSecondary} />}
            onPress={() => router.push("/(contractor)/profile/about" as any)}
          />
        </YStack>

        {/* Logout */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <XStack
            height={52}
            borderRadius={16}
            alignItems="center"
            justifyContent="center"
            gap={8}
            backgroundColor={colors.bgCard}
            borderWidth={1}
            borderColor={colors.dangerBg}
          >
            <LogOut size={18} color={colors.error} />
            <Text
              style={{
                color: colors.error,
                fontSize: 15,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              {t("profile.logout")}
            </Text>
          </XStack>
        </Pressable>

        <Pressable
          onPress={confirmDelete}
          disabled={isDeleting}
          style={({ pressed }) => ({
            opacity: pressed || isDeleting ? 0.85 : 1,
          })}
        >
          <YStack
            paddingVertical={16}
            paddingHorizontal={18}
            borderRadius={16}
            gap={6}
            backgroundColor={colors.bgCard}
            borderWidth={1}
            borderColor={colors.dangerBg}
          >
            <XStack alignItems="center" gap={10}>
              <Trash2 size={18} color={colors.dangerStrong} />
              <Text
                style={{
                  color: colors.dangerStrong,
                  fontSize: 15,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {isDeleting
                  ? t("profile.deletingAccount")
                  : t("profile.deleteAccount")}
              </Text>
            </XStack>
            <Text variant="caption" style={{ color: colors.textMuted }}>
              {t("profile.deleteHelp")}
            </Text>
          </YStack>
        </Pressable>

        <Text
          variant="caption"
          textAlign="center"
          style={{ color: colors.textMuted }}
        >
          {t("profile.version", { version: Constants.expoConfig?.version ?? "—" })}
        </Text>
      </ScrollView>
    </YStack>
  );
}
