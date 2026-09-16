import { formatRelative } from '../formatRelative';

describe('formatRelative', () => {
    const now = new Date(2026, 8, 16, 15, 0); // Sep 16, 2026 15:00

    test('same calendar day → Today (even if hours differ)', () => {
        expect(formatRelative(new Date(2026, 8, 16, 9, 0), now)).toBe('Today');
        expect(formatRelative(new Date(2026, 8, 16, 23, 59), now)).toBe('Today');
    });
    test('previous calendar day → Yesterday', () => {
        expect(formatRelative(new Date(2026, 8, 15, 23, 59), now)).toBe('Yesterday');
    });
    test('2–6 days ago → N days ago', () => {
        expect(formatRelative(new Date(2026, 8, 14), now)).toBe('2 days ago');
        expect(formatRelative(new Date(2026, 8, 10), now)).toBe('6 days ago');
    });
    test('7–30 days ago → weeks', () => {
        expect(formatRelative(new Date(2026, 8, 9), now)).toBe('1 week ago');
        expect(formatRelative(new Date(2026, 8, 2), now)).toBe('2 weeks ago');
    });
    test('older → falls back to formatDate body', () => {
        const out = formatRelative(new Date(2026, 6, 1), now);
        // Should be an absolute date, not '75 days ago'
        expect(out).toContain('2026');
        expect(out).toContain('Jul');
    });
});
