import type { ComponentType } from "react";
import type {
  BlobSpec,
  RingSpec,
  SparkleSpec,
} from "./OnboardingBackdrop";
import {
  CreditsMock,
  FindWorkMock,
  GetPaidMock,
  PickJobsMock,
} from "./OnboardingMocks";

export interface OnboardingStep {
  key: string;
  /** i18n namespace under `onboarding.steps`. */
  i18nKey: string;
  Mock: ComponentType;
  blobs: BlobSpec[];
  ring: RingSpec;
  sparkles: SparkleSpec[];
}

/**
 * The four onboarding steps. Each one gets its own arrangement of background
 * shapes so the illustration visibly changes as the pager moves, rather than
 * only the copy swapping out.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: "find",
    i18nKey: "find",
    Mock: FindWorkMock,
    blobs: [
      { x: -56, y: 30, width: 236, height: 220, tone: "mid", opacity: 0.75 },
      { x: 126, y: 10, width: 214, height: 196, tone: "soft" },
      { x: 204, y: 210, width: 168, height: 168, tone: "strong", opacity: 0.35 },
    ],
    ring: { x: -34, y: 250, size: 130 },
    sparkles: [
      { x: 349, y: 96, size: 20 },
      { x: 26, y: 250, size: 16 },
      { x: 333, y: 390, size: 12 },
    ],
  },
  {
    key: "pick",
    i18nKey: "pick",
    Mock: PickJobsMock,
    blobs: [
      { x: 204, y: 40, width: 214, height: 204, tone: "mid", opacity: 0.7 },
      { x: -64, y: 160, width: 214, height: 206, tone: "soft" },
      { x: 30, y: 10, width: 150, height: 150, tone: "strong", opacity: 0.3 },
    ],
    ring: { x: 255, y: 286, size: 130 },
    sparkles: [
      { x: 349, y: 116, size: 20 },
      { x: 24, y: 270, size: 16 },
      { x: 333, y: 416, size: 12 },
    ],
  },
  {
    key: "paid",
    i18nKey: "paid",
    Mock: GetPaidMock,
    blobs: [
      { x: -60, y: 66, width: 224, height: 214, tone: "soft" },
      { x: 225, y: 182, width: 196, height: 196, tone: "mid", opacity: 0.65 },
      { x: 138, y: 10, width: 170, height: 170, tone: "strong", opacity: 0.26 },
    ],
    ring: { x: -34, y: 296, size: 130 },
    sparkles: [
      { x: 349, y: 260, size: 20 },
      { x: 24, y: 154, size: 16 },
      { x: 333, y: 426, size: 12 },
    ],
  },
  {
    key: "credits",
    i18nKey: "credits",
    Mock: CreditsMock,
    blobs: [
      { x: 94, y: 10, width: 268, height: 246, tone: "mid", opacity: 0.6 },
      { x: -70, y: 160, width: 220, height: 208, tone: "soft" },
      { x: 245, y: 276, width: 158, height: 158, tone: "strong", opacity: 0.3 },
    ],
    ring: { x: 255, y: 306, size: 130 },
    sparkles: [
      { x: 349, y: 136, size: 20 },
      { x: 24, y: 290, size: 16 },
      { x: 333, y: 436, size: 12 },
    ],
  },
];
