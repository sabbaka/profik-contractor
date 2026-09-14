import {
  hasRequestedStoreReview,
  markStoreReviewRequested,
} from "@/src/utils/appFeedbackStorage";
import { logError } from "@/src/utils/logger";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";

/**
 * Asks the OS to show its own review prompt.
 *
 * Deliberately unconditional on how the contractor feels about the app:
 * filtering the prompt by expected sentiment is what Apple and Google both
 * call review manipulation. The trigger is behavioural — a job the
 * contractor was hired for just got marked complete — and nothing here
 * reads the rating from `AppFeedbackSheet`'s own survey.
 *
 * The OS decides whether anything is actually shown and never tells us, so
 * this resolves the same way whether a prompt appeared or not. Never await
 * it to gate navigation.
 */
export async function maybeRequestStoreReview(): Promise<void> {
  try {
    const version = Constants.expoConfig?.version ?? "unknown";
    if (await hasRequestedStoreReview(version)) return;

    if (!(await StoreReview.hasAction())) return;

    // Mark before requesting: if the OS did show the prompt, asking again on
    // the next completed job would be worse than skipping one silent no-op.
    await markStoreReviewRequested(version);
    await StoreReview.requestReview();
  } catch (error) {
    logError(error, "storeReview:request");
  }
}
