const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

export const formatRupiah = (value: number) => rupiahFormatter.format(Math.round(value));

export const formatNumber = (value: number) => numberFormatter.format(Math.round(value));

export const formatDecimal = (value: number, digits = 2) =>
  value.toFixed(digits).replace(".", ",");

export const formatPercent = (value: number, digits = 1) =>
  `${formatDecimal(Math.abs(value), digits)}%`;

export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${formatDecimal(value / 1_000_000_000, 1)} M`;
  if (value >= 1_000_000) return `Rp ${formatDecimal(value / 1_000_000, 1)} jt`;
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)} rb`;
  return `Rp ${Math.round(value)}`;
}
