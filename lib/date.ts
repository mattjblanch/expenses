import { parse, isValid } from "date-fns";

/**
 * Parse a date string in various formats into a Date object.
 * Supports ISO strings (YYYY-MM-DD) and day-first formats like DD/MM/YYYY.
 * Returns null if the input cannot be parsed.
 */
export function parseDateInput(value: string): Date | null {
  if (!value) return null;

  const iso = new Date(value);
  if (!isNaN(iso.getTime())) {
    if (iso.getFullYear() < 100) {
      iso.setFullYear(2000 + iso.getFullYear());
    }
    return iso;
  }

  const formats = [
    "d/M/yyyy",
    "d/M/yy",
    "d MMM yyyy",
    "d MMM yy",
  ];

  for (const f of formats) {
    const parsed = parse(value, f, new Date());
    if (isValid(parsed)) {
      if (f.includes("yy") && !f.includes("yyyy") && parsed.getFullYear() < 100) {
        parsed.setFullYear(2000 + parsed.getFullYear());
      }
      return parsed;
    }
  }

  return null;
}
