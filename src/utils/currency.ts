const czkFormatter = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
});

export const formatCzk = (amount: number): string =>
  czkFormatter.format(amount);
