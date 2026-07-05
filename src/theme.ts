import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { useTheme } from "tamagui";
import {
  AppearancePreference,
  getStoredAppearance,
  setStoredAppearance,
} from "./utils/appearanceStorage";

export type ThemeMode = "light" | "dark";
export type { AppearancePreference };

/**
 * The palette lives in `tamagui.config.ts` (the shared Profik design tokens,
 * light + dark). This module only decides *which* theme is active and exposes
 * `useThemeColors()` as a thin compatibility shim over tamagui's `useTheme()`
 * for components that consume colors as a plain object.
 */

interface ThemeContextValue {
  /** Resolved mode actually rendered ("system" preference is resolved here). */
  mode: ThemeMode;
  /** What the user picked: follow the device, or force light/dark. */
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
  /** Legacy compat: force an explicit mode. */
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  preference: "system",
  setPreference: () => {},
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({
  children,
  defaultPreference = "system",
}: {
  children: React.ReactNode;
  defaultPreference?: AppearancePreference;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<AppearancePreference>(defaultPreference);

  useEffect(() => {
    getStoredAppearance().then((stored) => {
      if (stored) setPreferenceState(stored);
    });
  }, []);

  const mode: ThemeMode =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const value = useMemo<ThemeContextValue>(() => {
    const setPreference = (next: AppearancePreference) => {
      setPreferenceState(next);
      setStoredAppearance(next).catch(() => {});
    };
    return {
      mode,
      preference,
      setPreference,
      setMode: (next: ThemeMode) => setPreference(next),
      toggle: () => setPreference(mode === "light" ? "dark" : "light"),
    };
  }, [mode, preference]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  return {
    mode: ctx.mode,
    preference: ctx.preference,
    setPreference: ctx.setPreference,
    setMode: ctx.setMode,
    toggle: ctx.toggle,
  };
}

/** Same key set the old static palette exposed — call sites stay unchanged. */
export interface ThemeColors {
  accent: string;
  accentGradientStart: string;
  accentGradientEnd: string;
  accentLight: string;
  borderSelected: string;
  textInverse: string;
  success: string;
  error: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  surfaceInput: string;
  border: string;
  borderSubtle: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  shadowCard: string;
  statusOpen: string;
  statusOpenText: string;
  statusCompleted: string;
  statusCompletedText: string;
  statusCancelled: string;
  statusCancelledText: string;
  statusPending: string;
  statusPendingText: string;
  warning: string;
  warningBg: string;
  warningText: string;
  dangerBg: string;
  dangerStrong: string;
  info: string;
  infoBg: string;
  infoStrong: string;
  purple: string;
  purpleBg: string;
  greenStrong: string;
  greenSoftBg: string;
}

/**
 * Compatibility shim: resolves the active tamagui theme into the plain color
 * object the app's components consume. Key names kept from the old palette;
 * where they differ from the design tokens the mapping is:
 *   error → danger, border → borderToken, statusPending → statusInProgress*,
 *   statusOpen/Completed/Cancelled → status*Bg.
 */
export function useThemeColors(): ThemeColors {
  const t = useTheme();
  return {
    accent: t.accent?.val,
    accentGradientStart: t.accentGradStart?.val,
    accentGradientEnd: t.accentGradEnd?.val,
    accentLight: t.accentLight?.val,
    borderSelected: t.borderSelected?.val,
    textInverse: t.textInverse?.val,
    success: t.success?.val,
    error: t.danger?.val,
    bgPrimary: t.bgPrimary?.val,
    bgSecondary: t.bgSecondary?.val,
    bgCard: t.bgCard?.val,
    surfaceInput: t.surfaceInput?.val,
    border: t.borderToken?.val,
    borderSubtle: t.borderSubtle?.val,
    divider: t.divider?.val,
    textPrimary: t.textPrimary?.val,
    textSecondary: t.textSecondary?.val,
    textMuted: t.textMuted?.val,
    shadowCard: t.shadowCard?.val,
    statusOpen: t.statusOpenBg?.val,
    statusOpenText: t.statusOpenText?.val,
    statusCompleted: t.statusCompletedBg?.val,
    statusCompletedText: t.statusCompletedText?.val,
    statusCancelled: t.statusCancelledBg?.val,
    statusCancelledText: t.statusCancelledText?.val,
    statusPending: t.statusInProgressBg?.val,
    statusPendingText: t.statusInProgressText?.val,
    warning: t.warning?.val,
    warningBg: t.warningBg?.val,
    warningText: t.warningText?.val,
    dangerBg: t.dangerBg?.val,
    dangerStrong: t.dangerStrong?.val,
    info: t.info?.val,
    infoBg: t.infoBg?.val,
    infoStrong: t.infoStrong?.val,
    purple: t.purple?.val,
    purpleBg: t.purpleBg?.val,
    greenStrong: t.greenStrong?.val,
    greenSoftBg: t.greenSoftBg?.val,
  };
}
