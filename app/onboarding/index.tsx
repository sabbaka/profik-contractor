import { OnboardingBackdrop } from "@/src/components/onboarding/OnboardingBackdrop";
import { StepProgress } from "@/src/components/onboarding/StepProgress";
import { ONBOARDING_STEPS } from "@/src/components/onboarding/steps";
import { Button, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { setHasSeenOnboarding } from "@/src/utils/onboardingStorage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

const LAST_INDEX = ONBOARDING_STEPS.length - 1;
const H_PADDING = 20;
const CARD_MAX_WIDTH = 320;

/**
 * The four-step intro shown once, before sign-in.
 *
 * All four steps live in a single horizontal pager rather than in separate
 * routes: the progress bar at the top is driven by the pager's scroll offset,
 * so it animates continuously with the swipe instead of jumping when a new
 * screen mounts. Route transitions could not express that.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const scrollRef = useRef<Animated.ScrollView>(null);
  const position = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [illustration, setIllustration] = useState({ width: 0, height: 0 });

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      position.value = width > 0 ? event.contentOffset.x / width : 0;
    },
  });

  // Keep the pager aligned with the page in view if the viewport changes
  // (rotation, split screen) — the offset is in pixels, not pages. Guarded on
  // the width actually changing, otherwise this would snap the pager and undo
  // the animated scroll started by the CTA.
  const lastWidth = useRef(width);
  useEffect(() => {
    if (lastWidth.current === width) return;
    lastWidth.current = width;
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
    position.value = index;
  }, [width, index, position]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(Math.min(Math.max(next, 0), LAST_INDEX));
    },
    [width],
  );

  const handleIllustrationLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setIllustration((current) =>
      current.width === w && current.height === h
        ? current
        : { width: w, height: h },
    );
  }, []);

  const handlePress = useCallback(async () => {
    if (index < LAST_INDEX) {
      const next = index + 1;
      // Set the index up front: a programmatic animated scroll does not
      // reliably fire onMomentumScrollEnd on Android.
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      return;
    }
    await setHasSeenOnboarding();
    router.replace("/auth/login" as any);
  }, [index, width]);

  const ctaLabel =
    index === LAST_INDEX ? t("onboarding.cta.claim") : t("onboarding.cta.next");

  return (
    <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
      <YStack paddingHorizontal={H_PADDING} paddingTop={10}>
        <StepProgress
          position={position}
          count={ONBOARDING_STEPS.length}
          trackWidth={width - H_PADDING * 2}
        />
      </YStack>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        style={{ flex: 1 }}
      >
        {ONBOARDING_STEPS.map((step, stepIndex) => {
          const Mock = step.Mock;
          const copy = (key: string) =>
            t(`onboarding.steps.${step.i18nKey}.${key}`);
          return (
            <YStack key={step.key} width={width}>
              <YStack paddingHorizontal={H_PADDING} paddingTop={26} gap={12}>
                <YStack>
                  <Text
                    style={{
                      color: colors.accent,
                      fontFamily: "Geist_700Bold",
                      fontSize: 30,
                      lineHeight: 38,
                    }}
                  >
                    {copy("titleAccent")}
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontFamily: "Geist_700Bold",
                      fontSize: 30,
                      lineHeight: 38,
                    }}
                  >
                    {copy("titleRest")}
                  </Text>
                </YStack>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    lineHeight: 23,
                  }}
                >
                  {copy("body")}
                </Text>
              </YStack>

              <YStack
                flex={1}
                minHeight={0}
                overflow="hidden"
                alignItems="center"
                justifyContent="center"
                paddingHorizontal={H_PADDING}
                onLayout={
                  stepIndex === 0 ? handleIllustrationLayout : undefined
                }
              >
                <OnboardingBackdrop
                  blobs={step.blobs}
                  ring={step.ring}
                  sparkles={step.sparkles}
                  width={illustration.width}
                  height={illustration.height}
                />
                <YStack width="100%" maxWidth={CARD_MAX_WIDTH}>
                  <Mock />
                </YStack>
              </YStack>
            </YStack>
          );
        })}
      </Animated.ScrollView>

      <YStack
        paddingHorizontal={H_PADDING}
        paddingTop={8}
        paddingBottom={Math.max(insets.bottom, 16) + 8}
      >
        <Button
          variant="primary"
          onPress={handlePress}
          accessibilityLabel={ctaLabel}
        >
          {ctaLabel}
        </Button>
      </YStack>
    </YStack>
  );
}
