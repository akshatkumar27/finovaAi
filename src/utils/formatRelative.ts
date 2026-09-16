/**
 * Relative-time helper per §7.4 of the decisions doc.
 *
 * Uses LOCAL calendar days (not 24-hour windows) so 'Yesterday' means the
 * previous calendar date in the viewer's timezone, matching how users read
 * dates on their phone.
 *
 *   same calendar day → 'Today'
 *   1 calendar day before → 'Yesterday'
 *   2–6 days ago     → '{n} days ago'
 *   7–30 days ago    → '{n} weeks ago' (rounded)
 *   older or future  → falls back to formatDate(from, 'body')
 */

import { formatDate } from './formatDate';

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const formatRelative = (from: Date, now: Date = new Date()): string => {
    const fromStart = startOfDay(from);
    const nowStart = startOfDay(now);
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((nowStart.getTime() - fromStart.getTime()) / msPerDay);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days >= 2 && days <= 6) return `${days} days ago`;
    if (days >= 7 && days <= 30) {
        const weeks = Math.round(days / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    return formatDate(from, 'body');
};
