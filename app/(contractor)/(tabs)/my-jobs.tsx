import { useGetOfferedJobsQuery } from "@/src/api/profikApi";
import type { OfferStatus } from "@/src/api/types";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { Button, Text } from "@/src/components/ui/ui";
import { useJobsFilter } from "@/src/context/JobsFilterContext";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, ScrollView } from "react-native";
import { Spinner, Text as TamaguiText, XStack, YStack } from "tamagui";

const FILTER_OPTIONS: { key: OfferStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  return (
    <XStack
      onPress={onPress}
      backgroundColor={isActive ? "$gray12" : "$gray3"}
      paddingVertical={14}
      paddingHorizontal={16}
      borderRadius={50}
      alignItems="center"
      justifyContent="center"
      pressStyle={{ opacity: 0.8, scale: 0.97 }}
      animation="quick"
    >
      <TamaguiText
        fontSize={14}
        fontWeight={isActive ? "700" : "500"}
        color={isActive ? "white" : "$gray11"}
      >
        {label}
      </TamaguiText>
    </XStack>
  );
}

const FILTER_LABELS = {
  pending: "pending offers",
  accepted: "accepted offers",
  declined: "declined offers",
};

function PageHeader({ filter, setFilter }: { filter: OfferStatus; setFilter: (f: OfferStatus) => void }) {
  return (
    <YStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$3">
      <TamaguiText fontSize={28} fontWeight="bold" marginBottom="$3">
        My Jobs
      </TamaguiText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <XStack gap="$2">
          {FILTER_OPTIONS.map((option) => (
            <FilterChip
              key={option.key}
              label={option.label}
              isActive={filter === option.key}
              onPress={() => setFilter(option.key)}
            />
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
}

export default function MyJobsTab() {
  const { filter, setFilter } = useJobsFilter();
  const [isFilterChanging, setIsFilterChanging] = useState(false);
  const prevFilterRef = useRef(filter);

  const { data, isLoading, isFetching, error, refetch } = useGetOfferedJobsQuery(
    { status: filter },
    {
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    }
  );

  useEffect(() => {
    if (prevFilterRef.current !== filter) {
      setIsFilterChanging(true);
      prevFilterRef.current = filter;
    }
  }, [filter]);

  useEffect(() => {
    if (!isFetching && isFilterChanging) {
      setIsFilterChanging(false);
    }
  }, [isFetching, isFilterChanging]);

  const jobs = data ?? [];
  const showLoading = isLoading || isFilterChanging || (isFetching && jobs.length === 0);

  const renderContent = () => {
    if (showLoading) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$gray10" />
          <Text marginTop="$3" fontSize={16} color="$gray11">
            Loading {FILTER_LABELS[filter]}...
          </Text>
        </YStack>
      );
    }

    if (error) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
          <Text fontSize={18} fontWeight="700" marginBottom="$3">
            Failed to load data
          </Text>
          <Button variant="outlined" onPress={refetch}>
            Retry
          </Button>
        </YStack>
      );
    }

    if (jobs.length === 0) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text fontSize={16} color="#9e9e9e">
            No {FILTER_LABELS[filter]}.
          </Text>
        </YStack>
      );
    }

    return (
      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.job.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isFilterChanging} onRefresh={refetch} />
        }
        renderItem={({ item }: { item: any }) => (
          <ContractorJobCard
            job={item.job}
            myOffer={item.myOffer}
            onPress={() =>
              router.push({
                pathname: "/(contractor)/jobs/[id]",
                params: { id: item.job.id },
              })
            }
          />
        )}
      />
    );
  };

  return (
    <YStack flex={1}>
      <PageHeader filter={filter} setFilter={setFilter} />
      {renderContent()}
    </YStack>
  );
}

