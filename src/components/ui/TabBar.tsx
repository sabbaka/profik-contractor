import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";
import { Text } from "./ui";

export interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
}

export function TabBar({ items, activeKey }: { items: TabItem[]; activeKey: string }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const activeIndex = Math.max(0, items.findIndex((item) => item.key === activeKey));
  const tabWidth = width ? (width - 12 - (items.length - 1) * 4) / items.length : 0;
  const x = useSharedValue(4);

  useEffect(() => {
    if (tabWidth) x.value = withSpring(4 + activeIndex * (tabWidth + 4), { damping: 18, stiffness: 180, mass: 0.6 });
  }, [activeIndex, tabWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ width: tabWidth, transform: [{ translateX: x.value }] }));

  return (
    <YStack position="absolute" bottom={0} left={0} right={0} paddingHorizontal={20} paddingTop={12} paddingBottom={Math.max(insets.bottom, 12) + 8}>
      <XStack
        height={62}
        borderRadius={36}
        backgroundColor="$bgPrimary"
        borderWidth={1}
        borderColor="$borderToken"
        padding={4}
        gap={4}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ shadowColor: "#111827", shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
      >
        {tabWidth ? (
          <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]}>
            <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        ) : null}
        {items.map((item, index) => {
          const active = index === activeIndex;
          const Icon = item.icon;
          return (
            <Pressable key={item.key} onPress={item.onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.75 : 1 })}>
              <YStack flex={1} alignItems="center" justifyContent="center" gap={3}>
                <Icon size={19} color={active ? "#FFFFFF" : "#9CA3AF"} />
                <Text style={{ color: active ? "#FFFFFF" : "#9CA3AF", fontSize: 10, letterSpacing: 0.5, fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium" }}>
                  {item.label}
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  indicator: { position: "absolute", top: 4, bottom: 4, left: 0, borderRadius: 28, overflow: "hidden" },
});
