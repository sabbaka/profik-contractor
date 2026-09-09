import { Card, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { Star } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack } from "tamagui";

interface RatingStarsProps {
  /** The rating already left, or 0 while the client has not been rated yet. */
  currentRating?: number;
  onStarPress: (star: number) => void;
}

/**
 * The contractor's own rating of the client on a finished job — five stars
 * that open `ReviewSheet` at whichever one was tapped.
 *
 * Doubles as the display of a review already left: with a rating the card
 * switches to "your rating" and tapping edits it, because the endpoint
 * upserts. Shown next to `JobReviewCard`, which is the opposite direction.
 */
export function RatingStars({ currentRating = 0, onStarPress }: RatingStarsProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const hasRated = currentRating > 0;

  const handlePress = (star: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStarPress(star);
  };

  return (
    <Card padding={18} gap={12}>
      <XStack alignItems="center" gap={8}>
        <Star size={16} color={colors.textMuted} />
        <Text variant="bodyStrong">
          {hasRated ? t("review.yourRating") : t("review.rateExperience")}
        </Text>
      </XStack>

      <XStack justifyContent="center" gap={8}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = currentRating >= star;
          return (
            <Pressable
              key={star}
              onPress={() => handlePress(star)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t("a11y.rateStars", { rating: star })}
              hitSlop={6}
              style={({ pressed }) =>
                pressed ? { transform: [{ scale: 0.92 }] } : null
              }
            >
              <Star
                size={32}
                color={active ? colors.accent : colors.borderSubtle}
                fill={active ? colors.accent : "transparent"}
                strokeWidth={2}
              />
            </Pressable>
          );
        })}
      </XStack>

      <Text variant="caption" style={{ color: colors.textMuted, textAlign: "center" }}>
        {hasRated ? t("review.tapToEdit") : t("review.tapToRate")}
      </Text>
    </Card>
  );
}
