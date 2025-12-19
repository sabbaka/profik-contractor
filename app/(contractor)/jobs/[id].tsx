import React, { useMemo, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import MapPreview from '../../../components/MapPreview';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Clock, MapPin } from '@tamagui/lucide-icons';
import { Button as TamaguiButton, Separator, Spinner, Text as TamaguiText, XStack, YStack } from 'tamagui';
import { Button, Text, TextInput } from '@/components/ui/ui';
import {
  useCreateOfferMutation,
  useGetJobByIdQuery,
  useGetMyOfferForJobQuery,
  useHasOfferedQuery,
  useMeQuery,
} from '../../../src/api/profikApi';

export default function JobDetailsRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id as string;
  const { data: job, isLoading, error, refetch, isFetching } = useGetJobByIdQuery(id, {
    refetchOnMountOrArgChange: true,
  });
  const { data: me } = useMeQuery();
  const [createOffer, { isLoading: isSubmitting }] = useCreateOfferMutation();
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [lastOffer, setLastOffer] = useState<{ price: number; message?: string } | null>(null);
  const [lastOfferId, setLastOfferId] = useState<string | null>(null);
  const { data: offerStatus } = useHasOfferedQuery(id, { skip: !me || me.role !== 'contractor' });

  const { data: myOffer } = useGetMyOfferForJobQuery(id, {
    skip: !me || me.role !== 'contractor' || !offerStatus?.hasOffered,
    refetchOnMountOrArgChange: true,
  });

  const offerIdForChat = lastOfferId ?? (myOffer as any)?.id ?? null;

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(job?.price ?? 0);
  }, [job?.price]);

  const formattedDate = useMemo(() => {
    if (!job?.createdAt) return '';
    try {
      return new Intl.DateTimeFormat('en-US').format(new Date(job.createdAt));
    } catch {
      return '';
    }
  }, [job?.createdAt]);

  const onSubmitOffer = async () => {
    if (me?.role !== 'contractor') {
      Alert.alert('Unauthorized', 'Only contractors can submit offers.');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Validation', 'Please enter your offer price.');
      return;
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation', 'Price must be a positive number.');
      return;
    }
    try {
      const created = await createOffer({ jobId: id, price: priceNum, message: message.trim() || undefined }).unwrap();
      Alert.alert('Success', 'Offer submitted successfully');
      setLastOffer({ price: priceNum, message: message.trim() || undefined });
      setLastOfferId((created as any)?.id ?? null);
      setMessage('');
      setPrice('');
      refetch();
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to submit offer';
      Alert.alert('Error', msg);
    }
  };

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

  const addressText = [job.addressLine, job.city, job.postalCode, job.country].filter(Boolean).join(', ');
  const cityText = job.city || 'Remote';
  const myOfferPrice = (lastOffer?.price ?? (myOffer as any)?.price) as number | undefined;
  const myOfferMessage = (lastOffer?.message ?? (myOffer as any)?.message) as string | undefined;

  return (
    <YStack flex={1}>
      <XStack paddingHorizontal="$4" paddingVertical="$2" alignItems="center" justifyContent="space-between">
        <TamaguiButton
          icon={ArrowLeft}
          chromeless
          circular
          size="$4"
          scaleIcon={1.5}
          onPress={() => router.back()}
          color="$color"
        />
        <TamaguiText fontSize="$6" fontWeight="600" numberOfLines={1} flex={1} textAlign="center">
          Details
        </TamaguiText>
        <XStack width="$4" />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$5" paddingBottom="$10">
          {/* Job basic info */}
          <YStack paddingHorizontal="$4" paddingTop="$2" gap="$2">
            <Text fontSize={12} color="$gray10">
              {job.category}
            </Text>
            <Text fontSize={28} fontWeight="800" lineHeight={34}>
              {job.title}
            </Text>
            <Text fontSize={24} fontWeight="800" color="$color" letterSpacing={-0.5}>
              {formattedPrice}
            </Text>
            <XStack gap="$4" marginTop="$2">
              <XStack gap="$2" alignItems="center">
                <Clock size={18} color="$gray10" />
                <Text fontSize={14} color="$gray11">
                  {formattedDate}
                </Text>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <MapPin size={18} color="$gray10" />
                <Text fontSize={14} color="$gray11">
                  {cityText}
                </Text>
              </XStack>
            </XStack>
          </YStack>

          <Separator borderColor="$gray4" marginHorizontal="$4" />

          {/* Description */}
          {job.description ? (
            <YStack paddingHorizontal="$4" gap="$2">
              <Text fontSize={16} fontWeight="700">
                Description
              </Text>
              <Text fontSize={14} color="$gray11" lineHeight={24}>
                {job.description}
              </Text>
            </YStack>
          ) : null}

          {/* Location */}
          {(addressText || (job.lat && job.lng)) && (
            <YStack paddingHorizontal="$4" gap="$3">
              <Text fontSize={16} fontWeight="700">
                Location
              </Text>
              {addressText ? (
                <XStack gap="$2" alignItems="center">
                  <MapPin size={20} color="$gray10" />
                  <Text fontSize={14} color="$gray11">
                    {addressText}
                  </Text>
                </XStack>
              ) : null}
              <YStack height="auto" borderRadius="$6" overflow="hidden">
                {!!job.lat && !!job.lng ? (
                  <MapPreview lat={job.lat} lng={job.lng} />
                ) : addressText ? (
                  <MapPreview address={addressText} />
                ) : null}
              </YStack>
            </YStack>
          )}

          {/* Offer section for contractors */}
          {me?.role === 'contractor' && (
            <YStack paddingHorizontal="$4" gap="$3">
              {offerStatus?.hasOffered || lastOffer || myOffer ? (
                <YStack padding="$4" borderRadius="$6" backgroundColor="$background" borderWidth={1} borderColor="$gray4">
                  <Text fontSize={16} fontWeight="700" marginBottom="$2">
                    Your Offer
                  </Text>
                  <Text fontSize={14} marginBottom="$1">
                    Status: submitted
                  </Text>
                  <Text fontSize={14} marginBottom="$2">
                    Price:{' '}
                    {new Intl.NumberFormat('cs-CZ', {
                      style: 'currency',
                      currency: 'CZK',
                    }).format(myOfferPrice || 0)}
                  </Text>
                  {myOfferMessage ? (
                    <Text fontSize={14}>Message: {myOfferMessage}</Text>
                  ) : (
                    <Text fontSize={14} color="$gray10">
                      Message: —
                    </Text>
                  )}

                  {!!offerIdForChat && (
                    <TamaguiButton
                      size="$5"
                      variant="outlined"
                      borderColor="$gray5"
                      color="$gray11"
                      fontWeight="600"
                      borderRadius="$10"
                      marginTop="$3"
                      onPress={() =>
                        router.push({
                          pathname: '/(contractor)/offer-chat/[offerId]' as any,
                          params: { offerId: offerIdForChat },
                        })
                      }
                    >
                      Chat
                    </TamaguiButton>
                  )}
                </YStack>
              ) : (
                <YStack padding="$4" borderRadius="$6" backgroundColor="$background" borderWidth={1} borderColor="$gray4">
                  <Text fontSize={16} fontWeight="700" marginBottom="$3">
                    Submit an Offer
                  </Text>
                  <YStack gap="$3">
                    <TextInput
                      placeholder="Your price"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      placeholder="Message (optional)"
                      value={message}
                      onChangeText={setMessage}
                      multiline
                      numberOfLines={3}
                    />
                    {offerStatus?.hasOffered && (
                      <Text fontSize={13} color="$gray10">
                        You have already submitted an offer for this job.
                      </Text>
                    )}
                    <Button
                      variant="primary"
                      onPress={onSubmitOffer}
                      disabled={isSubmitting}
                      opacity={isSubmitting ? 0.7 : 1}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                    </Button>
                  </YStack>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
