import { Text } from "@/src/components/ui/ui";
import { useMeQuery } from "@/src/api/profikApi";
import { useThemeColors, useThemeMode } from "@/src/theme";
import { Bell, ChevronLeft, ChevronRight, HelpCircle, Info, Moon, Shield } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <XStack height={56} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={12}>
          {icon}
          <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 15 }}>{label}</Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          {value ? <Text variant="bodySm">{value}</Text> : null}
          <ChevronRight size={18} color={colors.textMuted} />
        </XStack>
      </XStack>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <XStack height={52} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
      <Text variant="bodySm">{label}</Text>
      <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 15 }}>{value}</Text>
    </XStack>
  );
}

export default function AccountSettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data: user } = useMeQuery();
  const { preference, setPreference } = useThemeMode();

  const appearanceLabel =
    preference === "system" ? "System" : preference === "dark" ? "Dark" : "Light";

  const handleAppearancePress = () => {
    Alert.alert("Appearance", undefined, [
      { text: "System", onPress: () => setPreference("system") },
      { text: "Light", onPress: () => setPreference("light") },
      { text: "Dark", onPress: () => setPreference("dark") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary} paddingTop={insets.top}>
      <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Back</Text>
          </XStack>
        </Pressable>
        <Text variant="h5">Account settings</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 20 }}>
        <YStack borderRadius={16} borderWidth={1} borderColor={colors.borderSubtle} backgroundColor={colors.bgCard} overflow="hidden">
          <InfoRow label="Name" value={user?.name || "—"} />
          <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
          <InfoRow label="Email" value={user?.email || "—"} />
        </YStack>

        <YStack borderRadius={16} borderWidth={1} borderColor={colors.borderSubtle} backgroundColor={colors.bgCard} overflow="hidden">
          <SettingsRow
            icon={<Bell size={18} color={colors.warningText} />}
            label="Notifications"
            onPress={() => Linking.openSettings()}
          />
          <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
          <SettingsRow
            icon={<Moon size={18} color={colors.purple} />}
            label="Appearance"
            value={appearanceLabel}
            onPress={handleAppearancePress}
          />
          <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
          <SettingsRow
            icon={<Shield size={18} color={colors.greenStrong} />}
            label="Privacy Policy"
            onPress={() => router.push("/(contractor)/profile/privacy-policy" as any)}
          />
          <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
          <SettingsRow
            icon={<HelpCircle size={18} color={colors.accent} />}
            label="Help & Support"
            onPress={() => router.push("/(contractor)/profile/help-support" as any)}
          />
          <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
          <SettingsRow
            icon={<Info size={18} color={colors.textSecondary} />}
            label="About"
            onPress={() => router.push("/(contractor)/profile/about" as any)}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
