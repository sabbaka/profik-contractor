import type { ConversationBucket } from "@/src/api/types";
import { CONVERSATION_BUCKETS } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { PROFIK_GRADIENT } from "@/tamagui.config";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

// Hidden for now — the Archive bucket isn't ready to show yet. The
// ConversationBucket type and the backend contract keep "archived"; this
// just keeps it out of the switcher until it's re-enabled.
const VISIBLE_BUCKETS = CONVERSATION_BUCKETS.filter(
  (bucket) => bucket !== "archived",
);

interface BucketTabsProps {
  value: ConversationBucket;
  onChange: (bucket: ConversationBucket) => void;
  /** Unread per bucket, so a tab can flag messages waiting out of view. */
  unreadByBucket?: Record<ConversationBucket, number>;
}

/**
 * The Open / In progress / Completed switcher above the Messages list
 * (Archive is hidden for now — see `VISIBLE_BUCKETS`).
 *
 * Underlined text tabs rather than the app's usual filter pills: four pills
 * with their padding need about 430pt and the screen has 350.
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
      {VISIBLE_BUCKETS.map((bucket) => {
        const active = bucket === value;
        const hasUnread = (unreadByBucket?.[bucket] ?? 0) > 0;
        return (
          <Pressable
            key={bucket}
            onPress={() => onChange(bucket)}
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
                  {t(`messages.buckets.${bucket}`)}
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
