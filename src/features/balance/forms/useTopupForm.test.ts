import { act, renderHook } from "@testing-library/react-native";
import { useTopupForm } from "./useTopupForm";
import { MAX_TOPUP_CZK, MIN_TOPUP_CZK } from "../topupLimits";

const mockTopup = jest.fn();

jest.mock("../hooks/useTopup", () => ({
  useTopup: () => ({
    topup: mockTopup,
    isLoading: false,
    balance: 100,
    isBalanceLoading: false,
    refetchBalance: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    // Identity, so an assertion can name the key that refused the amount.
    t: (key: string) => key,
  }),
}));

/**
 * Type `amount` into the form and submit it.
 *
 * Returns the error the field ended up with, if any — `submit` runs the
 * resolver first, so a rejected amount never reaches `topup`.
 */
const submitAmount = async (amount: string) => {
  const result = (await renderHook(() => useTopupForm())).result;

  await act(async () => {
    result.current.form.setValue("amount", amount);
  });
  await act(async () => {
    await result.current.submit();
  });

  // getFieldState rather than formState.errors: the latter is a proxy that
  // only tracks what was read during a render, and this reads it after one.
  return result.current.form.getFieldState("amount").error?.message;
};

describe("useTopupForm", () => {
  beforeEach(() => jest.clearAllMocks());

  // P-07: these three rules were the server's alone. An amount it refuses used
  // to leave as a request and come back as an error the screen could not show.
  it.each([
    ["1", "balance.errors.amountMin"],
    [String(MIN_TOPUP_CZK - 1), "balance.errors.amountMin"],
    ["15.5", "balance.errors.amountWhole"],
    [String(MAX_TOPUP_CZK + 1), "balance.errors.amountMax"],
    ["0", "balance.errors.amountPositive"],
    ["", "balance.errors.amountRequired"],
    ["abc", "balance.errors.amountNumber"],
  ])("refuses %s before anything is sent", async (amount, key) => {
    expect(await submitAmount(amount)).toBe(key);
    expect(mockTopup).not.toHaveBeenCalled();
  });

  it.each([String(MIN_TOPUP_CZK), "100", String(MAX_TOPUP_CZK)])(
    "sends %s through as a number",
    async (amount) => {
      mockTopup.mockResolvedValue({ success: true, balanceUpdated: false });

      expect(await submitAmount(amount)).toBeUndefined();
      expect(mockTopup).toHaveBeenCalledWith(Number(amount));
    },
  );
});
