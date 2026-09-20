import { useMeQuery } from "@/src/api/profikApi";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
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
  const hideSub = useRef<ReturnType<typeof Keyboard.addListener> | null>(null);

  useEffect(
    () => () => {
      hideSub.current?.remove();
      hideSub.current = null;
    },
    [],
  );

  // The sheet rides over the keyboard on a show event it hears while already
  // mounted, so opening it on top of a keyboard that is *already* up leaves it
  // underneath: no show event ever fires, and the sheet focusing its own input
  // only hands first responder between two fields, which doesn't emit one
  // either. Letting the keyboard go down first restores the order the sheet
  // expects — it opens, focuses its input, and rides that show event up.
  const openPrompt = useCallback(() => {
    if (!Keyboard.isVisible()) {
      setOpen(true);
      return;
    }
    hideSub.current?.remove();
    hideSub.current = Keyboard.addListener("keyboardDidHide", () => {
      hideSub.current?.remove();
      hideSub.current = null;
      setOpen(true);
    });
    Keyboard.dismiss();
  }, []);

  const withName = useCallback(
    (action: () => void) => {
      if (user?.name?.trim()) {
        action();
        return;
      }
      pendingAction.current = action;
      openPrompt();
    },
    [openPrompt, user?.name],
  );

  const onOpenChange = useCallback((next: boolean) => {
    if (!next) {
      hideSub.current?.remove();
      hideSub.current = null;
    }
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
