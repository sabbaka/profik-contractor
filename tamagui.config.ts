import { config } from "@tamagui/config/v3";
import { createAnimations } from "@tamagui/animations-moti";
import { createTamagui } from "tamagui";

/**
 * `@tamagui/config/v3`'s native driver is `@tamagui/animations-react-native`
 * — the classic RN `Animated` API, not `react-native-reanimated`, even
 * though this app has Reanimated installed and uses it elsewhere (the Sheet
 * pan-to-dismiss gesture, `react-native-keyboard-controller`). Every Tamagui
 * `animation="..."` prop — a Sheet's slide-in, its overlay fade, a Button's
 * press state — was riding the JS thread because of that, which is what
 * made every bottom sheet in the app (filters, app review, ...) feel like it
 * dropped frames on open: the app's own frames compete with Tamagui's for
 * the same JS thread during the transition.
 *
 * `@tamagui/animations-moti` runs the identical preset shape on Reanimated's
 * UI thread instead, so this only swaps the driver — the preset values below
 * are copied verbatim from `@tamagui/config`'s own
 * `animationsReactNative.native.js`, so every existing `animation="medium"` /
 * `"lazy"` / `"quick"` etc. call site keeps its current feel, just off the
 * JS thread. Keep the two in step if a preset here is ever tuned.
 */
const animations = createAnimations({
  "75ms": { type: "timing", duration: 75 },
  "100ms": { type: "timing", duration: 100 },
  "200ms": { type: "timing", duration: 200 },
  superBouncy: { type: "spring", damping: 5, mass: 0.7, stiffness: 200 },
  bouncy: { type: "spring", damping: 9, mass: 0.9, stiffness: 150 },
  lazy: { type: "spring", damping: 18, stiffness: 50 },
  medium: { damping: 15, stiffness: 120, mass: 1 },
  slowest: { type: "spring", damping: 15, stiffness: 10 },
  slow: { type: "spring", damping: 15, stiffness: 40 },
  quick: { type: "spring", damping: 20, mass: 1.2, stiffness: 250 },
  tooltip: { type: "spring", damping: 10, mass: 0.9, stiffness: 100 },
  quicker: { type: "spring", damping: 20, mass: 1, stiffness: 250 },
  quickest: { damping: 14, mass: 0.1, stiffness: 380 },
});

/**
 * The Profik brand gradient — the single source of this colour pair.
 *
 * Deliberately theme-independent: it is the brand mark, not a themed surface,
 * so it is a module constant rather than a theme token, and it reads the same
 * in light and dark. The `accentGradStart` / `accentGradEnd` tokens below are
 * derived from it so the two can never drift.
 *
 * Change the brand gradient here (and in the sibling app's identical copy of
 * this file) — nowhere else should carry these hex values.
 */
export const PROFIK_GRADIENT = {
  accent: ["#FF8A2B", "#E85D00"] as const,
};

/**
 * Profik design tokens — extracted directly from `profi-design.pen`.
 * Light theme + dark theme (mode: "light" | "dark" in the design file).
 *
 * The accent colour is an orange `#FF6C00`. The whole UI uses three font
 * families: Inter (body / labels), Geist (display headings) and Geist Mono
 * (numbers, prices). Backgrounds layer as bg-primary → bg-secondary → bg-card.
 */
const lightTokens = {
  accent: "#FF6C00",
  accentGradStart: PROFIK_GRADIENT.accent[0],
  accentGradEnd: PROFIK_GRADIENT.accent[1],
  accentLight: "#FFF4EB",

  bgPrimary: "#FFFFFF",
  bgSecondary: "#F7F8FA",
  bgCard: "#FFFFFF",
  surfaceInput: "#F3F4F6",

  borderToken: "#E5E7EB",
  borderSelected: "#FF6C00",
  borderSubtle: "#F0F0F0",
  divider: "#F3F4F6",

  textPrimary: "#1A1D2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  success: "#10B981",
  successText: "#059669",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  warningText: "#D97706",
  danger: "#EF4444",
  dangerStrong: "#DC2626",
  dangerBg: "#FEE2E2",
  info: "#3B82F6",
  infoStrong: "#2563EB",
  infoBg: "#DBEAFE",
  purple: "#8B5CF6",
  purpleBg: "#EDE9FE",
  greenBg: "#D1FAE5",
  greenStrong: "#16A34A",
  greenSoftBg: "#F0FDF4",

  statusOpenBg: "#DBEAFE",
  statusOpenText: "#2563EB",
  statusOpenDot: "#60A5FA",
  statusCompletedBg: "#D1FAE5",
  statusCompletedText: "#059669",
  statusCompletedDot: "#10B981",
  statusCancelledBg: "#FEE2E2",
  statusCancelledText: "#DC2626",
  statusCancelledDot: "#EF4444",
  statusInProgressBg: "#FEF3C7",
  statusInProgressText: "#D97706",
  statusInProgressDot: "#F59E0B",

  shadowCard: "rgba(0,0,0,0.04)",

  blobSoft: "#FFEEE0",
  blobMid: "#FFD8B5",
  blobStrong: "#FFC894",
  blobRing: "#FFC894",
  shadowFloat: "rgba(0,0,0,0.12)",
};

const darkTokens: typeof lightTokens = {
  accent: "#FF6C00",
  accentGradStart: PROFIK_GRADIENT.accent[0],
  accentGradEnd: PROFIK_GRADIENT.accent[1],
  accentLight: "#3D2414",

  bgPrimary: "#0F1117",
  bgSecondary: "#1A1D2E",
  bgCard: "#222639",
  surfaceInput: "#1E2235",

  borderToken: "#2D3148",
  borderSelected: "#FF6C00",
  borderSubtle: "#2D3148",
  divider: "#2D3148",

  textPrimary: "#F0F1F4",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  textInverse: "#FFFFFF",

  success: "#10B981",
  successText: "#34D399",
  warning: "#F59E0B",
  warningBg: "#3D2A0A",
  warningText: "#FBBF24",
  danger: "#EF4444",
  dangerStrong: "#F87171",
  dangerBg: "#3F1212",
  info: "#3B82F6",
  infoStrong: "#60A5FA",
  infoBg: "#1E3A5F",
  purple: "#A78BFA",
  purpleBg: "#2A1B5C",
  greenBg: "#064E3B",
  greenStrong: "#34D399",
  greenSoftBg: "#0E2A1A",

  statusOpenBg: "#1E3A5F",
  statusOpenText: "#93C5FD",
  statusOpenDot: "#60A5FA",
  statusCompletedBg: "#064E3B",
  statusCompletedText: "#6EE7B7",
  statusCompletedDot: "#10B981",
  statusCancelledBg: "#7F1D1D",
  statusCancelledText: "#FCA5A5",
  statusCancelledDot: "#F87171",
  statusInProgressBg: "#3D2A0A",
  statusInProgressText: "#FBBF24",
  statusInProgressDot: "#F59E0B",

  shadowCard: "rgba(0,0,0,0.2)",

  blobSoft: "#2B1D14",
  blobMid: "#43281A",
  blobStrong: "#7A4415",
  blobRing: "#5A3A1E",
  shadowFloat: "rgba(0,0,0,0.4)",
};

const lightTheme = {
  ...config.themes.light,
  background: lightTokens.bgPrimary,
  backgroundHover: lightTokens.bgSecondary,
  backgroundPress: lightTokens.bgSecondary,
  backgroundFocus: lightTokens.bgSecondary,
  backgroundStrong: lightTokens.bgSecondary,
  color: lightTokens.textPrimary,
  colorHover: lightTokens.textPrimary,
  colorPress: lightTokens.textPrimary,
  colorFocus: lightTokens.textPrimary,
  borderColor: lightTokens.borderToken,
  borderColorHover: lightTokens.borderSubtle,
  borderColorFocus: lightTokens.accent,
  borderColorPress: lightTokens.borderSubtle,
  placeholderColor: lightTokens.textMuted,
  ...lightTokens,
};

const darkTheme = {
  ...config.themes.dark,
  background: darkTokens.bgPrimary,
  backgroundHover: darkTokens.bgSecondary,
  backgroundPress: darkTokens.bgSecondary,
  backgroundFocus: darkTokens.bgSecondary,
  backgroundStrong: darkTokens.bgSecondary,
  color: darkTokens.textPrimary,
  colorHover: darkTokens.textPrimary,
  colorPress: darkTokens.textPrimary,
  colorFocus: darkTokens.textPrimary,
  borderColor: darkTokens.borderToken,
  borderColorHover: darkTokens.borderSubtle,
  borderColorFocus: darkTokens.accent,
  borderColorPress: darkTokens.borderSubtle,
  placeholderColor: darkTokens.textMuted,
  ...darkTokens,
};

const profikConfig = createTamagui({
  ...config,
  animations,
  themes: {
    ...config.themes,
    light: lightTheme,
    dark: darkTheme,
  },
});

export type ProfikConfig = typeof profikConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends ProfikConfig {}
}

export default profikConfig;
