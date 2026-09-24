import { useLocalSearchParams } from "expo-router";
import React from "react";

import { TermsGateScreen } from "@/src/components/legal/TermsGateScreen";

/**
 * Reached only by a redirect — from `AuthGate` at launch, and from
 * `usePhoneAuth` right after a code is verified. It is a route rather than a
 * sheet because a modal Sheet portals to the app root and on iOS renders
 * *underneath* a native fullScreenModal, of which this app has two; a route is
 * the current screen and cannot be covered by one.
 */
export default function TermsRoute() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  return <TermsGateScreen returnTo={returnTo} />;
}
