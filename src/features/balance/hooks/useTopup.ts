import { useMeQuery, useTopupBalanceMutation } from "@/src/api/profikApi";
import { track } from "@/src/utils/analytics";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { extractErrorMessage } from "@/src/features/auth/types";
import { TopupResult } from "../types";
import { waitForBalanceIncrease } from "../waitForBalanceIncrease";

export interface UseTopupReturn {
  topup: (amount: number) => Promise<TopupResult>;
  isLoading: boolean;
  balance: number | undefined;
  isBalanceLoading: boolean;
  refetchBalance: () => void;
}

export function useTopup(): UseTopupReturn {
  const { t } = useTranslation();
  const {
    data: user,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const [topupMutation, { isLoading }] = useTopupBalanceMutation();

  const topup = async (amount: number): Promise<TopupResult> => {
    try {
      // Stripe rejects bare-scheme URLs ("profikcontractor://") as invalid,
      // so the redirect URI must include a path.
      const returnUrl = AuthSession.makeRedirectUri({
        scheme: "profikcontractor",
        path: "payments/return",
      });
      WebBrowser.maybeCompleteAuthSession();

      const res = await topupMutation({ amount, returnUrl }).unwrap();
      const result = await WebBrowser.openAuthSessionAsync(res.url, returnUrl);

      if (
        result.type === "success" ||
        result.type === "dismiss" ||
        result.type === "cancel"
      ) {
        // The webhook may not have credited the balance yet when the browser
        // hands control back — see `waitForBalanceIncrease`.
        const { balanceUpdated, finalBalance } = await waitForBalanceIncrease(
          refetchBalance,
          user?.balance ?? 0,
        );

        if (balanceUpdated) {
          // The requested amount, not the delta actually credited — the two
          // should be the same number, but this is what the reader asked
          // for, and it is the one PostHog can report on regardless of
          // whether the poll above caught the exact webhook.
          track("balance_topup_payment_completed", {
            amount_kc: amount,
            balance_after_kc: finalBalance,
            provider: "stripe",
          });
        }

        return { success: true, balanceUpdated, newBalance: finalBalance };
      }

      return { success: true, balanceUpdated: false };
    } catch (err: unknown) {
      // A refused checkout with a code reads as itself in the reader's
      // language; anything else — no code, a dropped connection, a thrown
      // Error — is our own top-up failure line, never the server's English.
      const errorMessage = extractErrorMessage(err, t, "balance.topupFailed");
      Alert.alert(t("common.error"), errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    topup,
    isLoading,
    balance: user?.balance,
    isBalanceLoading,
    refetchBalance,
  };
}
