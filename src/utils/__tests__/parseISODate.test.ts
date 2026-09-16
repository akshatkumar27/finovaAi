import { parseISODate } from '../parseISODate';

describe('parseISODate', () => {
    test('parses a valid date in local time (no UTC shift)', () => {
        const d = parseISODate('2026-09-16');
        expect(d).not.toBeNull();
        expect(d!.getFullYear()).toBe(2026);
        expect(d!.getMonth()).toBe(8); // September (0-indexed)
        expect(d!.getDate()).toBe(16);
    });

    test('day component matches input regardless of process timezone', () => {
        // The whole point: new Date('2026-01-01') is UTC midnight, which on a
        // west-of-UTC host renders as 2025-12-31. parseISODate must not.
        const d = parseISODate('2026-01-01');
        expect(d!.getDate()).toBe(1);
        expect(d!.getMonth()).toBe(0);
        expect(d!.getFullYear()).toBe(2026);
    });

    test('rejects malformed input', () => {
        expect(parseISODate('')).toBeNull();
        expect(parseISODate('2026-9-16')).toBeNull(); // missing zero-pad
        expect(parseISODate('2026/09/16')).toBeNull();
        expect(parseISODate('not a date')).toBeNull();
        expect(parseISODate(null as unknown as string)).toBeNull();
    });

    test('rejects invalid calendar dates', () => {
        expect(parseISODate('2026-02-31')).toBeNull(); // Feb 31 doesn't exist
        expect(parseISODate('2026-13-01')).toBeNull(); // month 13
        expect(parseISODate('2026-00-01')).toBeNull(); // month 0
        expect(parseISODate('2026-01-00')).toBeNull(); // day 0
        expect(parseISODate('2026-01-32')).toBeNull(); // day 32
    });

    test('accepts leap-day', () => {
        expect(parseISODate('2028-02-29')!.getDate()).toBe(29);
    });
});
