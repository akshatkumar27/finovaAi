/**
 * Parse a 'YYYY-MM-DD' date-only string into a Date constructed in the LOCAL
 * timezone. The built-in `new Date('YYYY-MM-DD')` parses as UTC midnight,
 * which shifts the day for users west of UTC — the exact bug called out in
 * 06c-formatting-audit.md §3.5.
 *
 * Returns null for malformed input; callers decide the fallback.
 */
export const parseISODate = (s: string): Date | null => {
    if (typeof s !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = Number(m[1]);
    const month = Number(m[2]);
    const d = Number(m[3]);
    if (month < 1 || month > 12 || d < 1 || d > 31) return null;
    const date = new Date(y, month - 1, d);
    // Round-trip check rejects e.g. 2026-02-31 which JS would silently roll to March
    if (
        date.getFullYear() !== y ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== d
    ) {
        return null;
    }
    return date;
};
