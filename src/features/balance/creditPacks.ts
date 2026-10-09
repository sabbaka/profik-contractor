/**
 * The RevenueCat Offering the iOS Balance screen sells from. Its packages are
 * the four consumable App Store products below.
 */
export const CREDITS_OFFERING_ID = "credits";

/**
 * How many credits each App Store product is shown as, at 1 Kč a credit.
 *
 * For display only. The backend decides what a purchase is worth when the
 * RevenueCat webhook reaches it; the app never tells the server an amount.
 * A product missing from this map is not offered — a pack whose size the
 * screen cannot state is not something to put a price on.
 */
export const CREDITS_BY_PRODUCT: Readonly<Record<string, number>> = {
  "profik.credits.99": 99,
  "profik.credits.249": 249,
  "profik.credits.499": 499,
  "profik.credits.999": 999,
};

export function creditsForProduct(productId: string): number | undefined {
  return CREDITS_BY_PRODUCT[productId];
}
