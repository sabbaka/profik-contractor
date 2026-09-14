import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * Two independent, one-way flags:
 *
 *   • APP_SURVEY_KEY — our own star survey. Asked once per install, the
 *     first time a client accepts one of the contractor's offers. Set
 *     whether the contractor submits or dismisses: a dismissal is an answer
 *     too, and re-asking is how survey prompts start feeling like nagging.
 *
 *   • STORE_REVIEW_KEY — stores the app version we last asked the OS to show
 *     its review prompt for. The OS already rate-limits this hard (iOS
 *     allows three prompts a year and silently drops the rest), so this only
 *     stops us from burning that quota on every completed job.
 */
const APP_SURVEY_KEY = "app_feedback_asked";
const STORE_REVIEW_KEY = "store_review_requested_version";

async function readKey(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeKey(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch {
    // Never let a storage failure break the flow that triggered it. Worst
    // case the contractor sees the prompt one extra time.
  }
}

export async function hasAskedForAppFeedback(): Promise<boolean> {
  return (await readKey(APP_SURVEY_KEY)) === "true";
}

export async function markAppFeedbackAsked(): Promise<void> {
  await writeKey(APP_SURVEY_KEY, "true");
}

export async function hasRequestedStoreReview(
  version: string,
): Promise<boolean> {
  return (await readKey(STORE_REVIEW_KEY)) === version;
}

export async function markStoreReviewRequested(version: string): Promise<void> {
  await writeKey(STORE_REVIEW_KEY, version);
}
