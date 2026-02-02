import ContractorHeader from "@/src/components/layout/ContractorHeader";
import { JobsFilterProvider } from "@/src/context/JobsFilterContext";
import { Briefcase, Search } from "@tamagui/lucide-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <JobsFilterProvider>
      <ContractorHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#000",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#eee",
            paddingTop: 8,
            height: 85,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="open"
          options={{
            title: "Open Jobs",
            tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="my-jobs"
          options={{
            title: "My Jobs",
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          }}
        />
      </Tabs>
    </JobsFilterProvider>
  );
}

