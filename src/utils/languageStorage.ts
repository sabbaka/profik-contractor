import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const LANGUAGE_KEY = "app_language";

/**
 * Every language the app ships. This is the single list the rest of the app
 * reads from — the i18next `resources` object, the profile picker and the
 * storage guard all derive from it, so adding a language is one edit here plus
 * the locale file.
 */
export const APP_LANGUAGES = ["en", "cs", "uk"] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

/**
 * Narrows an arbitrary string — `i18n.language`, a value read back from
 * storage — to a language the app actually has copy for. Returns null for
 * anything else, so the caller decides the fallback.
 */
export function toAppLanguage(
  value: string | null | undefined,
): AppLanguage | null {
  return APP_LANGUAGES.includes(value as AppLanguage)
    ? (value as AppLanguage)
    : null;
}

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  try {
    const value =
      Platform.OS === "web"
        ? localStorage.getItem(LANGUAGE_KEY)
        : await AsyncStorage.getItem(LANGUAGE_KEY);
    return toAppLanguage(value);
  } catch {
    return null;
  }
}

export async function setStoredLanguage(language: AppLanguage): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(LANGUAGE_KEY, language);
    return;
  }
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
