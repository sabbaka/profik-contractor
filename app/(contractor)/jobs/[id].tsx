import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import MapPreview from '../../../components/MapPreview';
import { useLocalSearchParams, router } from 'expo-router';
import { Separator, Spinner, YStack } from 'tamagui';
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

  return (
    <YStack flex={1}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Job basic info */}
        <YStack gap="$2" marginBottom="$4">
          <Text fontSize={12} color="$gray10">
            {job.category}
          </Text>
          <Text fontSize={22} fontWeight="800">
            {job.title}
          </Text>
          <Text fontSize={18} fontWeight="700" color="$color" marginTop="$2">
            {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(job.price ?? 0)}
          </Text>
        </YStack>

        <Separator borderColor="$gray4" marginBottom="$4" />

        {/* Description */}
        {job.description ? (
          <YStack gap="$2" marginBottom="$4">
            <Text fontSize={16} fontWeight="700">
              Description
            </Text>
            <Text fontSize={14} color="$gray11">
              {job.description}
            </Text>
          </YStack>
        ) : null}

        {/* Location */}
        {(addressText || (job.lat && job.lng)) && (
          <YStack
            marginBottom="$4"
            padding="$4"
            borderRadius="$6"
            borderWidth={1}
            borderColor="$gray4"
            backgroundColor="$background"
          >
            <Text fontSize={16} fontWeight="700" marginBottom="$2">
              Location
            </Text>
            {addressText ? (
              <Text fontSize={14} color="$gray11" marginBottom="$2">
                {addressText}
              </Text>
            ) : null}
            {!!job.lat && !!job.lng ? (
              <MapPreview lat={job.lat} lng={job.lng} />
            ) : addressText ? (
              <MapPreview address={addressText} />
            ) : null}
          </YStack>
        )}

        {/* Offer section for contractors */}
        {me?.role === 'contractor' && (
          <YStack marginTop="$2">
            {offerStatus?.hasOffered || lastOffer ? (
              <YStack
                padding="$4"
                borderRadius="$6"
                borderWidth={1}
                borderColor="$gray4"
                backgroundColor="$background"
              >
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
                  }).format((lastOffer?.price ?? job.price) || 0)}
                </Text>
                {lastOffer?.message ? (
                  <Text fontSize={14}>Message: {lastOffer.message}</Text>
                ) : (
                  <Text fontSize={14} color="$gray10">
                    Message: —
                  </Text>
                )}

                {!!offerIdForChat && (
                  <Button
                    variant="outlined"
                    marginTop="$3"
                    onPress={() =>
                      router.push({
                        pathname: '/(contractor)/offer-chat/[offerId]' as any,
                        params: { offerId: offerIdForChat },
                      })
                    }
                  >
                    Chat
                  </Button>
                )}
              </YStack>
            ) : (
              <YStack
                padding="$4"
                borderRadius="$6"
                borderWidth={1}
                borderColor="$gray4"
                backgroundColor="$background"
              >
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

        <Button
          variant="outlined"
          marginTop="$4"
          onPress={() => router.back()}
        >
          Back
        </Button>
      </ScrollView>
    </YStack>
  );
}
