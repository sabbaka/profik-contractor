import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, ActivityIndicator, Button, TextInput, Card } from 'react-native-paper';
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading job...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">❌ Failed to load job</Text>
        <Button onPress={refetch} loading={isFetching}>Retry</Button>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text>No job found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>{job.title}</Text>
      <Text variant="bodyMedium" style={styles.muted}>{job.category}</Text>
      <Text variant="bodyLarge" style={styles.price}>
        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(job.price ?? 0)}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>{job.description}</Text>

      {(job.addressLine || job.city || job.postalCode || job.country || (job.lat && job.lng)) && (
        <Card style={{ marginTop: 12 }}>
          <Card.Title title="Location" />
          <Card.Content>
            {(job.addressLine || job.city || job.postalCode || job.country) ? (
              <Text style={{ marginBottom: 8 }}>
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
        <>
          {(offerStatus?.hasOffered || lastOffer) ? (
            <Card style={styles.offerBox}>
              <Card.Title title="Your Offer" subtitle={`Status: submitted`} />
              <Card.Content>
                <Text style={{ marginBottom: 4 }}>
                  Price: {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format((lastOffer?.price ?? job.price) || 0)}
                </Text>
                {lastOffer?.message ? (
                  <Text>Message: {lastOffer.message}</Text>
                ) : (
                  <Text style={{ color: '#666' }}>Message: —</Text>
                )}
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.offerBox}>
              <Text variant="titleMedium" style={{ marginBottom: 8 }}>Submit an Offer</Text>
              <TextInput
                label="Your price"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={{ marginBottom: 8 }}
              />
              <TextInput
                label="Message (optional)"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                style={{ marginBottom: 12 }}
              />
              {offerStatus?.hasOffered && (
                <Text style={{ color: '#666', marginBottom: 8 }}>
                  You have already submitted an offer for this job.
                </Text>
              )}
              <Button mode="contained" onPress={onSubmitOffer} loading={isSubmitting} disabled={isSubmitting}>
                Submit Offer
              </Button>
            </View>
          )}
        </>
      )}

      <Button mode="outlined" style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
        Back
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { padding: 16 },
  title: { marginBottom: 4 },
  muted: { color: '#666', marginBottom: 8 },
  price: { fontWeight: '600', marginBottom: 12 },
  description: { lineHeight: 20 },
  offerBox: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
});
