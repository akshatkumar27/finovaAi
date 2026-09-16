import { formatDate } from '../formatDate';

describe('formatDate', () => {
    const d = new Date(2026, 8, 16); // Sep 16, 2026 (a Wednesday)

    test('body', () => {
        expect(formatDate(d, 'body')).toMatch(/^16 Sept? 2026$/);
    });
    test('caption is uppercase', () => {
        const out = formatDate(d, 'caption');
        expect(out).toBe(out.toUpperCase());
        expect(out).toContain('SEP');
        expect(out).toContain('16');
    });
    test('monthYear', () => {
        expect(formatDate(d, 'monthYear')).toMatch(/^Sept? 2026$/);
    });
    test('calendarHeader', () => {
        expect(formatDate(d, 'calendarHeader')).toBe('September 2026');
    });
    test('time', () => {
        const t = new Date(2026, 8, 16, 9, 12);
        const out = formatDate(t, 'time');
        expect(out).toMatch(/9:12/);
        expect(out.toUpperCase()).toContain('AM');
    });
});
