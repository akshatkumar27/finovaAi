import { formatMoney } from '../formatMoney';

describe('formatMoney — full mode', () => {
    test('formats using Indian numbering', () => {
        expect(formatMoney(150000)).toBe('₹1,50,000');
        expect(formatMoney(200000)).toBe('₹2,00,000');
        expect(formatMoney(10000000)).toBe('₹1,00,00,000');
    });
    test('handles small numbers', () => {
        expect(formatMoney(0)).toBe('₹0');
        expect(formatMoney(850)).toBe('₹850');
    });
    test('rounds fractional to whole rupees', () => {
        expect(formatMoney(1234.56)).toBe('₹1,235');
    });
    test('accepts custom symbol', () => {
        expect(formatMoney(1000, { symbol: '$' })).toBe('$1,000');
    });
    test('handles negatives', () => {
        expect(formatMoney(-500)).toBe('-₹500');
    });
    test('handles non-finite', () => {
        expect(formatMoney(NaN)).toBe('₹0');
        expect(formatMoney(Infinity)).toBe('₹0');
    });
});

describe('formatMoney — compact mode', () => {
    test('under 1,000 stays full', () => {
        expect(formatMoney(0, { compact: true })).toBe('₹0');
        expect(formatMoney(850, { compact: true })).toBe('₹850');
        expect(formatMoney(999, { compact: true })).toBe('₹999');
    });
    test('1K–99K bucket', () => {
        expect(formatMoney(1000, { compact: true })).toBe('₹1K');
        expect(formatMoney(1500, { compact: true })).toBe('₹1.5K');
        expect(formatMoney(15000, { compact: true })).toBe('₹15K');
        expect(formatMoney(99000, { compact: true })).toBe('₹99K');
        expect(formatMoney(99999, { compact: true })).toBe('₹100K'); // rounds up
    });
    test('1L–99L bucket', () => {
        expect(formatMoney(100000, { compact: true })).toBe('₹1L');
        expect(formatMoney(150000, { compact: true })).toBe('₹1.5L');
        expect(formatMoney(9900000, { compact: true })).toBe('₹99L');
    });
    test('Cr bucket', () => {
        expect(formatMoney(10000000, { compact: true })).toBe('₹1Cr');
        expect(formatMoney(25000000, { compact: true })).toBe('₹2.5Cr');
        expect(formatMoney(250000000, { compact: true })).toBe('₹25Cr');
    });
    test('negative compact', () => {
        expect(formatMoney(-1500, { compact: true })).toBe('-₹1.5K');
    });
});
