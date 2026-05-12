import { useGetOfferedJobsQuery } from "@/src/api/profikApi";
import type { OfferStatus } from "@/src/api/types";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { Button, Text } from "@/src/components/ui/ui";
import { useJobsFilter } from "@/src/context/JobsFilterContext";
import { useThemeColors } from "@/src/theme";
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
  const colors = useThemeColors();
  return (
    <XStack
      onPress={onPress}
      backgroundColor={isActive ? colors.accent : colors.bgCard}
      paddingVertical={14}
      paddingHorizontal={16}
      borderRadius={50}
      alignItems="center"
      justifyContent="center"
      pressStyle={{ opacity: 0.8, scale: 0.97 }}
      animation="quick"
      borderWidth={isActive ? 0 : 1}
      borderColor={colors.border}
    >
      <TamaguiText
        fontSize={14}
        fontWeight={isActive ? "700" : "500"}
        color={isActive ? colors.textInverse : colors.textSecondary}
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
  const colors = useThemeColors();
  return (
    <YStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$3">
      <Text fontSize={28} fontWeight="bold" color={colors.textPrimary} marginBottom="$3">
        My Jobs
      </Text>
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
  const colors = useThemeColors();
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
          <Spinner size="large" color={colors.accent} />
          <Text marginTop="$3" fontSize={16} color={colors.textSecondary}>
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
          <Button variant="bordered" onPress={refetch}>
            Retry
          </Button>
        </YStack>
      );
    }

    if (jobs.length === 0) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text fontSize={16} color={colors.textMuted}>
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
          <RefreshControl
            refreshing={isFetching && !isFilterChanging}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
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
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <PageHeader filter={filter} setFilter={setFilter} />
      {renderContent()}
    </YStack>
  );
}
