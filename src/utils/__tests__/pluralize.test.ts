import { pluralize } from '../pluralize';

describe('pluralize', () => {
    test('zero is plural', () => {
        expect(pluralize(0, 'goal')).toBe('0 goals');
    });
    test('one is singular', () => {
        expect(pluralize(1, 'goal')).toBe('1 goal');
        expect(pluralize(1, 'month')).toBe('1 month');
    });
    test('two+ is plural via +s', () => {
        expect(pluralize(2, 'goal')).toBe('2 goals');
        expect(pluralize(99, 'contribution')).toBe('99 contributions');
    });
    test('custom plural wins', () => {
        expect(pluralize(2, 'child', 'children')).toBe('2 children');
        expect(pluralize(1, 'child', 'children')).toBe('1 child');
    });
});
