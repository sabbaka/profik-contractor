import { act, renderHook } from "@testing-library/react-native";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { useTopup } from "./useTopup";

const mockTopupMutation = jest.fn();
const mockRefetchBalance = jest.fn();
let mockBalance = 100;

jest.mock("@/src/api/profikApi", () => ({
  useMeQuery: () => ({
    data: { balance: mockBalance },
    isLoading: false,
    refetch: mockRefetchBalance,
  }),
  useTopupBalanceMutation: () => [mockTopupMutation, { isLoading: false }],
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: () => "profikcontractor://payments/return",
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** Balance the poll sees on each successive attempt. */
const balanceSequence = (values: (number | undefined)[]) => {
  let call = 0;
  mockRefetchBalance.mockImplementation(async () => {
    const value = values[Math.min(call, values.length - 1)];
    call += 1;
    return value === undefined
      ? { data: undefined }
      : { data: { balance: value } };
  });
};

const browserReturns = (type: string) =>
  (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type });

/**
 * Runs `topup` to completion with fake timers, stepping past each 2s gap.
 * The loop awaits a refetch between sleeps, so the timers cannot simply be run
 * all at once — each tick has to let the microtask queue drain first.
 */
const runTopup = async (topup: () => Promise<unknown>) => {
  let settled: unknown;
  const pending = topup().then((value) => (settled = value));

  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
    });
  }

  await pending;
  return settled as {
    success: boolean;
    balanceUpdated?: boolean;
    newBalance?: number;
  };
};

beforeEach(() => {
  jest.useFakeTimers();
  mockBalance = 100;
  mockTopupMutation.mockReturnValue({
    unwrap: async () => ({ url: "https://checkout.stripe.test/session" }),
  });
  browserReturns("success");
  balanceSequence([100]);
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const setUp = async () => (await renderHook(() => useTopup())).result;

/**
 * Stripe credits the balance from its webhook, so at the moment the browser
 * hands control back the money may genuinely not be there yet. This polls for
 * the server to catch up; a tag invalidation cannot shorten that wait, which is
 * why the loop exists at all.
 */
describe("waiting for Stripe to credit the balance", () => {
  it("stops as soon as the balance goes up", async () => {
    balanceSequence([500]);
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toMatchObject({
      success: true,
      balanceUpdated: true,
      newBalance: 500,
    });
    expect(mockRefetchBalance).toHaveBeenCalledTimes(1);
  });

  it("keeps waiting while the balance is unchanged", async () => {
    balanceSequence([100, 100, 100, 500]);
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toMatchObject({ balanceUpdated: true, newBalance: 500 });
    expect(mockRefetchBalance).toHaveBeenCalledTimes(4);
  });

  it("gives up after five attempts and reports the money as not arrived", async () => {
    balanceSequence([100]);
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toMatchObject({
      success: true,
      balanceUpdated: false,
      newBalance: 100,
    });
    // Five polls, then one last read so the screen shows the server's answer
    // rather than the balance the user started with.
    expect(mockRefetchBalance).toHaveBeenCalledTimes(6);
  });

  it("polls the same way when the user simply closes the browser", async () => {
    browserReturns("dismiss");
    balanceSequence([500]);
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toMatchObject({ balanceUpdated: true });
  });

  it("does not poll when the browser session never opened", async () => {
    browserReturns("locked");
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toEqual({ success: true, balanceUpdated: false });
    expect(mockRefetchBalance).not.toHaveBeenCalled();
  });
});

describe("when the top-up cannot start", () => {
  it("reports the server's message and does not poll", async () => {
    mockTopupMutation.mockReturnValue({
      unwrap: async () => {
        throw { data: { message: "Card declined" } };
      },
    });
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toMatchObject({ success: false, error: "Card declined" });
    expect(Alert.alert).toHaveBeenCalled();
    expect(mockRefetchBalance).not.toHaveBeenCalled();
  });

  it("falls back to translated copy when the server says nothing useful", async () => {
    mockTopupMutation.mockReturnValue({
      unwrap: async () => {
        throw new Error("network down");
      },
    });
    const result = await setUp();

    const outcome = await runTopup(() => result.current.topup(400));

    expect(outcome).toMatchObject({
      success: false,
      error: "balance.topupFailed",
    });
  });
});
