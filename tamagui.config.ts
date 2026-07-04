import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

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
  dangerBg: "#FEE2E2",
  info: "#3B82F6",
  infoBg: "#DBEAFE",
  purple: "#8B5CF6",
  purpleBg: "#EDE9FE",
  greenBg: "#D1FAE5",
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
  dangerBg: "#3F1212",
  info: "#60A5FA",
  infoBg: "#1E3A5F",
  purple: "#A78BFA",
  purpleBg: "#2A1B5C",
  greenBg: "#064E3B",
};

const makeTheme = (base: typeof config.themes.light, tokens: typeof lightTokens) => ({
  ...base,
  background: tokens.bgPrimary,
  backgroundHover: tokens.bgSecondary,
  backgroundPress: tokens.surfaceInput,
  backgroundFocus: tokens.bgSecondary,
  backgroundStrong: tokens.bgSecondary,
  color: tokens.textPrimary,
  colorHover: tokens.textPrimary,
  colorPress: tokens.textSecondary,
  colorFocus: tokens.textPrimary,
  borderColor: tokens.borderToken,
  borderColorHover: tokens.borderSubtle,
  borderColorFocus: tokens.accent,
  borderColorPress: tokens.borderSubtle,
  placeholderColor: tokens.textMuted,
  ...tokens,
});

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: makeTheme(config.themes.light, lightTokens),
    dark: makeTheme(config.themes.dark, darkTokens),
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
