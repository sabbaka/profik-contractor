import { useBlockUserMutation } from "@/src/api/profikApi";
import { extractErrorMessage } from "@/src/features/auth/types";
import { logError } from "@/src/utils/logger";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * Blocks a client after asking first. A block is undone only from Profile →
 * Blocked, so it is never one tap away from a menu: the confirmation says
 * what will happen and where to take it back.
 *
 * `onBlocked` runs once the server has the block — the chat uses it to leave,
 * since the conversation is no longer in this account's list.
 */
export function useBlockUser() {
  const { t } = useTranslation();
  const [blockUser, { isLoading }] = useBlockUserMutation();

  const confirmBlock = useCallback(
    (user: { id: string; name?: string | null }, onBlocked?: () => void) => {
      const name = user.name?.trim() || t("messages.unnamedClient");
      Alert.alert(t("block.confirmTitle", { name }), t("block.confirmBody"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("block.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(user.id).unwrap();
              onBlocked?.();
            } catch (err) {
              logError(err);
              Alert.alert(t("common.error"), extractErrorMessage(err, t));
            }
          },
        },
      ]);
    },
    [blockUser, t],
  );

  return { confirmBlock, isBlocking: isLoading };
}
