import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ContractorHeader from '@/components/layout/ContractorHeader';

export default function ContractorTabsLayout() {
  return (
    <>
      <ContractorHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#fa2a48',
        }}>
        <Tabs.Screen
          name="open/index"
          options={{
            title: 'Open Jobs',
            tabBarLabel: 'List',
            tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="open/map"
          options={{
            title: 'Map',
            tabBarLabel: 'Map',
            tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="balance"
          options={{
            title: 'Balance',
            tabBarLabel: 'Balance',
            tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
