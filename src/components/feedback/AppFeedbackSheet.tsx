import { Button, Text, TextInput } from "@/src/components/ui/ui";
import {
  appFeedbackErrorKey,
  useAppFeedbackForm,
} from "@/src/features/feedback";
import { useThemeColors } from "@/src/theme";
import { Star } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { Sheet, XStack, YStack } from "tamagui";

interface AppFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "How are we doing?" survey, shown once — the first time a client accepts
 * one of the contractor's offers, the point where the contractor has just
 * been through the whole "find a job, send an offer" flow and is rating the
 * app, not a client or a cleaning that hasn't happened yet.
 *
 * Every rating takes the same path: answers go to our own backend, and
 * nobody is routed to the store based on how they scored us. The native
 * store prompt lives in `maybeRequestStoreReview` and is triggered by a
 * completed job instead — filtering it by expected sentiment is what Apple
 * and Google both call review manipulation.
 */
export function AppFeedbackSheet({
  open,
  onOpenChange,
}: AppFeedbackSheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { form, submit, isLoading, setValue, watch, reset } =
    useAppFeedbackForm({
      onSuccess: () => onOpenChange(false),
    });

  const rating = watch("rating");

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleStarPress = (star: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue("rating", star);
  };

  const handleSubmit = async () => {
    const result = await submit();
    if (result.success) return;

    // Being rate-limited means the feedback did not need sending again, so
    // close the sheet rather than trapping the contractor behind a retry
    // they cannot win.
    if (result.kind === "rateLimited") {
      Alert.alert(
        t("appFeedback.errors.rateLimitedTitle"),
        t(appFeedbackErrorKey(result.kind)),
        [{ text: t("common.ok"), onPress: () => onOpenChange(false) }],
      );
      return;
    }

    Alert.alert(t("common.error"), t(appFeedbackErrorKey(result.kind)));
  };

  // The question follows the rating instead of gating on it: a happy
  // contractor is asked what worked, an unhappy one what didn't. Both are
  // answering us.
  const commentPlaceholder =
    rating >= 4
      ? t("appFeedback.placeholders.positive")
      : t("appFeedback.placeholders.negative");

  return (
    <Sheet
      // Not `modal`, matching ReviewSheet/NamePromptSheet: a modal Sheet
      // portals to the app root, which on iOS sits underneath a native
      // fullScreenModal and would open invisibly. Offer chat is a plain
      // pushed stack screen (no persistent tab bar to sit under either), so
      // the OpenJobsFiltersSheet exception doesn't apply here.
      modal={false}
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[58]}
      dismissOnSnapToBottom
      zIndex={100_000}
      animation="medium"
      moveOnKeyboardChange
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <YStack paddingHorizontal={20} paddingBottom={32} gap={20}>
            <YStack alignItems="center" gap={6} paddingTop={8}>
              <Text variant="h3">{t("appFeedback.title")}</Text>
              <Text variant="body" style={{ textAlign: "center" }}>
                {t("appFeedback.subtitle")}
              </Text>
            </YStack>

            <XStack justifyContent="center" gap={10}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = rating >= star;
                return (
                  <Pressable
                    key={star}
                    onPress={() => handleStarPress(star)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t("appFeedback.starLabel", {
                      count: star,
                    })}
                    hitSlop={4}
                    style={({ pressed }) =>
                      pressed ? { transform: [{ scale: 0.92 }] } : null
                    }
                  >
                    <Star
                      size={42}
                      color={active ? colors.accent : colors.borderSubtle}
                      fill={active ? colors.accent : "transparent"}
                      strokeWidth={2}
                    />
                  </Pressable>
                );
              })}
            </XStack>

            <Controller
              control={form.control}
              name="comment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder={commentPlaceholder}
                  value={value ?? ""}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  height={104}
                  textAlignVertical="top"
                  paddingTop={14}
                />
              )}
            />

            <Button
              variant={rating === 0 ? "primaryDisabled" : "primary"}
              loading={isLoading}
              onPress={handleSubmit}
            >
              {t("appFeedback.submit")}
            </Button>
          </YStack>
        </TouchableWithoutFeedback>
      </Sheet.Frame>
    </Sheet>
  );
}
