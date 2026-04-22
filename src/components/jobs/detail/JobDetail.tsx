import { useGetJobByIdQuery } from "@/src/api/profikApi";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ScrollView, Separator, Spinner, Text, YStack } from "tamagui";
import { ContractorOfferSection } from "./ContractorOfferSection";
import { JobBasicInfo } from "./JobBasicInfo";
import { JobDescription } from "./JobDescription";
import { JobDetailHeader } from "./JobDetailHeader";
import { JobLocation } from "./JobLocation";
import { useJobOffer } from "./hooks/useJobOffer";

export const JobDetail = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id as string;

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
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$gray10" />
        <Text marginTop="$3" fontSize={16} color="$gray11">
          Loading job...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize={18} fontWeight="700" marginBottom="$3">
          Failed to load job
        </Text>
        <Button variant="outlined" onPress={refetch} disabled={isFetching}>
          Retry
        </Button>
      </YStack>
    );
  }

  if (!job) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize={16}>No job found.</Text>
      </YStack>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1}>
        <JobDetailHeader />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <YStack gap="$5" paddingBottom="$10">
              <JobBasicInfo
                category={job.category}
                title={job.title}
                price={job.price ?? 0}
                createdAt={job.createdAt}
                city={job.city}
              />

              <Separator borderColor="$gray4" marginHorizontal="$4" />

              <JobDescription description={job.description} />

              <JobLocation
                addressLine={job.addressLine}
                city={job.city}
                postalCode={job.postalCode}
                country={job.country}
                lat={job.lat}
                lng={job.lng}
              />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
});
