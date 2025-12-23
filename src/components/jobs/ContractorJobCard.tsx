import { Circle, MapPin } from '@tamagui/lucide-icons';
import React from 'react';
import { Card, Separator, Text, XStack, YStack } from 'tamagui';

interface ContractorJobCardProps {
  job: any;
  onPress?: () => void;
}

export function ContractorJobCard({ job, onPress }: ContractorJobCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return { color: '$green10', bg: '$green3', text: 'Open', icon: Circle };
      case 'in_progress':
        return { color: '$blue10', bg: '$blue3', text: 'In Progress' };
      case 'completed':
        return { color: '$gray10', bg: '$gray4', text: 'Completed' };
      case 'canceled':
        return { color: '$red10', bg: '$red3', text: 'Canceled' };
      default:
        return { color: '$gray10', bg: '$gray3', text: status || 'Open', icon: Circle };
    }
  };

  const statusConfig = getStatusConfig(job?.status ?? 'open');

  const locationString = [job?.city, job?.country].filter(Boolean).join(', ') || 'Remote / No address';

  const priceLabel =
    typeof job?.price === 'number'
      ? `${job.price.toLocaleString()} Kč`
      : new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(job?.price ?? 0);

  return (
    <Card
      onPress={onPress}
      bordered
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$background"
      borderRadius="$6"
      padding="$0"
      elevation="$1"
      marginBottom="$4"
      animation="bouncy"
      pressStyle={{ scale: 0.98, borderColor: '$gray8' }}
    >
      <YStack padding="$4" gap="$2">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$2" marginRight="$3">
            <Text fontSize="$3" color="$gray10" marginTop="$1">
              {job?.category}
            </Text>
            <Text fontSize="$6" fontWeight="800" color="$color" lineHeight={24}>
              {job?.title}
            </Text>
          </YStack>

          <YStack alignItems="flex-end">
            <Text fontSize="$6" fontWeight="700" color="$color">
              {priceLabel}
            </Text>
          </YStack>
        </XStack>
      </YStack>

      <Separator borderColor="$gray4" />

      <XStack
        padding="$3"
        paddingHorizontal="$4"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$gray1"
        borderBottomLeftRadius="$6"
        borderBottomRightRadius="$6"
      >
        <XStack gap="$3" alignItems="center" flex={1}>
          <XStack gap="$1.5" alignItems="center" flex={1}>
            <MapPin size={14} color="$gray9" />
            <Text fontSize="$3" color="$gray10" numberOfLines={1}>
              {locationString}
            </Text>
          </XStack>
        </XStack>

        <XStack
          backgroundColor={statusConfig.bg}
          paddingVertical={4}
          paddingHorizontal={10}
          borderRadius={100}
          alignItems="center"
          gap="$1.5"
        >
          <Text fontSize="$2" fontWeight="700" color={statusConfig.color} textTransform="uppercase">
            {statusConfig.text}
          </Text>
        </XStack>
      </XStack>
    </Card>
  );
}
