import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const LANGUAGE_KEY = "app_language";

export type AppLanguage = "en" | "cs";

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  try {
    const value =
      Platform.OS === "web"
        ? localStorage.getItem(LANGUAGE_KEY)
        : await AsyncStorage.getItem(LANGUAGE_KEY);
    return value === "en" || value === "cs" ? value : null;
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
