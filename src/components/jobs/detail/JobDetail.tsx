import { useGetJobByIdQuery } from "@/src/api/profikApi";
import { useThemeColors } from "@/src/theme";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ScrollView, Spinner, Text, YStack } from "tamagui";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { ContractorOfferSection } from "./ContractorOfferSection";
import { GuestOfferCta } from "./GuestOfferCta";
import { JobBasicInfo } from "./JobBasicInfo";
import { JobDescription } from "./JobDescription";
import { JobDetailHeader } from "./JobDetailHeader";
import { JobLocation } from "./JobLocation";
import { useJobOffer } from "./hooks/useJobOffer";

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

  const scrollViewRef = useRef<RNScrollView>(null);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const {
    isContractor,
    mode,
    setMode,
    clientPrice,
    price,
    setPrice,
    message,
    setMessage,
    hasOffered,
    myOfferPrice,
    myOfferMessage,
    myOfferStatus,
    offerIdForChat,
    isSubmitting,
    submitOffer,
    acceptClientPrice,
  } = useJobOffer({
    jobId: id,
    jobPrice: job?.price ?? 0,
    onSuccess: refetch,
  });

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" backgroundColor={colors.bgSecondary}>
        <Spinner size="large" color={colors.accent} />
        <Text marginTop="$3" fontSize={16} color={colors.textSecondary}>
          {t("job.loading")}
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" backgroundColor={colors.bgSecondary}>
        <Text fontSize={18} fontWeight="700" color={colors.textPrimary} marginBottom="$3">
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
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" backgroundColor={colors.bgSecondary}>
        <Text fontSize={16} color={colors.textSecondary}>{t("job.notFound")}</Text>
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }}>
      <YStack flex={1}>
        <JobDetailHeader />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <YStack gap={12} paddingHorizontal={20} paddingTop={8} paddingBottom={40}>
              <JobBasicInfo
                category={job.category}
                title={job.title}
                price={job.price ?? 0}
                createdAt={job.createdAt}
                city={job.city}
              />

              <JobDescription description={job.description} />

              <JobLocation
                addressLine={job.addressLine}
                city={job.city}
                postalCode={job.postalCode}
                country={job.country}
                lat={job.lat}
                lng={job.lng}
              />

              {isGuest && <GuestOfferCta jobId={id} />}

              {isContractor && (
                <ContractorOfferSection
                  hasOffered={hasOffered}
                  myOfferPrice={myOfferPrice}
                  myOfferMessage={myOfferMessage}
                  myOfferStatus={myOfferStatus}
                  offerIdForChat={offerIdForChat}
                  clientPrice={clientPrice}
                  mode={mode}
                  setMode={setMode}
                  price={price}
                  setPrice={setPrice}
                  message={message}
                  setMessage={setMessage}
                  onAcceptClientPrice={acceptClientPrice}
                  onSubmitOffer={submitOffer}
                  isSubmitting={isSubmitting}
                  onInputFocus={handleInputFocus}
                />
              )}
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </YStack>
    </SafeAreaView>
  );
};
