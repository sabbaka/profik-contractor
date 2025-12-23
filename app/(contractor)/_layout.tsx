import ContractorHeader from "@/src/components/layout/ContractorHeader";
import { Stack } from "expo-router";
import React from "react";

export default function ContractorLayout() {
  return (
    <>
      <ContractorHeader />
      <Stack
        initialRouteName="open/index"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="open/index" />
        <Stack.Screen name="open/map" />
        <Stack.Screen name="balance" />
        <Stack.Screen name="jobs/[id]" />
        <Stack.Screen name="offer-chat/[offerId]" />
      </Stack>
    </>
  );
}
