import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const ONBOARDING_SEEN_KEY = "onboarding_seen";
const listeners = new Set<(value: boolean) => void>();

export function subscribeToOnboardingState(
  listener: (value: boolean) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyOnboardingState(value: boolean): void {
  listeners.forEach((listener) => listener(value));
}

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(ONBOARDING_SEEN_KEY) === "true";
    }
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(value = true): Promise<void> {
  const serialized = value ? "true" : "false";
  if (Platform.OS === "web") {
    localStorage.setItem(ONBOARDING_SEEN_KEY, serialized);
    notifyOnboardingState(value);
    return;
  }
  await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, serialized);
  notifyOnboardingState(value);
}

export async function clearHasSeenOnboarding(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(ONBOARDING_SEEN_KEY);
    notifyOnboardingState(false);
    return;
  }
  await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
  notifyOnboardingState(false);
}
