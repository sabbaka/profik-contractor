import { useGetJobByIdQuery } from "@/src/api/profikApi";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { formatCountry } from "@/src/utils/country";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Text, YStack } from "tamagui";
import { KeyboardAwareScreen } from "@/src/components/ui/KeyboardAwareScreen";
import { NamePromptSheet } from "@/src/components/auth";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { ContractorOfferSection } from "./ContractorOfferSection";
import { GuestOfferCta } from "./GuestOfferCta";
import { JobBasicInfo } from "./JobBasicInfo";
import { JobDescription } from "./JobDescription";
import { JobDetailHeader } from "./JobDetailHeader";
import { JobLocation } from "./JobLocation";
import { JobNotes } from "./JobNotes";
import { JobPropertySection } from "./JobPropertySection";
import { JobProvidedSection } from "./JobProvidedSection";
import { JobReviewCard } from "./JobReviewCard";
import { RatingStars } from "./RatingStars";
import { ReviewSheet } from "./ReviewSheet";
import { useJobOffer } from "./hooks/useJobOffer";
import { useJobReview } from "./hooks/useJobReview";

export const JobDetail = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id as string;
  const isGuest = useIsGuest();

  const {
    data: job,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetJobByIdQuery(id, {
    refetchOnMountOrArgChange: true,
  });

  const {
    nameSheetProps,
    isOwnJob,
    canOffer,
    mode,
    setMode,
    price,
    setPrice,
    message,
    setMessage,
    hasOffered,
    myOfferPrice,
    myOfferMessage,
    myOfferStatus,
    offerIdForChat,
    balance,
    canAffordOffer,
    isSubmitting,
    submitOffer,
    acceptClientPrice,
  } = useJobOffer({
    jobId: id,
    jobPrice: job?.price ?? 0,
    clientId: job?.clientId ?? null,
    onSuccess: refetch,
  });

  const {
    isReviewable,
    review,
    myReview,
    isLoading: isReviewLoading,
    reviewSheetProps,
    openSheetAt,
  } = useJobReview({
    jobId: id,
    jobStatus: job?.status ?? "open",
    contractorId: job?.contractorId ?? null,
  });

  // The link is the profikcontractor:// custom scheme, not a real https URL —
  // the app has no web domain or Universal Links / App Links setup yet, so
  // there is nothing to fall back to for someone without the app installed.
  // It works for anyone who has the app (job details are guest-accessible,
  // no sign-in required); most messaging apps won't linkify it, but it opens
  // straight to this job for whoever taps or pastes it with the app present.
  const handleShare = useCallback(() => {
    if (!job) return;
    const location = [job.city, formatCountry(job.country, t)]
      .filter(Boolean)
      .join(", ");
    const lines = [
      job.title,
      "",
      [formatCzk(job.price ?? 0), job.category].filter(Boolean).join(" · "),
    ];
    if (location) lines.push(location);
    lines.push("", Linking.createURL(`jobs/${job.id}`));
    Share.share({ message: lines.join("\n") }).catch(() => {});
  }, [job, t]);

  if (isLoading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        backgroundColor={colors.bgSecondary}
      >
        <Spinner size="large" color={colors.accent} />
        <Text marginTop="$3" fontSize={16} color={colors.textSecondary}>
          {t("job.loading")}
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        backgroundColor={colors.bgSecondary}
      >
        <Text
          fontSize={18}
          fontWeight="700"
          color={colors.textPrimary}
          marginBottom="$3"
        >
          {t("job.failedLoad")}
        </Text>
        <Button
          variant="outlined"
          onPress={refetch}
          disabled={isFetching}
          borderColor={colors.border}
          color={colors.textPrimary}
        >
          {t("common.retry")}
        </Button>
      </YStack>
    );
  }

  if (!job) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        backgroundColor={colors.bgSecondary}
      >
        <Text fontSize={16} color={colors.textSecondary}>
          {t("job.notFound")}
        </Text>
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }}>
      <YStack flex={1}>
        <JobDetailHeader onShare={handleShare} />

        {/* Fixed in place above the scroll area, rather than scrolling away
            with the rest of the detail — the price/title/date a contractor
            is deciding against should stay visible while they read on. */}
        <YStack paddingHorizontal={20} paddingTop={8} paddingBottom={12}>
          <JobBasicInfo
            category={job.category}
            title={job.title}
            price={job.price ?? 0}
            scheduledDates={job.scheduledDates}
            city={job.city}
            timeSlot={job.timeSlot}
          />
        </YStack>

        <KeyboardAwareScreen>
          <YStack gap={12} paddingHorizontal={20} paddingBottom={40}>
            {job.roomsCount ||
            job.area != null ||
            job.windowCleaning ||
            job.windowCount != null ||
            job.vacuumCleaner ||
            job.cleaningSupplies ||
            job.ladder ? (
              <>
                <JobPropertySection
                  roomsCount={job.roomsCount}
                  area={job.area}
                  windowCleaning={job.windowCleaning}
                  windowCount={job.windowCount}
                />
                <JobProvidedSection
                  vacuumCleaner={job.vacuumCleaner}
                  cleaningSupplies={job.cleaningSupplies}
                  ladder={job.ladder}
                />
                <JobNotes notes={job.notes} />
              </>
            ) : (
              <JobDescription description={job.description} />
            )}

            <JobLocation
              addressLine={job.addressLine}
              city={job.city}
              postalCode={job.postalCode}
              country={job.country}
              lat={job.lat}
              lng={job.lng}
            />

            {isGuest &&
              job.status !== "completed" &&
              job.status !== "canceled" && <GuestOfferCta jobId={id} />}

            {isOwnJob && (
              // Reachable by a direct link: the open-jobs feed already hides
              // your own jobs. Manage it in the client app, not here.
              <YStack
                backgroundColor={colors.bgCard}
                borderRadius="$4"
                padding="$4"
                gap="$2"
              >
                <Text fontSize={16} fontWeight="600" color={colors.textPrimary}>
                  {t("offer.ownJobTitle")}
                </Text>
                <Text fontSize={14} color={colors.textSecondary}>
                  {t("offer.ownJobBody")}
                </Text>
              </YStack>
            )}

            {canOffer && (
              <ContractorOfferSection
                jobId={id}
                balance={balance}
                canAffordOffer={canAffordOffer}
                jobTitle={job.title}
                jobStatus={job.status}
                hasOffered={hasOffered}
                myOfferPrice={myOfferPrice}
                myOfferMessage={myOfferMessage}
                myOfferStatus={myOfferStatus}
                offerIdForChat={offerIdForChat}
                mode={mode}
                setMode={setMode}
                price={price}
                setPrice={setPrice}
                message={message}
                setMessage={setMessage}
                onAcceptClientPrice={acceptClientPrice}
                onSubmitOffer={submitOffer}
                isSubmitting={isSubmitting}
              />
            )}

            {canOffer && isReviewable && !isReviewLoading && (
              <>
                <RatingStars
                  currentRating={myReview?.rating}
                  onStarPress={openSheetAt}
                />
                <JobReviewCard review={review} />
              </>
            )}
          </YStack>
        </KeyboardAwareScreen>
      </YStack>

      <NamePromptSheet {...nameSheetProps} />
      <ReviewSheet {...reviewSheetProps} />
    </SafeAreaView>
  );
};
