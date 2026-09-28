import { useLocalSearchParams } from "expo-router";
import React from "react";

import { TermsGateScreen } from "@/src/components/legal/TermsGateScreen";
import { normalizeAuthReturnTo } from "@/src/features/auth/authReturnTo";

/**
 * Reached only by a redirect — from `AuthGate` at launch, and from
 * `usePhoneAuth` right after a code is verified. It is a route rather than a
 * sheet because a modal Sheet portals to the app root and on iOS renders
 * *underneath* a native fullScreenModal; a route is the current screen and
 * cannot be covered by one.
 *
 * `returnTo` goes through the same whitelist the sign-in route uses. Being a
 * route makes this screen reachable by deep link like any other, and the
 * destination is handed straight to `router.replace` once the terms are
 * accepted — so an unchecked param here is an arbitrary in-app redirect
 * waiting to be handed to someone in a link.
 */
export default function TermsRoute() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  return <TermsGateScreen returnTo={normalizeAuthReturnTo(params.returnTo)} />;
}
