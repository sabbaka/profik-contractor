import type { Conversation } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { resolveAvatarUrl } from "@/src/features/auth/utils";
import { useThemeColors } from "@/src/theme";
import { BriefcaseBusiness } from "@tamagui/lucide-icons";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
  /** Timestamp already formatted for the active locale. */
  timeLabel: string;
  /** Preview of the last message, already prefixed with "You:" where needed. */
  preview: string;
}

/**
 * One line of the Messages list: who wrote, which job the chat belongs to, the
 * last thing said, and how many messages are waiting.
 *
 * Unread is carried by three things at once — a bolder preview, an accent
 * timestamp and the red count — because a single grey-to-black shift is easy to
 * miss while scanning a list.
 */
export function ConversationRow({
  conversation,
  onPress,
  timeLabel,
  preview,
}: ConversationRowProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { counterparty, job, unreadCount } = conversation;

  const name = counterparty.name?.trim() || t("messages.unnamedClient");
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = resolveAvatarUrl(counterparty.avatarUrl);
  const unread = unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("messages.openChatA11y", { name, title: job.title })}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <XStack paddingVertical={14} paddingHorizontal={16} gap={12} alignItems="center">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              backgroundColor: colors.surfaceInput,
            }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <YStack
            width={44}
            height={44}
            borderRadius={9999}
            alignItems="center"
            justifyContent="center"
            backgroundColor={colors.accentLight}
          >
            <Text
              style={{
                color: colors.accent,
                fontFamily: "Inter_700Bold",
                fontSize: 17,
                lineHeight: 22,
              }}
            >
              {initial}
            </Text>
          </YStack>
        )}

        <YStack flex={1} gap={3}>
          <XStack alignItems="center" gap={8}>
            <Text
              flex={1}
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                fontFamily: unread ? "Inter_600SemiBold" : "Inter_500Medium",
                fontSize: 15,
                lineHeight: 20,
              }}
            >
              {name}
            </Text>
            <Text
              style={{
                color: unread ? colors.accent : colors.textMuted,
                fontFamily: unread ? "Inter_600SemiBold" : "Inter_400Regular",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              {timeLabel}
            </Text>
          </XStack>

          <XStack alignItems="center" gap={5}>
            <BriefcaseBusiness size={11} color={colors.textMuted} />
            <Text
              flex={1}
              numberOfLines={1}
              style={{
                color: colors.textMuted,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              {job.title}
            </Text>
          </XStack>

          <XStack alignItems="center" gap={8}>
            <Text
              flex={1}
              numberOfLines={1}
              style={{
                color: unread ? colors.textPrimary : colors.textSecondary,
                fontFamily: unread ? "Inter_500Medium" : "Inter_400Regular",
                fontSize: 14,
                lineHeight: 19,
              }}
            >
              {preview}
            </Text>
            {unread ? (
              <XStack
                minWidth={20}
                height={20}
                borderRadius={9999}
                paddingHorizontal={6}
                alignItems="center"
                justifyContent="center"
                backgroundColor={colors.error}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    lineHeight: 15,
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </XStack>
            ) : null}
          </XStack>
        </YStack>
      </XStack>
    </Pressable>
  );
}
