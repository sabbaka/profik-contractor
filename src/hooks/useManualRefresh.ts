import { useCallback, useState } from "react";

/**
 * Pull-to-refresh state for a list screen, kept apart from the query's own
 * `isFetching`.
 *
 * `isFetching` is also true for the silent background work — `refetchOnFocus`
 * when the contractor comes back from a detail screen, a polling tick, a
 * `fetchNextPage` — so binding `RefreshControl` to it makes the spinner pop up
 * on its own. Only the promise this hook awaits counts as a manual refresh.
 */
export function useManualRefresh(refetch: () => PromiseLike<unknown>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  return { isRefreshing, handleRefresh };
}
