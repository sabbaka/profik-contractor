import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { track } from "@/src/utils/analytics";
import { logError } from "@/src/utils/logger";
import { useCreditPurchase, type CreditPack } from "./useCreditPurchase";

const mockRefetchBalance = jest.fn();

jest.mock("@/src/api/profikApi", () => ({
  useMeQuery: () => ({
    data: { id: "pro-1", balance: 100 },
    refetch: mockRefetchBalance,
  }),
}));

jest.mock("@/src/features/auth/hooks/useIsGuest", () => ({
  useIsGuest: () => false,
}));

jest.mock("@/src/utils/analytics", () => ({ track: jest.fn() }));
jest.mock("@/src/utils/logger", () => ({ logError: jest.fn() }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockPurchases = {
  configure: jest.fn(),
  getOfferings: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  purchasePackage: jest.fn(),
};

// The real package ships ESM jest cannot parse, and its native module does not
// exist here. Codes are RevenueCat's own `PURCHASES_ERROR_CODE` values.
jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: mockPurchases,
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: "1",
    STORE_PROBLEM_ERROR: "2",
    PURCHASE_NOT_ALLOWED_ERROR: "3",
    PAYMENT_PENDING_ERROR: "20",
    LOG_OUT_ANONYMOUS_USER_ERROR: "22",
  },
}));

const pkg = (productId: string, price: number) => ({
  identifier: `$rc_${productId}`,
  product: { identifier: productId, price, priceString: `${price} Kč` },
});

/** The `credits` Offering as RevenueCat returns it — deliberately unsorted. */
const offerings = (
  packages = [
    pkg("profik.credits.499", 499),
    pkg("profik.credits.99", 99),
    pkg("profik.credits.999", 999),
    pkg("profik.credits.249", 249),
  ],
) => ({
  current: null,
  all: { credits: { identifier: "credits", availablePackages: packages } },
});

const storeError = (code: string) =>
  Object.assign(new Error(`store error ${code}`), { code });

const setUp = async () => {
  const { result } = await renderHook(() => useCreditPurchase());
  await waitFor(() => expect(result.current.state).not.toBe("loading"));
  return result;
};

const buy = async (
  result: Awaited<ReturnType<typeof setUp>>,
  pack: CreditPack,
) => {
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.purchase(pack);
  });
  return outcome;
};

beforeEach(() => {
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = "appl_test";
  mockPurchases.getOfferings.mockResolvedValue(offerings());
  mockPurchases.logIn.mockResolvedValue({ created: false });
  mockPurchases.purchasePackage.mockResolvedValue({});
  mockRefetchBalance.mockResolvedValue({ data: { balance: 349 } });
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  jest.restoreAllMocks();
});

describe("the credit packs", () => {
  it("lists the credits Offering cheapest first, with the store's price", async () => {
    const result = await setUp();

    expect(result.current.state).toBe("ready");
    expect(
      result.current.packs.map(({ productId, credits, priceString }) => [
        productId,
        credits,
        priceString,
      ]),
    ).toEqual([
      ["profik.credits.99", 99, "99 Kč"],
      ["profik.credits.249", 249, "249 Kč"],
      ["profik.credits.499", 499, "499 Kč"],
      ["profik.credits.999", 999, "999 Kč"],
    ]);
  });

  it("leaves out a product it cannot say the size of", async () => {
    mockPurchases.getOfferings.mockResolvedValue(
      offerings([pkg("profik.credits.99", 99), pkg("profik.mystery", 50)]),
    );
    const result = await setUp();

    expect(result.current.packs.map((p) => p.productId)).toEqual([
      "profik.credits.99",
    ]);
  });

  /**
   * App Review rejects credits sold any other way on iOS, so a build without
   * the key must not quietly offer Stripe instead — it says buying is off.
   */
  it("is unavailable without a RevenueCat key, and never asks the store", async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    const result = await setUp();

    expect(result.current.state).toBe("unavailable");
    expect(result.current.packs).toEqual([]);
    expect(mockPurchases.getOfferings).not.toHaveBeenCalled();
  });

  it("is unavailable when the Offering has no packs, and says so to Sentry", async () => {
    mockPurchases.getOfferings.mockResolvedValue({ current: null, all: {} });
    const result = await setUp();

    expect(result.current.state).toBe("unavailable");
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      "purchases:offering",
      expect.anything(),
    );
  });

  it("offers a retry when the packs fail to load, and loads them on it", async () => {
    mockPurchases.getOfferings.mockRejectedValueOnce(new Error("offline"));
    const result = await setUp();
    expect(result.current.state).toBe("failed");

    await act(async () => result.current.reload());

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.packs).toHaveLength(4);
  });
});

describe("buying a pack", () => {
  // The wait itself — five reads, two seconds apart — is
  // `waitForBalanceIncrease`, exercised through the Stripe path in
  // useTopup.test.ts. Here the webhook has already credited the pack.
  it("buys under the Profik user id, then reads the credited balance", async () => {
    const result = await setUp();
    const pack = result.current.packs[1];

    const outcome = await buy(result, pack);

    expect(mockPurchases.logIn).toHaveBeenCalledWith("pro-1");
    expect(mockPurchases.logIn.mock.invocationCallOrder[0]).toBeLessThan(
      mockPurchases.purchasePackage.mock.invocationCallOrder[0],
    );
    expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(pack.pkg);
    expect(outcome).toEqual({
      status: "completed",
      balanceUpdated: true,
      newBalance: 349,
    });
    expect(mockRefetchBalance).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("balance_topup_purchase_started", {
      product_id: "profik.credits.249",
      credits: 249,
    });
    expect(track).toHaveBeenCalledWith("balance_topup_payment_completed", {
      amount_kc: 249,
      balance_after_kc: 349,
      provider: "app_store",
      product_id: "profik.credits.249",
    });
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(result.current.purchasingId).toBeNull();
  });

  it("treats a closed payment sheet as nothing to report", async () => {
    mockPurchases.purchasePackage.mockRejectedValue(storeError("1"));
    const result = await setUp();

    const outcome = await buy(result, result.current.packs[0]);

    expect(outcome).toEqual({ status: "cancelled" });
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(mockRefetchBalance).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("balance_topup_purchase_cancelled", {
      product_id: "profik.credits.99",
    });
  });

  it("tells the person an Ask to Buy purchase lands once approved", async () => {
    mockPurchases.purchasePackage.mockRejectedValue(storeError("20"));
    const result = await setUp();

    const outcome = await buy(result, result.current.packs[0]);

    expect(outcome).toEqual({ status: "pending" });
    expect(Alert.alert).toHaveBeenCalledWith(
      "balance.iap.pendingTitle",
      "balance.iap.pendingBody",
    );
    expect(logError).not.toHaveBeenCalled();
    expect(mockRefetchBalance).not.toHaveBeenCalled();
  });

  it("explains a store failure in the reader's language and logs it", async () => {
    mockPurchases.purchasePackage.mockRejectedValue(storeError("2"));
    const result = await setUp();

    const outcome = await buy(result, result.current.packs[0]);

    expect(outcome).toEqual({ status: "failed" });
    expect(Alert.alert).toHaveBeenCalledWith(
      "common.error",
      "balance.iap.purchaseFailed",
    );
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      "purchases:purchase",
      { product_id: "profik.credits.99" },
    );
    expect(track).toHaveBeenCalledWith("balance_topup_purchase_failed", {
      product_id: "profik.credits.99",
      error_code: "2",
    });
  });

  it("points to the device setting when purchases are switched off", async () => {
    mockPurchases.purchasePackage.mockRejectedValue(storeError("3"));
    const result = await setUp();

    await buy(result, result.current.packs[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      "common.error",
      "balance.iap.notAllowed",
    );
  });

  it("does not buy when the identity could not be switched", async () => {
    mockPurchases.logIn.mockRejectedValue(new Error("network"));
    const result = await setUp();

    const outcome = await buy(result, result.current.packs[0]);

    expect(outcome).toEqual({ status: "failed" });
    expect(mockPurchases.purchasePackage).not.toHaveBeenCalled();
  });
});
