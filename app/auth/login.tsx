import { normalizeAuthReturnTo } from "@/src/features/auth/authReturnTo";
import PhoneAuthScreen from "@/src/screens/Auth/PhoneAuthScreen";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function LoginRoute() {
  const params = useLocalSearchParams<{ returnTo?: string }>();

  return <PhoneAuthScreen returnTo={normalizeAuthReturnTo(params.returnTo)} />;
}
