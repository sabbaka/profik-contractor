import { useThemeColors } from "@/src/theme";
import { Sparkle } from "@tamagui/lucide-icons";
import React from "react";
import { View } from "react-native";

/** Layout coordinates in the design file are relative to a 390 x 500 canvas. */
const BASE_WIDTH = 390;
const BASE_HEIGHT = 500;

export type BlobTone = "soft" | "mid" | "strong";

export interface BlobSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: BlobTone;
  opacity?: number;
}

export interface RingSpec {
  x: number;
  y: number;
  size: number;
}

export interface SparkleSpec {
  x: number;
  y: number;
  size: number;
}

interface OnboardingBackdropProps {
  blobs: BlobSpec[];
  ring: RingSpec;
  sparkles: SparkleSpec[];
  /** Measured size of the illustration area the backdrop fills. */
  width: number;
  height: number;
}

/**
 * The soft orange shapes sitting behind each onboarding illustration: three
 * overlapping blobs, one outlined ring and a few sparkles. Purely decorative,
 * so it is hidden from screen readers and never intercepts touches.
 *
 * Positions come straight from the design and are scaled to the real viewport,
 * which keeps the composition intact on both small and large phones.
 */
export function OnboardingBackdrop({
  blobs,
  ring,
  sparkles,
  width,
  height,
}: OnboardingBackdropProps) {
  const colors = useThemeColors();
  const scaleX = width / BASE_WIDTH;
  const scaleY = height > 0 ? height / BASE_HEIGHT : 1;

  const toneColor: Record<BlobTone, string> = {
    soft: colors.blobSoft,
    mid: colors.blobMid,
    strong: colors.blobStrong,
  };

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ ...StyleSheetAbsoluteFill, overflow: "hidden" }}
    >
      {blobs.map((blob, index) => (
        <View
          key={`blob-${index}`}
          style={{
            position: "absolute",
            left: blob.x * scaleX,
            top: blob.y * scaleY,
            width: blob.width * scaleX,
            height: blob.height * scaleY,
            borderRadius: 9999,
            opacity: blob.opacity ?? 1,
            backgroundColor: toneColor[blob.tone],
          }}
        />
      ))}

      <View
        style={{
          position: "absolute",
          left: ring.x * scaleX,
          top: ring.y * scaleY,
          width: ring.size * scaleX,
          height: ring.size * scaleY,
          borderRadius: 9999,
          borderWidth: 1.5,
          borderColor: colors.blobRing,
          opacity: 0.6,
        }}
      />

      {sparkles.map((sparkle, index) => (
        <View
          key={`sparkle-${index}`}
          style={{
            position: "absolute",
            left: sparkle.x * scaleX,
            top: sparkle.y * scaleY,
            opacity: 0.85,
          }}
        >
          <Sparkle size={sparkle.size} color={colors.accent} />
        </View>
      ))}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;
