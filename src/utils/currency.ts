import type { TFunction } from "i18next";

// Manual formatting instead of Intl.NumberFormat: Hermes' Intl on iOS returns
// the ASCII fallback currency symbol ("Kc" instead of "Kč"). Whole crowns are
// shown without decimals to match the client app's price display.
//
// Non-breaking spaces throughout, so an amount never wraps mid-number or away
// from its unit.
const groupAmount = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  const fixed = Math.abs(rounded).toFixed(isWhole ? 0 : 2);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${grouped}${decPart ? `,${decPart}` : ""}`;
};

/** A price: what a job pays, or what an offer asks. Real money, in crowns. */
export const formatCzk = (amount: number): string =>
  `${groupAmount(amount)} Kč`;

/**
 * The wallet, in credits — the balance, the welcome bonus, what an offer costs
 * to send, every row of the transaction history.
 *
 * A credit is worth a crown and the backend stores the wallet in CZK, so the
 * two go through the same grouping. They are still not the same thing to the
 * reader: a job pays crowns that reach a bank account, while credits only buy
 * offers inside the app. Showing the wallet in Kč read as a cash bonus — "500
 * Kč on sign-up" is a promise of money the account never had.
 *
 * Takes `t` rather than calling i18n itself, the same way `formatWorkName`
 * does: the unit is a counted noun, and Czech and Ukrainian decline it.
 */
export const formatCredits = (amount: number, t: TFunction): string =>
  t("credits.amount", { count: amount, amount: groupAmount(amount) });
