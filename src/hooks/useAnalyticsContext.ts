import { useMeQuery } from "@/src/api/profikApi";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import {
  registerBalance,
  registerSuperProperties,
  setScreenName,
} from "@/src/utils/analytics";
import Constants from "expo-constants";
import { useSegments } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Keeps the properties every event carries up to date — the cross-cutting
 * column of the analytics spec.
 *
 * Platform and version are registered once; they cannot change while the app
 * is running. The screen is registered on every route change, so an event sent
 * from a screen says which one without each call site having to remember.
 *
 * The name is the route, not a title: `(contractor)/jobs/[id]` rather than
 * "Job details". It is stable across a copy change and across languages,
 * which a title is not — and it is the same string a developer greps for
 * when a funnel points at a screen.
 *
 * Mounted once, from the auth gate. Calling it twice would register the same
 * values twice, which is harmless but says the tree has two owners of
 * something that has one.
 */
export function useAnalyticsContext(): void {
  const segments = useSegments();
  const isGuest = useIsGuest();
  // Already cached by whichever screen fetched it first in practice — this
  // is not a second network round trip, just a second subscriber to the same
  // RTK Query entry. `skip` for guests, who have no balance to report.
  const { data: me } = useMeQuery(undefined, { skip: isGuest });

  useEffect(() => {
    registerSuperProperties({
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? "unknown",
    });
  }, []);

  useEffect(() => {
    // Empty before the router has resolved a route; there is no screen to name
    // yet, and registering "" would file the first events under a blank one.
    const name = segments.join("/");
    if (!name) return;
    setScreenName(name);
  }, [segments]);

  useEffect(() => {
    if (me?.balance == null) return;
    registerBalance(me.balance);
  }, [me?.balance]);
}
