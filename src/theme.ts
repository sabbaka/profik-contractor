import React, { createContext, useContext, useState, useMemo } from "react";

export type ThemeMode = "light" | "dark";

const shared = {
  accent: "#FF6C00",
  accentGradientStart: "#FF8A2B",
  accentGradientEnd: "#E85D00",
  borderSelected: "#FF6C00",
  textInverse: "#FFFFFF",
  success: "#10B981",
  error: "#EF4444",
} as const;

export const lightColors = {
  ...shared,
  bgPrimary: "#FFFFFF",
  bgSecondary: "#F7F8FA",
  bgCard: "#FFFFFF",
  surfaceInput: "#F3F4F6",
  border: "#E5E7EB",
  accentLight: "#FFF4EB",
  textPrimary: "#1A1D2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  shadowCard: "#0000000A",
  statusOpen: "#DBEAFE",
  statusOpenText: "#2563EB",
  statusCompleted: "#D1FAE5",
  statusCompletedText: "#059669",
  statusCancelled: "#FEE2E2",
  statusCancelledText: "#DC2626",
  statusPending: "#FEF3C7",
  statusPendingText: "#D97706",
} as const;

export const darkColors = {
  ...shared,
  bgPrimary: "#0F1117",
  bgSecondary: "#1A1D2E",
  bgCard: "#222639",
  surfaceInput: "#1E2235",
  border: "#2D3148",
  accentLight: "#3D2414",
  textPrimary: "#F0F1F4",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  shadowCard: "#00000033",
  statusOpen: "#1E3A5F",
  statusOpenText: "#60A5FA",
  statusCompleted: "#064E3B",
  statusCompletedText: "#34D399",
  statusCancelled: "#7F1D1D",
  statusCancelledText: "#F87171",
  statusPending: "#78350F",
  statusPendingText: "#FBBF24",
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  colors: lightColors,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children, defaultMode = "light" }: { children: React.ReactNode; defaultMode?: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const colors = mode === "light" ? lightColors : darkColors;
  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  const value = useMemo(() => ({ mode, colors, setMode, toggle }), [mode, colors]);
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  return { mode: ctx.mode, setMode: ctx.setMode, toggle: ctx.toggle };
}

// Backward compat - default to light
export const colors = lightColors;
