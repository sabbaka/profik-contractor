import { useMeQuery, useTopupBalanceMutation } from "@/src/api/profikApi";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { TopupResult } from "../types";

export interface UseTopupReturn {
  topup: (amount: number) => Promise<TopupResult>;
  isLoading: boolean;
  balance: number | undefined;
  isBalanceLoading: boolean;
  refetchBalance: () => void;
}

export function useTopup(): UseTopupReturn {
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
      const returnUrl = AuthSession.makeRedirectUri({ scheme: "profik" });
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

        // Poll for balance update
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
      const errorMessage =
        (err as any)?.data?.message || "Failed to start top-up session";
      Alert.alert("Error", errorMessage);
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

