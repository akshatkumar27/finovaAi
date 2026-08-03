export const colors = {
    // ── Surfaces ──────────────────────────────────────────────────────────────
    background: '#080811',          // deepest layer — app bg
    cardBackground: '#0f0f1c',      // cards, panels
    elevatedBackground: '#161628',  // modals, floating elements, pulse card
    inputBackground: '#1a1a2e',     // input fields

    // ── Brand / Primary ───────────────────────────────────────────────────────
    primary: '#3d8ef8',             // CTAs, links, active states
    primaryDim: 'rgba(61,142,248,0.12)', // secondary button fill, card highlight
    primaryDark: '#1a6ed4',         // pressed primary

    // ── Text hierarchy ────────────────────────────────────────────────────────
    textPrimary: '#f0f0fa',         // headings, values — off-white (easier on eyes than pure white)
    textSecondary: '#8b8b9e',       // body, descriptions, labels
    textTertiary: '#55556a',        // timestamps, placeholders, muted labels
    textMuted: '#cacadb',

    // ── Borders ───────────────────────────────────────────────────────────────
    border: '#252538',              // default card / section borders
    borderStrong: '#363650',        // emphasized borders, selected states
    borderFocused: '#3d8ef8',       // input focus ring
    lightloder: '#aca7a7ff',

    // ── Semantic: Gain (positive returns, surplus, ahead of schedule) ──────────
    gain: '#00c896',
    gainText: '#00e8b0',            // on dark bg — lighter for contrast
    gainDim: 'rgba(0,200,150,0.12)',

    // ── Semantic: Loss (negative returns, deficit, overspend) ─────────────────
    loss: '#ff5252',
    lossText: '#ff7272',            // on dark bg
    lossDim: 'rgba(255,82,82,0.12)',

    // ── Semantic: Warning (approaching limits, EMI reminders) ─────────────────
    warning: '#f59e0b',
    warningText: '#fbbf24',         // on dark bg
    warningDim: 'rgba(245,158,11,0.12)',

    // ── Achievement (purple — milestones, badges) ─────────────────────────────
    achievement: '#a855f7',
    achievementDim: 'rgba(168,85,247,0.12)',

    // ── Legacy aliases (preserved for backward compatibility) ─────────────────
    link: '#3d8ef8',
    error: '#ff5252',
    success: '#00c896',
};

export const typography = {
    // Font sizes
    display: 38,        // hero numbers — portfolio value, goal total (max 1–2 per screen)
    h1: 28,             // screen titles
    h2: 24,             // subheadings
    h3: 20,             // section titles
    body: 16,           // body text
    bodySmall: 14,      // small body
    caption: 12,        // labels, timestamps, badges

    // Font weights
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};
