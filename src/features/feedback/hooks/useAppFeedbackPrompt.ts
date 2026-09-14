import {
  hasAskedForAppFeedback,
  markAppFeedbackAsked,
} from "@/src/utils/appFeedbackStorage";
import { useCallback, useState } from "react";

/**
 * Owns the "should we show the app survey" decision so screens don't have to.
 *
 * `requestPrompt()` is called once a client's acceptance of the contractor's
 * offer is visible on screen. It resolves the storage flag first, so a
 * contractor who already answered (or dismissed) never sees it again on this
 * install.
 */
export function useAppFeedbackPrompt() {
  const [isOpen, setIsOpen] = useState(false);

  const requestPrompt = useCallback(async () => {
    if (await hasAskedForAppFeedback()) return;
    setIsOpen(true);
  }, []);

  // Dismissing counts as answering: mark it here rather than only on submit,
  // otherwise every accepted offer re-opens the sheet for the same user.
  const closePrompt = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) void markAppFeedbackAsked();
  }, []);

  return { isOpen, requestPrompt, closePrompt };
}
