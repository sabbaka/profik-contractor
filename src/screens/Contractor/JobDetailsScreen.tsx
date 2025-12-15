import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { YStack, Spinner } from 'tamagui';
import { Text, Button, TextInput, Card } from '@/components/ui/ui';
import MapPreview from '../../../components/MapPreview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ContractorStackParamList } from '../../navigation/ContractorNavigator';
import { useCreateOfferMutation, useGetJobByIdQuery, useHasOfferedQuery, useMeQuery } from '../../api/profikApi';

export default function JobDetailsScreen() {
  const route = useRoute<any>();
  const { id } = route.params as { id: string };
  const navigation = useNavigation<NativeStackNavigationProp<ContractorStackParamList>>();
  const { data: job, isLoading, error, refetch, isFetching } = useGetJobByIdQuery(id, {
    refetchOnMountOrArgChange: true,
  });
  const { data: me } = useMeQuery();
  const [createOffer, { isLoading: isSubmitting }] = useCreateOfferMutation();
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [lastOffer, setLastOffer] = useState<{ price: number; message?: string } | null>(null);
  const { data: offerStatus } = useHasOfferedQuery(id, { skip: !me || me.role !== 'contractor' });

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
      await createOffer({ jobId: id, price: priceNum, message: message.trim() || undefined }).unwrap();
      Alert.alert('Success', 'Offer submitted successfully');
      setLastOffer({ price: priceNum, message: message.trim() || undefined });
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
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" color="$gray10" />
        <Text marginTop="$3">Loading job...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text variant="titleMedium" marginBottom="$3">❌ Failed to load job</Text>
        <Button onPress={refetch} disabled={isFetching} opacity={isFetching ? 0.7 : 1}>
          {isFetching ? 'Loading...' : 'Retry'}
        </Button>
      </YStack>
    );
  }

  if (!job) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text>No job found.</Text>
      </YStack>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <YStack gap="$2" marginBottom="$3">
        <Text variant="headlineSmall">{job.title}</Text>
        <Text variant="bodyMedium" color="$gray10">{job.category}</Text>
        <Text variant="bodyLarge" fontWeight="600" marginTop="$2">
          {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(job.price ?? 0)}
        </Text>
        <Text variant="bodyMedium" marginTop="$2">{job.description}</Text>
      </YStack>

      {(job.addressLine || job.city || job.postalCode || job.country || (job.lat && job.lng)) && (
        <Card marginTop="$3">
          <Card.Title title="Location" />
          <Card.Content>
            {(job.addressLine || job.city || job.postalCode || job.country) ? (
              <Text marginBottom="$2">
                {[job.addressLine, job.city, job.postalCode, job.country].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {!!job.lat && !!job.lng ? (
              <MapPreview lat={job.lat} lng={job.lng} />
            ) : (job.addressLine || job.city || job.postalCode || job.country) ? (
              <MapPreview address={[job.addressLine, job.city, job.postalCode, job.country].filter(Boolean).join(', ')} />
            ) : null}
          </Card.Content>
        </Card>
      )}

      {me?.role === 'contractor' && (
        <YStack marginTop="$4">
          {(offerStatus?.hasOffered || lastOffer) ? (
            <Card>
              <Card.Title title="Your Offer" subtitle="Status: submitted" />
              <Card.Content>
                <Text marginBottom="$1">
                  Price: {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format((lastOffer?.price ?? job.price) || 0)}
                </Text>
                {lastOffer?.message ? (
                  <Text>Message: {lastOffer.message}</Text>
                ) : (
                  <Text color="$gray10">Message: —</Text>
                )}
              </Card.Content>
            </Card>
          ) : (
            <YStack
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$gray4"
              backgroundColor="$background"
            >
              <Text variant="titleMedium" marginBottom="$2">Submit an Offer</Text>
              <YStack gap="$2">
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
                  <Text color="$gray10" fontSize={13}>
                    You have already submitted an offer for this job.
                  </Text>
                )}
                <Button variant="contained" onPress={onSubmitOffer} disabled={isSubmitting} opacity={isSubmitting ? 0.7 : 1}>
                  {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                </Button>
              </YStack>
            </YStack>
          )}
        </YStack>
      )}

      <Button variant="outlined" marginTop="$4" onPress={() => navigation.goBack()}>
        Back
      </Button>
    </ScrollView>
  );
}
