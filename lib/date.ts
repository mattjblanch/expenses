import { parse, isValid } from "date-fns";

/**
 * Parse a date string in various formats into a Date object.
 * Supports ISO strings (YYYY-MM-DD) and day-first formats like DD/MM/YYYY.
 * Returns null if the input cannot be parsed.
 */
export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const iso = new Date(value);
  if (!isNaN(iso.getTime())) return iso;
  const dmy = parse(value, "d/M/yyyy", new Date());
  if (isValid(dmy)) return dmy;
  return null;
}
