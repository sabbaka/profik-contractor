import { Button, Text } from "@/src/components/ui/ui";
import {
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from "@/src/features/moderation/types";
import { useThemeColors } from "@/src/theme";
import { Check } from "@tamagui/lucide-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, XStack, YStack } from "tamagui";

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the thing in the title — "Report message", "Report job", … */
  targetType: ReportTargetType;
  onSubmit: (reason: ReportReason, comment: string) => void;
  isSubmitting: boolean;
}

/**
 * Asks why something is being reported: one reason from the fixed list the
 * server accepts, and optional details. Driven by `useReportFlow`, which sends
 * it and shows the thank-you.
 *
 * The send button stays disabled until a reason is picked — the server needs
 * one, and "other" is there for everything the list does not name. Everything
 * is cleared when the sheet closes, so a second report starts blank.
 *
 * `modal` like `OptionSheet`, which can open it straight from the chat's
 * actions; `moveOnKeyboardChange` keeps the details field above the keyboard.
 * No `autoFocus` on the field: a reason comes first, and most reports need
 * nothing typed at all.
 */
export function ReportSheet({
  open,
  onOpenChange,
  targetType,
  onSubmit,
  isSubmitting,
}: ReportSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState("");

  // Cleared the moment the sheet closes — adjusted while rendering, as React
  // recommends, not in an effect — so the next report never opens on the
  // last one's answers.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setReason(null);
      setComment("");
    }
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress
      moveOnKeyboardChange
      zIndex={200_000}
      animation="medium"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        backgroundColor={colors.bgPrimary}
        borderTopLeftRadius={24}
        borderTopRightRadius={24}
      >
        <YStack alignItems="center" paddingTop={10} paddingBottom={6}>
          <YStack
            width={36}
            height={4}
            borderRadius={9999}
            backgroundColor={colors.borderSubtle}
          />
        </YStack>

        <YStack
          paddingHorizontal={20}
          paddingTop={8}
          paddingBottom={insets.bottom + 16}
          gap={14}
        >
          <YStack gap={4}>
            <Text variant="h5">{t(`report.title.${targetType}`)}</Text>
            <Text variant="bodySm">{t("report.subtitle")}</Text>
          </YStack>

          <YStack>
            {REPORT_REASONS.map((value, idx) => (
              <React.Fragment key={value}>
                {idx > 0 ? (
                  <YStack height={1} backgroundColor={colors.borderSubtle} />
                ) : null}
                <Pressable
                  onPress={() => setReason(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: reason === value }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <XStack
                    minHeight={48}
                    alignItems="center"
                    justifyContent="space-between"
                    gap={12}
                  >
                    <Text variant="body">{t(`report.reason.${value}`)}</Text>
                    {reason === value ? (
                      <Check size={18} color={colors.accent} />
                    ) : null}
                  </XStack>
                </Pressable>
              </React.Fragment>
            ))}
          </YStack>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t("report.commentPlaceholder")}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t("report.commentPlaceholder")}
            multiline
            maxLength={1000}
            style={{
              minHeight: 72,
              maxHeight: 120,
              borderRadius: 16,
              backgroundColor: colors.surfaceInput,
              color: colors.textPrimary,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
              textAlignVertical: "top",
            }}
          />

          <Button
            disabled={!reason}
            loading={isSubmitting}
            onPress={() => reason && onSubmit(reason, comment)}
          >
            {t("report.send")}
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
