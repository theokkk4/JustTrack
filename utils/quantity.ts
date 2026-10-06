/**
 * Parses an amount typed by the user: "2", "1.5", "1,5" (comma decimal),
 * "1/2", or "1 1/2". Returns null for anything that isn't a positive number.
 */
export function parseQuantity(text: string): number | null {
  const input = text.trim().replace(',', '.');
  if (input === '') return null;

  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(input);
  const fraction = /^(\d+)\/(\d+)$/.exec(input);
  let value: number;
  if (mixed) {
    value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  } else if (fraction) {
    value = Number(fraction[1]) / Number(fraction[2]);
  } else if (/^\d*\.?\d+$|^\d+\.$/.test(input)) {
    value = Number(input);
  } else {
    return null;
  }
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Trims to at most `maxDecimals` without trailing zeros: 1.50 → "1.5", 2 → "2", 1/3 → "0.33". */
export function formatQuantity(value: number, maxDecimals = 2): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded);
}
