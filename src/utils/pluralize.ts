/**
 * Tiny count-and-noun formatter per §6.5 of the decisions doc.
 *
 *   pluralize(1, 'goal')          → '1 goal'
 *   pluralize(3, 'goal')          → '3 goals'
 *   pluralize(1, 'month')         → '1 month'
 *   pluralize(0, 'contribution')  → '0 contributions'
 *   pluralize(2, 'child', 'children') → '2 children'
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
    const noun = count === 1 ? singular : (plural ?? `${singular}s`);
    return `${count} ${noun}`;
};
