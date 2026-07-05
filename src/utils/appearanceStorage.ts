import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const APPEARANCE_KEY = "app_appearance";

export type AppearancePreference = "system" | "light" | "dark";

export async function getStoredAppearance(): Promise<AppearancePreference | null> {
  try {
    const value =
      Platform.OS === "web"
        ? localStorage.getItem(APPEARANCE_KEY)
        : await AsyncStorage.getItem(APPEARANCE_KEY);
    return value === "system" || value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export async function setStoredAppearance(preference: AppearancePreference): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(APPEARANCE_KEY, preference);
    return;
  }
  await AsyncStorage.setItem(APPEARANCE_KEY, preference);
}
