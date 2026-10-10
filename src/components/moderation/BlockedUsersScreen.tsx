import {
  useGetMyBlocksQuery,
  useUnblockUserMutation,
} from "@/src/api/profikApi";
import { AvatarCircle } from "@/src/components/ui/GradientCircle";
import { Button, Text } from "@/src/components/ui/ui";
import { extractErrorMessage } from "@/src/features/auth/types";
import { resolveAvatarUrl } from "@/src/features/auth/utils";
import type { BlockedUser } from "@/src/features/moderation/types";
import { useThemeColors } from "@/src/theme";
import { logError } from "@/src/utils/logger";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";

/**
 * The clients this account blocked, and the only place to unblock them —
 * Pro has no client profile screen, so a block made from a chat is undone
 * here. Reached from Profile → Blocked.
 *
 * Unblocking needs no confirmation: it is the undo, and blocking again is two
 * taps from the chat. The conversation and the client's jobs come back on the
 * next read of those lists; `unblockUser` invalidates them.
 */
export function BlockedUsersScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useGetMyBlocksQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [unblockUser] = useUnblockUserMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleUnblock = async (user: BlockedUser) => {
    setPendingId(user.id);
    try {
      await unblockUser(user.id).unwrap();
    } catch (err) {
      logError(err);
      Alert.alert(t("common.error"), extractErrorMessage(err, t));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
      <XStack
        height={48}
        paddingHorizontal={16}
        alignItems="center"
        justifyContent="space-between"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
        >
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              {t("common.back")}
            </Text>
          </XStack>
        </Pressable>
        <Text variant="h5">{t("block.listTitle")}</Text>
        <XStack width={58} />
      </XStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color={colors.accent} />
        </YStack>
      ) : isError ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap={12}
          paddingHorizontal={24}
        >
          <Text variant="body" textAlign="center">
            {t("block.loadFailed")}
          </Text>
          <Button variant="secondary" onPress={() => refetch()}>
            {t("common.retry")}
          </Button>
        </YStack>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(user) => user.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap={6}
              paddingHorizontal={12}
            >
              <Text variant="h5" textAlign="center">
                {t("block.emptyTitle")}
              </Text>
              <Text variant="bodySm" textAlign="center">
                {t("block.emptyBody")}
              </Text>
            </YStack>
          }
          ItemSeparatorComponent={() => (
            <YStack height={1} backgroundColor={colors.borderSubtle} />
          )}
          renderItem={({ item: user }) => {
            const name = user.name?.trim() || t("messages.unnamedClient");
            const avatarUrl = resolveAvatarUrl(user.avatarUrl);
            return (
              <XStack paddingVertical={12} alignItems="center" gap={12}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 9999,
                      backgroundColor: colors.surfaceInput,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <AvatarCircle size={40}>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                        lineHeight: 20,
                        textAlign: "center",
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </AvatarCircle>
                )}
                <Text variant="bodyStrong" flex={1} numberOfLines={1}>
                  {name}
                </Text>
                <Button
                  variant="soft"
                  size="sm"
                  fullWidth={false}
                  loading={pendingId === user.id}
                  onPress={() => handleUnblock(user)}
                  accessibilityLabel={t("block.unblockA11y", { name })}
                >
                  {t("block.unblock")}
                </Button>
              </XStack>
            );
          }}
        />
      )}
    </YStack>
  );
}
