import { logError } from "@/src/utils/logger";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

/**
 * Keeps the app icon's badge in step with the in-app unread count, instead of
 * whatever number the last push happened to carry.
 *
 * The OS only ever *sets* the badge — from `aps.badge` on the push payload,
 * via `shouldSetBadge` in `usePushNotifications.ts` — and never clears it on
 * its own. Reading a message or marking a conversation read only updates
 * `Unread` in RTK Query's cache; nothing else tells the OS that number is
 * stale, so the icon can sit on a count the contractor already cleared until
 * the next push happens to carry a lower one. This re-syncs the icon to
 * whatever the app already treats as the source of truth
 * (`useGetUnreadCountQuery`'s `total`, already driving the Messages tab
 * badge) every time that number changes.
 */
export function useAppIconBadge(count: number | undefined) {
  useEffect(() => {
    if (count == null) return;
    Notifications.setBadgeCountAsync(count).catch((err) =>
      logError(err, "useAppIconBadge"),
    );
  }, [count]);
}
