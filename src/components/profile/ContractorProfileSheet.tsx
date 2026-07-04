import { useDeleteAccountMutation, useMeQuery } from "@/src/api/profikApi";
import { Text } from "@/src/components/ui/ui";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { extractErrorMessage } from "@/src/features/auth/types";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { ChevronRight, LogOut, Settings, Trash2, WalletCards } from "@tamagui/lucide-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet } from "react-native";
import { Sheet, XStack, YStack } from "tamagui";

interface ContractorProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContractorProfileSheet({ open, onOpenChange }: ContractorProfileSheetProps) {
  const colors = useThemeColors();
  const { data: user, isLoading } = useMeQuery();
  const { logout } = useAuth();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  const initial = (user?.name?.[0] ?? "P").toUpperCase();

  const goToBalance = () => {
    onOpenChange(false);
    router.push("/(contractor)/balance" as any);
  };

  const goToAccountSettings = () => {
    onOpenChange(false);
    router.push("/(contractor)/profile/account-settings" as any);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteAccount().unwrap();
      Alert.alert(
        "Account deleted",
        "Your account and personal data have been deleted.",
        [{ text: "OK", onPress: logout }]
      );
    } catch (error) {
      Alert.alert("Error", extractErrorMessage(error) || "Could not delete your account. Please try again.");
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account and personal data. Your sent offers and messages will be anonymized. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onOpenChange(false);
            void handleDeleteConfirmed();
          },
        },
      ]
    );
  };

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[60]} dismissOnSnapToBottom zIndex={100_000} animation="medium">
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(17,24,39,0.28)" />
      <Sheet.Frame backgroundColor={colors.bgCard} borderTopLeftRadius={28} borderTopRightRadius={28}>
        <YStack alignItems="center" paddingTop={10} paddingBottom={18}>
          <YStack width={40} height={4} borderRadius={9999} backgroundColor={colors.border} />
        </YStack>
        <YStack paddingHorizontal={20} paddingBottom={28} gap={18}>
          <XStack alignItems="center" gap={14}>
            <YStack width={56} height={56} borderRadius={9999} overflow="hidden" alignItems="center" justifyContent="center">
              <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text position="relative" zIndex={1} style={{ color: "#FFFFFF", fontFamily: "Geist_700Bold", fontSize: 22 }}>{initial}</Text>
            </YStack>
            <YStack flex={1} gap={2}>
              <Text variant="h3">{isLoading ? "Loading…" : user?.name || "Contractor"}</Text>
              <Text variant="bodySm">{user?.email || "Profik contractor"}</Text>
            </YStack>
          </XStack>

          <Pressable onPress={goToBalance} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
            <YStack borderRadius={20} overflow="hidden" padding={18} gap={5}>
              <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <XStack position="relative" zIndex={1} alignItems="center" justifyContent="space-between">
                <Text style={{ color: "rgba(255,255,255,0.82)", fontFamily: "Inter_500Medium", fontSize: 13 }}>AVAILABLE BALANCE</Text>
                <WalletCards size={20} color="#FFFFFF" />
              </XStack>
              <Text position="relative" zIndex={1} style={{ color: "#FFFFFF", fontFamily: "GeistMono_700Bold", fontSize: 25 }}>{formatCzk(user?.balance ?? 0)}</Text>
              <Text position="relative" zIndex={1} style={{ color: "rgba(255,255,255,0.84)", fontFamily: "Inter_400Regular", fontSize: 12 }}>Tap to add funds</Text>
            </YStack>
          </Pressable>

          <YStack borderRadius={16} borderWidth={1} borderColor={colors.borderSubtle} overflow="hidden">
            <ProfileRow icon={<Settings size={18} color={colors.textSecondary} />} label="Account settings" colors={colors} onPress={goToAccountSettings} />
            <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
            <ProfileRow icon={<LogOut size={18} color={colors.error} />} label="Log out" destructive colors={colors} onPress={() => { onOpenChange(false); logout(); }} />
            <YStack height={1} backgroundColor={colors.divider} marginHorizontal={16} />
            <ProfileRow icon={<Trash2 size={18} color={colors.error} />} label={isDeleting ? "Deleting…" : "Delete account"} destructive colors={colors} onPress={isDeleting ? undefined : confirmDelete} />
          </YStack>

          <Text variant="caption" textAlign="center" style={{ color: colors.textMuted }}>
            Version {Constants.expoConfig?.version ?? "—"}
          </Text>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}

function ProfileRow({ icon, label, destructive, onPress, colors }: { icon: React.ReactNode; label: string; destructive?: boolean; onPress?: () => void; colors: any }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <XStack height={56} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={12}>
          {icon}
          <Text style={{ color: destructive ? colors.error : colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 15 }}>{label}</Text>
        </XStack>
        {!destructive ? <ChevronRight size={18} color={colors.textMuted} /> : null}
      </XStack>
    </Pressable>
  );
}
