import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: "#FFFFFF",
      backgroundStrong: "#F7F8FA",
      backgroundHover: "#F7F8FA",
      backgroundPress: "#F3F4F6",
      backgroundFocus: "#F7F8FA",
      color: "#1A1D2E",
      colorHover: "#000000",
      colorPress: "#6B7280",
      borderColor: "#E5E7EB",
      borderColorHover: "#D1D5DB",
      borderColorFocus: "#FF6C00",
      placeholderColor: "#9CA3AF",
      shadowColor: "rgba(0,0,0,0.04)",
    },
    dark: {
      ...config.themes.dark,
      background: "#0F1117",
      backgroundStrong: "#1A1D2E",
      backgroundHover: "#1A1D2E",
      backgroundPress: "#222639",
      backgroundFocus: "#1A1D2E",
      color: "#F0F1F4",
      colorHover: "#FFFFFF",
      colorPress: "#9CA3AF",
      borderColor: "#2D3148",
      borderColorHover: "#3D4160",
      borderColorFocus: "#FF6C00",
      placeholderColor: "#6B7280",
      shadowColor: "rgba(0,0,0,0.3)",
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
