import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import type { CachedTerms } from "@/src/features/auth/terms";

const TERMS_STATE_KEY = "terms_state";

/**
 * The last thing the server said about this account's terms, kept so a launch
 * can decide which screen to paint without waiting for the network.
 *
 * Without it, `AuthGate` would have to block the first frame on `/auth/me` —
 * a round trip added to every launch for the sake of the rare account that
 * still owes an acceptance, and a launch with no network would paint nothing
 * at all. With it, the cached answer decides immediately and the live answer
 * corrects it a moment later if they disagree.
 *
 * Reads never throw: storage that is unavailable, cleared or holding something
 * unparseable answers null, and null means "ask the server", which is the safe
 * direction. Same shape as `onboardingStorage`, which the same gate already
 * waits on.
 */
export async function getCachedTerms(): Promise<CachedTerms | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? localStorage.getItem(TERMS_STATE_KEY)
        : await AsyncStorage.getItem(TERMS_STATE_KEY);

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as CachedTerms).required === "boolean" &&
      typeof (parsed as CachedTerms).currentVersion === "string"
    ) {
      return parsed as CachedTerms;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedTerms(value: CachedTerms): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(TERMS_STATE_KEY, serialized);
      return;
    }
    await AsyncStorage.setItem(TERMS_STATE_KEY, serialized);
  } catch {
    // A cache that cannot be written costs one bounce through the consent
    // screen on the next cold launch. Not worth failing the sign-in that was
    // trying to save it.
  }
}

/**
 * Called on sign-out: the next account to sign in on this device must not
 * inherit the previous one's answer.
 */
export async function clearCachedTerms(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(TERMS_STATE_KEY);
      return;
    }
    await AsyncStorage.removeItem(TERMS_STATE_KEY);
  } catch {
    // Same reasoning as above, and the live answer still governs.
  }
}
