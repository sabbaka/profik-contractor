import { useThemeColors } from "@/src/theme";
import React from "react";
import { Spinner, YStack } from "tamagui";

/**
 * The "loading the next page" row under an infinite list. Render it from
 * `ListFooterComponent` only while `isFetchingNextPage` is true — tying it to
 * `isFetching` instead would flash it on every background refetch and poll
 * tick, which is not something the reader asked for.
 */
export function ListFooterSpinner() {
  const colors = useThemeColors();
  return (
    <YStack paddingVertical={16} alignItems="center">
      <Spinner color={colors.accent} />
    </YStack>
  );
}
