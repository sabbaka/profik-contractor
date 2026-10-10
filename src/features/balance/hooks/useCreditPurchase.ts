import { profikApi, useMeQuery } from "@/src/api/profikApi";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import type { AppDispatch } from "@/src/store";
import { track } from "@/src/utils/analytics";
import { logError } from "@/src/utils/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useDispatch } from "react-redux";
import { CREDITS_OFFERING_ID, creditsForProduct } from "../creditPacks";
import {
  configurePurchases,
  inAppPurchasesAvailable,
  logInPurchaser,
  purchasesConfigured,
  purchasesSdk,
} from "../purchases";
import { waitForBalanceIncrease } from "../waitForBalanceIncrease";

/** One App Store pack, ready to show and to buy. */
export interface CreditPack {
  productId: string;
  /** For display only — the server decides what a purchase credits. */
  credits: number;
  /** StoreKit's localized price, in the App Store account's currency. */
  priceString: string;
  price: number;
  pkg: PurchasesPackage;
}

/**
 * - `unavailable`: this build cannot sell — no RevenueCat key, or no `credits`
 *   Offering with packs this app knows. Retrying will not help.
 * - `failed`: the packs could not be loaded this time; a retry may.
 */
export type CreditPacksState = "unavailable" | "loading" | "ready" | "failed";

export type CreditPurchaseResult =
  | { status: "completed"; balanceUpdated: boolean; newBalance: number }
  | { status: "pending" }
  | { status: "cancelled" }
  | { status: "failed" };

export interface UseCreditPurchaseReturn {
  state: CreditPacksState;
  /** Cheapest first. */
  packs: CreditPack[];
  /** The product being bought, while the App Store sheet or the poll runs. */
  purchasingId: string | null;
  reload: () => void;
  purchase: (pack: CreditPack) => Promise<CreditPurchaseResult>;
}

const errorCode = (error: unknown): string | undefined => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
};

interface LoadedPacks {
  state: CreditPacksState;
  packs: CreditPack[];
}

/** Reads the `credits` Offering and keeps the packs this app can label. */
async function loadCreditPacks(): Promise<LoadedPacks> {
  configurePurchases();
  if (!inAppPurchasesAvailable() || !purchasesConfigured()) {
    return { state: "unavailable", packs: [] };
  }

  try {
    const offerings = await purchasesSdk().default.getOfferings();
    const offering = offerings.all[CREDITS_OFFERING_ID];
    const packs = (offering?.availablePackages ?? [])
      .flatMap((pkg): CreditPack[] => {
        const credits = creditsForProduct(pkg.product.identifier);
        return credits === undefined
          ? []
          : [
              {
                productId: pkg.product.identifier,
                credits,
                priceString: pkg.product.priceString,
                price: pkg.product.price,
                pkg,
              },
            ];
      })
      .sort((a, b) => a.price - b.price);

    if (packs.length === 0) {
      // A dashboard or App Store Connect problem, not the person's: say so
      // to Sentry, where someone can fix it.
      logError(
        new Error(`RevenueCat offering "${CREDITS_OFFERING_ID}" is empty`),
        "purchases:offering",
        { offerings: Object.keys(offerings.all) },
      );
      return { state: "unavailable", packs: [] };
    }

    return { state: "ready", packs };
  } catch (error) {
    logError(error, "purchases:getOfferings");
    return { state: "failed", packs: [] };
  }
}

/**
 * Buying credits through Apple In-App Purchase, the iOS replacement for the
 * Stripe top-up (App Review guideline 3.1.1). Loads the packs of the
 * RevenueCat Offering `credits`, runs the App Store purchase, and then waits
 * for the balance to go up: the backend credits it from RevenueCat's webhook,
 * keyed by the Profik user id the purchase was made under, so the app never
 * tells the server an amount.
 *
 * A cancelled purchase is not an error and says nothing. A pending one (Ask to
 * Buy) tells the person the credits will appear once it is approved. Anything
 * else is shown in the reader's language and logged.
 */
export function useCreditPurchase(): UseCreditPurchaseReturn {
  const { t } = useTranslation();
  const isGuest = useIsGuest();
  const dispatch = useDispatch<AppDispatch>();
  const { data: me } = useMeQuery(undefined, { skip: isGuest });

  // The poll reads `GET /auth/me` on its own rather than through the hook's
  // `refetch`, which throws once the hook's subscription is gone — and the
  // App Store sheet is up long enough for that to happen
  // (PROFIK-CONTRACTOR-C). A one-off read never throws; a failure comes back
  // as a result without `data`.
  const readBalance = useCallback(
    () =>
      dispatch(
        profikApi.endpoints.me.initiate(undefined, {
          subscribe: false,
          forceRefetch: true,
        }),
      ),
    [dispatch],
  );

  const [loaded, setLoaded] = useState<LoadedPacks>(() => ({
    state: inAppPurchasesAvailable() ? "loading" : "unavailable",
    packs: [],
  }));
  const [attempt, setAttempt] = useState(0);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const purchasing = useRef(false);

  useEffect(() => {
    let active = true;
    void loadCreditPacks().then((next) => {
      if (active) setLoaded(next);
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setLoaded({ state: "loading", packs: [] });
    setAttempt((n) => n + 1);
  }, []);

  const purchase = useCallback(
    async (pack: CreditPack): Promise<CreditPurchaseResult> => {
      // Guests never reach the Balance screen; the check is for the id the
      // webhook needs, which a purchase must not go ahead without.
      if (!me || purchasing.current) return { status: "failed" };
      purchasing.current = true;
      setPurchasingId(pack.productId);

      const product_id = pack.productId;
      track("balance_topup_purchase_started", {
        product_id,
        credits: pack.credits,
      });

      const sdk = purchasesSdk();
      let charged = false;
      try {
        await logInPurchaser(me.id);
        await sdk.default.purchasePackage(pack.pkg);
        charged = true;

        const { balanceUpdated, finalBalance } = await waitForBalanceIncrease(
          readBalance,
          me.balance,
        );
        track("balance_topup_payment_completed", {
          amount_kc: pack.credits,
          balance_after_kc: finalBalance,
          provider: "app_store",
          product_id,
        });
        return {
          status: "completed",
          balanceUpdated,
          newBalance: finalBalance,
        };
      } catch (error) {
        // Past this point the App Store has taken the money and the webhook
        // credits it regardless, so "purchase failed" would only make the
        // person pay twice. The screen shows its "credits arrive shortly".
        if (charged) {
          logError(error, "purchases:balancePoll", { product_id });
          track("balance_topup_payment_completed", {
            amount_kc: pack.credits,
            balance_after_kc: me.balance,
            provider: "app_store",
            product_id,
          });
          return {
            status: "completed",
            balanceUpdated: false,
            newBalance: me.balance,
          };
        }

        const code = errorCode(error);
        const codes = sdk.PURCHASES_ERROR_CODE;

        if (
          code === codes.PURCHASE_CANCELLED_ERROR ||
          (error as { userCancelled?: unknown } | null)?.userCancelled === true
        ) {
          track("balance_topup_purchase_cancelled", { product_id });
          return { status: "cancelled" };
        }

        if (code === codes.PAYMENT_PENDING_ERROR) {
          track("balance_topup_purchase_pending", { product_id });
          Alert.alert(
            t("balance.iap.pendingTitle"),
            t("balance.iap.pendingBody"),
          );
          return { status: "pending" };
        }

        track("balance_topup_purchase_failed", {
          product_id,
          error_code: code ?? "unknown",
        });
        logError(error, "purchases:purchase", { product_id });
        // Screen Time can switch purchases off — the one failure here the
        // person can fix themselves, so it gets its own words.
        Alert.alert(
          t("common.error"),
          code === codes.PURCHASE_NOT_ALLOWED_ERROR
            ? t("balance.iap.notAllowed")
            : t("balance.iap.purchaseFailed"),
        );
        return { status: "failed" };
      } finally {
        purchasing.current = false;
        setPurchasingId(null);
      }
    },
    [me, readBalance, t],
  );

  return {
    state: loaded.state,
    packs: loaded.packs,
    purchasingId,
    reload,
    purchase,
  };
}
