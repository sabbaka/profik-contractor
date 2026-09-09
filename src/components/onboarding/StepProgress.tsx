import { useThemeColors } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { XStack } from "tamagui";

const GAP = 8;
const HEIGHT = 4;
/** Width of the segment belonging to the page currently on screen. */
const ACTIVE_WIDTH = 52;

interface StepProgressProps {
  /** Continuous page position (2.4 = 40% of the way from page 2 to page 3). */
  position: SharedValue<number>;
  count: number;
  /** Width available for the whole bar, gaps included. */
  trackWidth: number;
}

/**
 * The four-segment progress bar above the onboarding pager.
 *
 * It is driven by the pager's scroll offset rather than by the settled page
 * index, so the segments resize and recolour in lockstep with the swipe — the
 * bar is never "ahead of" or "behind" the screen underneath the finger.
 *
 * Because the two segments involved in a transition always share exactly one
 * unit of "activeness" between them, the widths add up to `trackWidth` at every
 * point of the animation and the bar never jitters.
 */
export function StepProgress({
  position,
  count,
  trackWidth,
}: StepProgressProps) {
  const inactiveWidth =
    (trackWidth - GAP * (count - 1) - ACTIVE_WIDTH) / (count - 1);

  return (
    <XStack gap={GAP} alignItems="center" width={trackWidth}>
      {Array.from({ length: count }).map((_, index) => (
        <Segment
          key={index}
          index={index}
          position={position}
          inactiveWidth={inactiveWidth}
        />
      ))}
    </XStack>
  );
}

function Segment({
  index,
  position,
  inactiveWidth,
}: {
  index: number;
  position: SharedValue<number>;
  inactiveWidth: number;
}) {
  const colors = useThemeColors();

  const trackStyle = useAnimatedStyle(() => {
    const activeness = Math.max(0, 1 - Math.abs(position.value - index));
    return {
      width: inactiveWidth + (ACTIVE_WIDTH - inactiveWidth) * activeness,
    };
  });

  // Crossfading a gradient over the grey track keeps the brand gradient intact;
  // interpolating the colour itself would flatten it to a solid orange.
  const fillStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(position.value - index)),
  }));

  return (
    <Animated.View
      style={[
        {
          height: HEIGHT,
          borderRadius: 9999,
          overflow: "hidden",
          backgroundColor: colors.border,
        },
        trackStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
        <LinearGradient
          colors={["#FF8A2B", "#E85D00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}
