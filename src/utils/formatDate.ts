/**
 * One date formatter for the whole app, five named styles per §7.2 of the
 * decisions doc. All en-IN locale, no external date lib.
 *
 *   body           → 'Sep 16, 2026'
 *   caption        → 'WED, SEP 16'      (uppercase, no year — header captions)
 *   monthYear      → 'Sep 2026'
 *   calendarHeader → 'September 2026'
 *   time           → '9:12 AM'
 */

export type DateStyle = 'body' | 'caption' | 'monthYear' | 'calendarHeader' | 'time';

const opts: Record<DateStyle, Intl.DateTimeFormatOptions> = {
    body: { day: 'numeric', month: 'short', year: 'numeric' },
    caption: { weekday: 'short', month: 'short', day: 'numeric' },
    monthYear: { month: 'short', year: 'numeric' },
    calendarHeader: { month: 'long', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit', hour12: true },
};

export const formatDate = (date: Date, style: DateStyle): string => {
    const s = new Intl.DateTimeFormat('en-IN', opts[style]).format(date);
    return style === 'caption' ? s.toUpperCase() : s;
};
