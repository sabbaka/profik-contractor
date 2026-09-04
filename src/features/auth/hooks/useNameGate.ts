import { useMeQuery } from "@/src/api/profikApi";
import { useCallback, useRef, useState } from "react";
import { useIsGuest } from "./useIsGuest";

export interface NameGateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export interface UseNameGateReturn {
  /**
   * Runs `action` straight away when the profile already has a name, otherwise
   * opens the prompt and runs it once a name has been saved.
   */
  withName: (action: () => void) => void;
  nameSheetProps: NameGateSheetProps;
}

/**
 * Signing up takes a phone number and nothing else, so an account can reach the
 * point of making an offer with `name` still null — and the client choosing
 * between offers has to see who each one is from. This asks for it there, once,
 * instead of putting a field in front of everyone at registration.
 *
 * The caller renders `<NamePromptSheet {...nameSheetProps} />` and wraps the
 * action it wants gated in `withName`.
 */
export function useNameGate(): UseNameGateReturn {
  const isGuest = useIsGuest();
  const { data: user } = useMeQuery(undefined, { skip: isGuest });
  const [open, setOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const withName = useCallback(
    (action: () => void) => {
      if (user?.name?.trim()) {
        action();
        return;
      }
      pendingAction.current = action;
      setOpen(true);
    },
    [user?.name],
  );

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    // Dismissing abandons the action rather than queueing it for later —
    // otherwise closing the sheet would silently send the offer anyway.
    if (!next) pendingAction.current = null;
  }, []);

  const onSaved = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setOpen(false);
    action?.();
  }, []);

  return { withName, nameSheetProps: { open, onOpenChange, onSaved } };
}
