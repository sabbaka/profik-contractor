import { useThemeColors } from "@/src/theme";
import { PROFIK_GRADIENT } from "@/tamagui.config";
import { LinearGradient } from "expo-linear-gradient";
import React, { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { XStack, YStack } from "tamagui";
import { Text } from "./ui";

/**
 * The mark drawn in its own 100×131 space, copied from the `Logo Mark`
 * component in `landing-page.pen`: the bowl of a `p`, its descender, and the
 * counter — which is a hole only because the sub-paths wind against each
 * other and the fill rule is non-zero. Do not "tidy" the winding direction.
 */
const MARK_PATH =
  "M0 50a50 50 0 1 1 100 0 50 50 0 1 1-100 0z m0 0l30 0 0 66a15 15 0 0 1-30 0z m30 0a20 20 0 1 0 40 0 20 20 0 1 0-40 0z";
const MARK_VIEW_BOX = "0 0 100 131";
const MARK_ASPECT = 100 / 131;

/**
 * Every proportion below is a ratio taken off the design file's display
 * lockup — a 42pt mark next to 36pt type — so one `size` drives the whole
 * thing and no call site has to restate the relationship.
 */
const MARK_HEIGHT = 42;
const WORDMARK_SIZE = 36;
const MARK_GAP = 13 / MARK_HEIGHT;
const BADGE_GAP = 13 / WORDMARK_SIZE;
const BADGE_SIZE = 12 / WORDMARK_SIZE;
/**
 * The chip's own type stops being readable before the lockup stops being
 * usable, so below this the chip grows out of proportion rather than the
 * word "PRO" turning into a smudge.
 */
const BADGE_MIN_SIZE = 10;
/** Inter Tight sets its own line box high; the lockup needs a tight one. */
const LINE_HEIGHT = 1.18;
const TRACKING = -0.032;

interface ProfikMarkProps {
  /** Height in points — the width follows the mark's fixed proportions. */
  height?: number;
  /** Flattens the mark to a single colour, for use on a coloured surface. */
  color?: string;
}

/**
 * The brand mark on its own, without the wordmark — the app-icon shape.
 * Use it where the name is already on screen (the About header) or where
 * there is no room for the full lockup.
 */
export function ProfikMark({ height = 32, color }: ProfikMarkProps) {
  // Gradient ids live in one namespace per rendered SVG tree, so two marks on
  // the same screen would otherwise both resolve to whichever painted first.
  const gradientId = `profikMark${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg
      width={Math.round(height * MARK_ASPECT)}
      height={height}
      viewBox={MARK_VIEW_BOX}
    >
      {color ? null : (
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {PROFIK_GRADIENT.mark.map((stop, i) => (
              <Stop
                key={stop}
                offset={PROFIK_GRADIENT.markStops[i]}
                stopColor={stop}
              />
            ))}
          </SvgLinearGradient>
        </Defs>
      )}
      <Path d={MARK_PATH} fill={color ?? `url(#${gradientId})`} />
    </Svg>
  );
}

/** The gradient `PRO` chip that turns the brand into the contractor app's. */
function ProBadge({ fontSize }: { fontSize: number }) {
  return (
    <YStack
      borderRadius={Math.round(fontSize * 0.58)}
      paddingVertical={Math.round(fontSize * 0.42)}
      paddingHorizontal={Math.round(fontSize * 0.75)}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <LinearGradient
        colors={PROFIK_GRADIENT.mark}
        locations={PROFIK_GRADIENT.markStops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text
        style={{
          // White on the brand gradient in either theme, so not a token.
          color: "#FFFFFF",
          fontFamily: "Inter_700Bold",
          fontSize,
          lineHeight: Math.round(fontSize * 1.2),
          letterSpacing: fontSize * 0.117,
        }}
      >
        PRO
      </Text>
    </YStack>
  );
}

interface ProfikWordmarkProps {
  /** Type size of "profik" in points; the `PRO` chip scales from it. */
  fontSize?: number;
}

/**
 * The wordmark without the mark. Pairs with `ProfikMark` when the two need
 * to stack rather than sit in a row — `ProfikLogo` is the row.
 */
export function ProfikWordmark({
  fontSize = WORDMARK_SIZE,
}: ProfikWordmarkProps) {
  const colors = useThemeColors();
  const type = {
    fontSize,
    lineHeight: Math.round(fontSize * LINE_HEIGHT),
    letterSpacing: fontSize * TRACKING,
  };
  return (
    <XStack alignItems="center" gap={Math.round(fontSize * BADGE_GAP)}>
      <Text
        style={{
          ...type,
          fontFamily: "InterTight_700Bold",
          color: colors.textPrimary,
        }}
      >
        profik
      </Text>
      <ProBadge
        fontSize={Math.max(BADGE_MIN_SIZE, Math.round(fontSize * BADGE_SIZE))}
      />
    </XStack>
  );
}

interface ProfikLogoProps {
  /** Height of the mark in points; the wordmark scales from it. */
  size?: number;
}

/**
 * The primary lockup, exactly as `landing-page.pen` draws it — mark, bold
 * `profik`, gradient `PRO` chip. This is *the* logo: there is deliberately no
 * variant prop, and nothing should hand-build a brand row out of styled
 * `Text` again.
 *
 * The wordmark reads `textPrimary` and the mark keeps its gradient, so the
 * lockup works in both themes without a separate mono variant.
 */
export function ProfikLogo({ size = 30 }: ProfikLogoProps) {
  return (
    <XStack alignItems="center" gap={Math.round(size * MARK_GAP)}>
      <ProfikMark height={size} />
      <ProfikWordmark
        fontSize={Math.round((size * WORDMARK_SIZE) / MARK_HEIGHT)}
      />
    </XStack>
  );
}

export default ProfikLogo;
