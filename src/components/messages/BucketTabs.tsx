import type { ConversationBucket, MessagesTab } from "@/src/api/types";
import { MESSAGES_TABS } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { PROFIK_GRADIENT } from "@/tamagui.config";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

/**
 * Unread waiting behind a tab. `active` is a filter over two buckets, so its
 * dot has to add both — the server reports unread per bucket, not per tab.
 */
function unreadForTab(
  tab: MessagesTab,
  byBucket: Record<ConversationBucket, number> | undefined,
): number {
  if (!byBucket) return 0;
  return tab === "active"
    ? byBucket.open + byBucket.in_progress
    : byBucket[tab];
}

interface BucketTabsProps {
  value: MessagesTab;
  onChange: (tab: MessagesTab) => void;
  /** Unread per bucket, so a tab can flag messages waiting out of view. */
  unreadByBucket?: Record<ConversationBucket, number>;
}

/**
 * The Active / Completed switcher above the Messages list.
 *
 * Underlined text tabs rather than the app's usual filter pills, matching the
 * rest of the Messages header.
 */
export function BucketTabs({
  value,
  onChange,
  unreadByBucket,
}: BucketTabsProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <XStack paddingHorizontal={20} gap={18} alignItems="flex-end">
      {MESSAGES_TABS.map((tab) => {
        const active = tab === value;
        const hasUnread = unreadForTab(tab, unreadByBucket) > 0;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <YStack gap={8} alignItems="center">
              <XStack alignItems="center" gap={5}>
                <Text
                  style={{
                    color: active ? colors.textPrimary : colors.textMuted,
                    fontFamily: active
                      ? "Inter_600SemiBold"
                      : "Inter_500Medium",
                    fontSize: 15,
                    lineHeight: 20,
                  }}
                >
                  {t(`messages.tabs.${tab}`)}
                </Text>
                {hasUnread && !active ? (
                  <YStack
                    width={6}
                    height={6}
                    borderRadius={9999}
                    backgroundColor={colors.error}
                  />
                ) : null}
              </XStack>
              <YStack
                height={3}
                width="100%"
                borderRadius={9999}
                overflow="hidden"
              >
                {active ? (
                  <LinearGradient
                    colors={PROFIK_GRADIENT.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
              </YStack>
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}
