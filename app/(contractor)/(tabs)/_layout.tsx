import ContractorHeader from "@/src/components/layout/ContractorHeader";
import { TabBar, type TabItem } from "@/src/components/ui/TabBar";
import { JobsFilterProvider } from "@/src/context/JobsFilterContext";
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from "@/src/context/TabBarVisibilityContext";
import { useGetUnreadCountQuery } from "@/src/api/profikApi";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useAppIconBadge } from "@/src/hooks/useAppIconBadge";
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
  });
  // Same number, one more destination: the OS app icon badge.
  useAppIconBadge(unread?.total);

  const items: TabItem[] = [
    {
      key: "open",
      label: t("tabs.openJobs"),
      icon: Search,
      onPress: () => router.replace("/(contractor)/(tabs)/open" as any),
    },
    {
      key: "my-jobs",
      label: t("tabs.myJobs"),
      icon: Briefcase,
      onPress: () => router.replace("/(contractor)/(tabs)/my-jobs" as any),
    },
    {
      key: "messages",
      label: t("tabs.messages"),
      icon: MessageCircle,
      badge: unread?.total,
      onPress: () => router.replace("/(contractor)/(tabs)/messages" as any),
    },
    {
      key: "profile",
      label: t("tabs.profile"),
      icon: User,
      onPress: () => router.replace("/(contractor)/(tabs)/profile" as any),
    },
  ];

  return (
    <TabBarVisibilityProvider>
      <JobsFilterProvider>
        <ContractorHeader />
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={({ state }) => (
            <ContractorTabBar state={state} items={items} />
          )}
        >
          <Tabs.Screen name="open" />
          <Tabs.Screen name="my-jobs" />
          <Tabs.Screen name="messages" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </JobsFilterProvider>
    </TabBarVisibilityProvider>
  );
}

/**
 * A named component, not an inline arrow function, so `useTabBarVisibility`
 * can be called here at all — a render-prop callback isn't a component React
 * recognizes for hooks purposes. Lets a screen (Open Jobs' filter sheet, so
 * far) ask for the bar to disappear entirely rather than sit visible behind
 * or through whatever that screen is showing — see
 * `TabBarVisibilityContext.tsx`.
 */
function ContractorTabBar({
  state,
  items,
}: {
  state: { routes: { name: string }[]; index: number };
  items: TabItem[];
}) {
  const { hidden } = useTabBarVisibility();
  if (hidden) return null;
  return (
    <TabBar
      activeKey={state.routes[state.index]?.name ?? "open"}
      items={items}
    />
  );
}
