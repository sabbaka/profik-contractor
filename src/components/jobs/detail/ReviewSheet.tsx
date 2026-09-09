import { Button, Text, TextInput } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { Star } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  Pressable,
  TextInput as RNTextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { Sheet, XStack, YStack } from "tamagui";
import { useReviewForm } from "./hooks/useReviewForm";

interface ReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  /** The star tapped in `RatingStars`, or an existing rating being edited. */
  initialRating?: number;
}

/**
 * Where the contractor rates the client on a finished job: the stars tapped in
 * `RatingStars`, plus an optional comment.
 *
 * There is no separate edit mode — the endpoint upserts, so opening this again
 * on a job already rated and submitting rewrites that review. The comment
 * starts empty either way; the previous text is not returned to the author.
 */
export function ReviewSheet({
  open,
  onOpenChange,
  jobId,
  initialRating = 0,
}: ReviewSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { form, submit, isLoading, setValue, watch, reset } = useReviewForm({
    jobId,
    initialRating,
    onSuccess: () => onOpenChange(false),
  });
  const commentRef = useRef<RNTextInput>(null);

  const rating = watch("rating");

  useEffect(() => {
    if (open) {
      if (initialRating > 0) setValue("rating", initialRating);
      return;
    }
    // The comment field stays mounted while the sheet is closed — non-modal
    // Sheets don't unmount their children — so a keyboard opened here would
    // outlive the sheet. It is blurred on close for the same reason
    // `NamePromptSheet` focuses on open: the `open` prop is the only signal.
    // Nothing is focused on open on purpose; the keyboard would cover the
    // stars, which is what the sheet is for.
    commentRef.current?.blur();
    Keyboard.dismiss();
    reset({ rating: 0, comment: "" });
  }, [open, initialRating, setValue, reset]);

  const handleStarPress = (star: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue("rating", star);
  };

  return (
    <Sheet
      // Not `modal`, for the same reason as `NamePromptSheet`: a modal Sheet
      // portals to the app root, which on iOS sits *underneath* a native
      // fullScreenModal, and the sheet then opens invisibly.
      modal={false}
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[62]}
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
              <Text variant="h3">{t("review.rateExperience")}</Text>
              <Text variant="body" style={{ textAlign: "center" }}>
                {t("review.howWasIt")}
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
                    accessibilityLabel={t("a11y.rateStars", { rating: star })}
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
                  ref={commentRef}
                  placeholder={t("review.placeholders.comment")}
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
              onPress={submit}
            >
              {t("review.submit")}
            </Button>
          </YStack>
        </TouchableWithoutFeedback>
      </Sheet.Frame>
    </Sheet>
  );
}
