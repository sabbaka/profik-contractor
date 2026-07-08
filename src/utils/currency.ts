// Manual formatting instead of Intl.NumberFormat: Hermes' Intl on iOS returns
// the ASCII fallback currency symbol ("Kc" instead of "Kč"). Whole crowns are
// shown without decimals to match the client app's price display.
export const formatCzk = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  const fixed = Math.abs(rounded).toFixed(isWhole ? 0 : 2);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${grouped}${decPart ? `,${decPart}` : ""} Kč`;
};
