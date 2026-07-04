import ContractorHeader from "@/src/components/layout/ContractorHeader";
import { TabBar } from "@/src/components/ui/TabBar";
import { JobsFilterProvider } from "@/src/context/JobsFilterContext";
import { Briefcase, Search } from "@tamagui/lucide-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <JobsFilterProvider>
      <ContractorHeader />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={({ state }) => (
          <TabBar
            activeKey={state.routes[state.index]?.name ?? "open"}
            items={[
              { key: "open", label: "OPEN JOBS", icon: Search, onPress: () => router.replace("/(contractor)/(tabs)/open" as any) },
              { key: "my-jobs", label: "MY JOBS", icon: Briefcase, onPress: () => router.replace("/(contractor)/(tabs)/my-jobs" as any) },
            ]}
          />
        )}
      >
        <Tabs.Screen name="open" />
        <Tabs.Screen name="my-jobs" />
      </Tabs>
    </JobsFilterProvider>
  );
}
