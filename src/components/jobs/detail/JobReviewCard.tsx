import type { Review } from "@/src/api/types";
import { AvatarCircle } from "@/src/components/ui/GradientCircle";
import { Text } from "@/src/components/ui/ui";
import { resolveAvatarUrl } from "@/src/features/auth/utils";
import { useThemeColors } from "@/src/theme";
import { Star } from "@tamagui/lucide-icons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

/** Amber is the same in both themes — a grey star does not read as a rating. */
const STAR_FILL = "#F59E0B";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const colors = useThemeColors();
  return (
    <XStack gap={2} alignItems="center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={star <= rating ? STAR_FILL : colors.borderSubtle}
          fill={star <= rating ? STAR_FILL : "transparent"}
        />
      ))}
    </XStack>
  );
}

interface JobReviewCardProps {
  /** Null while the client has finished the job but not rated it yet. */
  review: Review | null;
}

/**
 * How the client rated this finished job, shown under the contractor's own
 * offer on the job detail screen. Only reached for the contractor whose offer
 * was accepted — `useJobReview` owns that decision.
 *
 * Renders in both states on purpose: with no review the card still appears and
 * says the client has not left one, because silence would otherwise look like
 * a screen that failed to load.
 */
export const JobReviewCard = ({ review }: JobReviewCardProps) => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const authorName = review?.author.name?.trim() || t("messages.unnamedClient");
  const avatarUrl = resolveAvatarUrl(review?.author.avatarUrl);
  const comment = review?.comment?.trim();

  const date = review
    ? new Date(review.createdAt).toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <YStack
      padding={18}
      borderRadius={20}
      backgroundColor={colors.bgCard}
      borderWidth={1}
      borderColor={colors.borderSubtle}
      gap={15}
    >
      <XStack alignItems="center" gap={12}>
        <YStack
          width={42}
          height={42}
          borderRadius={13}
          backgroundColor={colors.accentLight}
          alignItems="center"
          justifyContent="center"
        >
          <Star size={20} color={colors.accent} />
        </YStack>
        <YStack flex={1} gap={2}>
          <Text variant="h5">{t("review.receivedTitle")}</Text>
          <Text variant="caption">{t("review.receivedBody")}</Text>
        </YStack>
      </XStack>

      {review ? (
        <YStack gap={10}>
          <XStack alignItems="center" gap={10}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  backgroundColor: colors.surfaceInput,
                }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <AvatarCircle size={36}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    lineHeight: 18,
                    textAlign: "center",
                  }}
                >
                  {authorName.charAt(0).toUpperCase()}
                </Text>
              </AvatarCircle>
            )}
            <YStack flex={1} gap={3}>
              <Text variant="bodyStrong">{authorName}</Text>
              <XStack alignItems="center" gap={8}>
                <XStack
                  accessible
                  accessibilityLabel={t("a11y.reviewRating", {
                    rating: review.rating,
                  })}
                >
                  <Stars rating={review.rating} />
                </XStack>
                <Text variant="chip" style={{ color: colors.textMuted }}>
                  {date}
                </Text>
              </XStack>
            </YStack>
          </XStack>
          {comment ? (
            <Text variant="bodySm" style={{ color: colors.textPrimary }}>
              {comment}
            </Text>
          ) : null}
        </YStack>
      ) : (
        <Text variant="bodySm">{t("review.emptyBody")}</Text>
      )}
    </YStack>
  );
};
