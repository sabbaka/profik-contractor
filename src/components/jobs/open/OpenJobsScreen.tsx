import { useGetOpenJobsInfiniteQuery } from "@/src/api/profikApi";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { ListFooterSpinner } from "@/src/components/ui/ListFooterSpinner";
import { Button, Text } from "@/src/components/ui/ui";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useManualRefresh } from "@/src/hooks/useManualRefresh";
import { useThemeColors } from "@/src/theme";
import { track } from "@/src/utils/analytics";
import {
  BriefcaseBusiness,
  RefreshCw,
  SlidersHorizontal,
} from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl } from "react-native";
import { Spinner, XStack, YStack } from "tamagui";
import { OpenJobsFiltersSheet } from "./OpenJobsFiltersSheet";
import { useOpenJobsFilters } from "./hooks/useOpenJobsFilters";

/**
 * The Open tab: the paged feed of jobs a contractor can offer on, plus the
 * filter sheet (price, cleaning date, GPS radius — see
 * `OpenJobsFiltersSheet`). Split out of `app/(contractor)/(tabs)/open.tsx`
 * once the filters landed pushed it well past the "route stays thin"
 * guideline in architecture.md.
 */
export function OpenJobsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const isGuest = useIsGuest();
  const { applied, coords, params, activeCount, apply } = useOpenJobsFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    data,
    currentData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useGetOpenJobsInfiniteQuery(params, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });
  const jobs = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);
  // Only when nothing for these filters has loaded. A failed focus refetch or
  // next page sets `error` too but keeps its pages, and must not hide them —
  // same rule as the client's My jobs. `data` would still hold the previous
  // filters' jobs after the sheet is applied.
  const showError = Boolean(error) && !currentData;
  const showRefreshError = Boolean(error) && !!currentData;

  // Once the first page has actually resolved, not on mount — a count sent
  // while it is still in flight reports every visit as empty. Guarded so a
  // filter change or a refetch doesn't re-report the same visit. The full-
  // screen error is its own state: reported as "empty" it inflated empty feeds.
  const viewedReported = useRef(false);
  useEffect(() => {
    if (isLoading || viewedReported.current) return;
    viewedReported.current = true;
    track(
      "open_jobs_screen_viewed",
      showError
        ? { state: "error", is_authenticated: !isGuest }
        : {
            jobs_count: jobs.length,
            state: jobs.length ? "list" : "empty",
            is_authenticated: !isGuest,
          },
    );
  }, [isLoading, showError, jobs.length, isGuest]);

  const { isRefreshing, handleRefresh } = useManualRefresh(refetch);

  // Guarded on `isFetchingNextPage` rather than `isFetching`, which is also
  // true for the silent refetchOnFocus refresh — a scroll to the bottom that
  // landed during one would otherwise be dropped and the feed would stop.
  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <XStack
        paddingHorizontal={20}
        paddingTop={12}
        paddingBottom={16}
        alignItems="flex-end"
        justifyContent="space-between"
      >
        <YStack gap={3}>
          <Text variant="h1">{t("open.title")}</Text>
          {/* The count is what has been loaded, not what exists — the endpoint
              answers with a page, not a total. While more pages remain, say so
              with a "+" instead of claiming a number we do not have. When the
              body shows the error, there is no count at all: "0 jobs" above
              "Couldn't load jobs" reads as an empty feed. */}
          {!showError && (
            <Text variant="bodySm">
              {isLoading
                ? t("open.finding")
                : hasNextPage
                  ? t("open.availableMore", { count: jobs.length })
                  : t("open.available", { count: jobs.length })}
            </Text>
          )}
        </YStack>
        <Pressable
          onPress={() => setFiltersOpen(true)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ selected: filtersOpen }}
          accessibilityLabel={
            activeCount > 0
              ? t("a11y.filtersActive", { count: activeCount })
              : t("a11y.openFilters")
          }
        >
          <YStack
            width={40}
            height={40}
            borderRadius={9999}
            backgroundColor={filtersOpen ? colors.accent : colors.bgPrimary}
            borderWidth={1}
            borderColor={filtersOpen ? colors.accent : colors.borderSubtle}
            alignItems="center"
            justifyContent="center"
          >
            <SlidersHorizontal
              size={19}
              color={filtersOpen ? colors.textInverse : colors.textSecondary}
            />
          </YStack>
          {activeCount > 0 && (
            <YStack
              position="absolute"
              top={-2}
              right={-2}
              width={18}
              height={18}
              borderRadius={9999}
              backgroundColor={colors.accent}
              borderWidth={2}
              borderColor={colors.bgSecondary}
              alignItems="center"
              justifyContent="center"
            >
              {/* fontSize needs an explicit lineHeight + centered text here —
                  without it the digit sits off-centre in the circle, see the
                  "layout traps" note in .claude/rules/components.md. */}
              <Text
                style={{
                  color: colors.textInverse,
                  fontSize: 10,
                  lineHeight: 13,
                  textAlign: "center",
                  fontFamily: "Inter_700Bold",
                }}
              >
                {activeCount}
              </Text>
            </YStack>
          )}
        </Pressable>
      </XStack>

      {isLoading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Spinner color={colors.accent} />
          <Text variant="bodySm">{t("open.loading")}</Text>
        </YStack>
      ) : showError ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          paddingHorizontal={28}
          gap={12}
        >
          <Text variant="h4">{t("open.errorTitle")}</Text>
          <Text variant="bodySm" textAlign="center">
            {t("open.errorBody")}
          </Text>
          <Button
            variant="secondary"
            size="md"
            fullWidth={false}
            // `error` stays set while the retry runs, so this is the only sign
            // the tap did anything.
            loading={isFetching}
            onPress={() => refetch()}
          >
            {t("common.retry")}
          </Button>
        </YStack>
      ) : (
        <>
          {showRefreshError && (
            <Pressable
              onPress={() => refetch()}
              disabled={isFetching}
              accessibilityRole="button"
              accessibilityState={{ busy: isFetching }}
              hitSlop={8}
            >
              <XStack
                marginHorizontal={20}
                marginBottom={8}
                paddingHorizontal={14}
                paddingVertical={10}
                borderRadius={12}
                backgroundColor={colors.bgPrimary}
                borderWidth={1}
                borderColor={colors.borderSubtle}
                alignItems="center"
                gap={8}
              >
                {isFetching ? (
                  <Spinner size="small" color={colors.accent} />
                ) : (
                  <RefreshCw size={16} color={colors.textSecondary} />
                )}
                <Text variant="bodySm" flex={1}>
                  {t("open.refreshError")}
                </Text>
              </XStack>
            </Pressable>
          )}
          <FlatList
            data={jobs}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 4,
              paddingBottom: 118,
              flexGrow: jobs.length ? undefined : 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isFetchingNextPage ? <ListFooterSpinner /> : null
            }
            ListEmptyComponent={
              <YStack
                flex={1}
                alignItems="center"
                justifyContent="center"
                gap={12}
                paddingBottom={80}
              >
                <YStack
                  width={80}
                  height={80}
                  borderRadius={9999}
                  backgroundColor={colors.accentLight}
                  alignItems="center"
                  justifyContent="center"
                >
                  <BriefcaseBusiness size={32} color={colors.accent} />
                </YStack>
                <Text variant="h4">{t("open.emptyTitle")}</Text>
                <Text variant="bodySm" textAlign="center" maxWidth={270}>
                  {t("open.emptyBody")}
                </Text>
              </YStack>
            }
            renderItem={({ item, index }: { item: any; index: number }) => (
              <ContractorJobCard
                job={item}
                onPress={() => {
                  track("job_card_clicked", {
                    job_id: item.id,
                    job_category: item.category ?? undefined,
                    job_price_kc: item.price ?? 0,
                    job_city: item.city,
                    position_in_list: index,
                  });
                  router.push({
                    pathname: "/(contractor)/jobs/[id]",
                    params: { id: item.id },
                  });
                }}
              />
            )}
          />
        </>
      )}

      <OpenJobsFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        applied={applied}
        appliedCoords={coords}
        onApply={apply}
      />
    </YStack>
  );
}
