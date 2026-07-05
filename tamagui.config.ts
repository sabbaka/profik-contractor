import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

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
  accentHover: "#E85D00",
  accentPress: "#C24E00",
  accentGradStart: "#FF8A2B",
  accentGradEnd: "#E85D00",
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
  purpleStrong: "#7C3AED",
  purpleBg: "#EDE9FE",
  teal: "#0D9488",
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
};

const darkTokens: typeof lightTokens = {
  accent: "#FF6C00",
  accentHover: "#FF8A2B",
  accentPress: "#E85D00",
  accentGradStart: "#FF8A2B",
  accentGradEnd: "#E85D00",
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
  purpleStrong: "#C4B5FD",
  purpleBg: "#2A1B5C",
  teal: "#2DD4BF",
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

export const PROFIK_GRADIENT = {
  accent: ["#FF8A2B", "#E85D00"] as const,
};

export default profikConfig;
