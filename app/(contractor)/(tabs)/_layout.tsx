import ContractorHeader from "@/src/components/layout/ContractorHeader";
import { TabBar } from "@/src/components/ui/TabBar";
import { JobsFilterProvider } from "@/src/context/JobsFilterContext";
import { useGetUnreadCountQuery } from "@/src/api/profikApi";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { Briefcase, MessageCircle, Search, User } from "@tamagui/lucide-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const isGuest = useIsGuest();
  // Drives the badge from wherever the contractor is in the app, not just
  // while the Messages tab is on screen.
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: isGuest,
    refetchOnFocus: true,
    pollingInterval: 60_000,
  });

  return (
    <JobsFilterProvider>
      <ContractorHeader />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={({ state }) => (
          <TabBar
            activeKey={state.routes[state.index]?.name ?? "open"}
            items={[
              {
                key: "open",
                label: t("tabs.openJobs"),
                icon: Search,
                onPress: () =>
                  router.replace("/(contractor)/(tabs)/open" as any),
              },
              {
                key: "my-jobs",
                label: t("tabs.myJobs"),
                icon: Briefcase,
                onPress: () =>
                  router.replace("/(contractor)/(tabs)/my-jobs" as any),
              },
              {
                key: "messages",
                label: t("tabs.messages"),
                icon: MessageCircle,
                badge: unread?.total,
                onPress: () =>
                  router.replace("/(contractor)/(tabs)/messages" as any),
              },
              {
                key: "profile",
                label: t("tabs.profile"),
                icon: User,
                onPress: () =>
                  router.replace("/(contractor)/(tabs)/profile" as any),
              },
            ]}
          />
        )}
      >
        <Tabs.Screen name="open" />
        <Tabs.Screen name="my-jobs" />
        <Tabs.Screen name="messages" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </JobsFilterProvider>
  );
}
