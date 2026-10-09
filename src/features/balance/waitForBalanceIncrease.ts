/** What a refetch of `GET /auth/me` resolves to, as far as the poll cares. */
type BalanceRefetch = () => Promise<{ data?: { balance: number } }>;

export interface BalanceWait {
  /** True once the server reports more than `startBalance`. */
  balanceUpdated: boolean;
  /** The last balance the server reported, or `startBalance` without one. */
  finalBalance: number;
}

const ATTEMPTS = 5;
const GAP_MS = 2000;

/**
 * Waits for the server to credit a payment the app has just seen go through.
 *
 * Both ways of paying credit the balance from a webhook — Stripe's on Android,
 * RevenueCat's on iOS — so at the moment the payment sheet hands control back
 * the money may genuinely not be there yet. Nothing the cache knows can
 * shorten that, which is why this polls rather than invalidating a tag: up to
 * five reads, two seconds apart, stopping at the first one that is higher.
 * When none is, one last read makes the screen show the server's answer
 * rather than the balance the person started with.
 */
export async function waitForBalanceIncrease(
  refetchBalance: BalanceRefetch,
  startBalance: number,
): Promise<BalanceWait> {
  for (let i = 0; i < ATTEMPTS; i++) {
    const r = await refetchBalance();
    const newBalance = r.data?.balance ?? startBalance;

    if (newBalance > startBalance) {
      return { balanceUpdated: true, finalBalance: newBalance };
    }

    await new Promise((resolve) => setTimeout(resolve, GAP_MS));
  }

  const r = await refetchBalance();
  return {
    balanceUpdated: false,
    finalBalance: r.data?.balance ?? startBalance,
  };
}
