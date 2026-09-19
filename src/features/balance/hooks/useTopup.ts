import { useMeQuery, useTopupBalanceMutation } from "@/src/api/profikApi";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { extractErrorMessage } from "@/src/features/auth/types";
import { TopupResult } from "../types";

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
        const startBalance = user?.balance ?? 0;
        let balanceUpdated = false;

        // Polling, not an invalidation gap: Stripe credits the balance from
        // its webhook, so at the moment the browser hands control back the
        // money may genuinely not be there yet. Nothing the cache knows can
        // shorten that — this waits for the server to catch up. Do not replace
        // it with a tag invalidation.
        let finalBalance = startBalance;
        for (let i = 0; i < 5; i++) {
          const r = await refetchBalance();
          const newBalance = r.data?.balance ?? startBalance;

          if (newBalance > startBalance) {
            balanceUpdated = true;
            finalBalance = newBalance;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (!balanceUpdated) {
          const r = await refetchBalance();
          finalBalance = r.data?.balance ?? startBalance;
        }

        return { success: true, balanceUpdated, newBalance: finalBalance };
      }

      return { success: true, balanceUpdated: false };
    } catch (err: unknown) {
      // Only a reply from the server is worth quoting. `err.data.message`
      // used to be read straight out and handed to Alert.alert, which is typed
      // string — the server's validation failures arrive as an array of rules,
      // and under the new architecture that killed the call rather than
      // printing oddly. The shared extractor resolves an error code out of
      // `errors.*` first, so a refused checkout reads in the reader's
      // language; anything with no server body at all (a dropped connection,
      // a thrown Error) stays our own translated line rather than leaking a
      // stack message onto the screen.
      const fromServer =
        err && typeof err === "object" && "data" in err && err.data
          ? extractErrorMessage(err, t)
          : null;
      const errorMessage = fromServer || t("balance.topupFailed");
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
