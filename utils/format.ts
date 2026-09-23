const integerFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

/** Whole-number display for calories and gram totals: 1842.4 → "1,842". */
export function formatNumber(value: number): string {
  return integerFormatter.format(Math.round(value));
}

/** One-decimal display for per-item macros where precision matters: 3.64 → "3.6". */
export function formatDecimal(value: number): string {
  return oneDecimalFormatter.format(value);
}

export function formatGrams(value: number): string {
  return `${formatDecimal(value)}g`;
}

export function formatCalories(value: number): string {
  return `${formatNumber(value)} cal`;
}
