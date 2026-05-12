import { config } from "@tamagui/config/v3";
import { createTamagui, createTokens } from "tamagui";

const profikDarkTheme = {
  background: "#0F1117",
  backgroundHover: "#1A1D2E",
  backgroundPress: "#222639",
  backgroundFocus: "#1A1D2E",
  backgroundStrong: "#1A1D2E",
  backgroundTransparent: "rgba(15, 17, 23, 0)",
  color: "#F0F1F4",
  colorHover: "#FFFFFF",
  colorPress: "#9CA3AF",
  colorFocus: "#F0F1F4",
  colorTransparent: "rgba(240, 241, 244, 0)",
  borderColor: "#2D3148",
  borderColorHover: "#3D4160",
  borderColorFocus: "#FF6C00",
  borderColorPress: "#2D3148",
  placeholderColor: "#6B7280",
  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowColorHover: "rgba(0, 0, 0, 0.4)",
  shadowColorPress: "rgba(0, 0, 0, 0.3)",
  shadowColorFocus: "rgba(0, 0, 0, 0.3)",
} as const;

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    dark_profik: profikDarkTheme,
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
