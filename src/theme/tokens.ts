// ── Typography ───────────────────────────────────────────────────────────────
// Formalized scale after typography audit (docs/redesign/05-typography-audit.md).
// Font: Inter (bundled TTFs in assets/fonts/, linked via react-native.config.js).
// Each Inter static weight is registered by its filename base — RN resolves
// 'Inter-SemiBold' to Inter-SemiBold.ttf on both Android and iOS (Inter's
// PostScript names match the file basenames).

const REGULAR = 'Inter-Regular';
const MEDIUM = 'Inter-Medium';
const SEMIBOLD = 'Inter-SemiBold';
const BOLD = 'Inter-Bold';
const EXTRABOLD = 'Inter-ExtraBold';

export type FontWeightKey = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/**
 * Map a semantic weight to the concrete Inter fontFamily string.
 * On React Native, weight is expressed via fontFamily (not fontWeight),
 * because Android below API 28 does not synthesize weight for non-system
 * fonts. Always use this helper alongside fontFamily.
 */
export const fontFor = (weight: FontWeightKey = 'regular'): string => {
    switch (weight) {
        case 'medium':    return MEDIUM;
        case 'semibold':  return SEMIBOLD;
        case 'bold':      return BOLD;
        case 'extrabold': return EXTRABOLD;
        default:          return REGULAR;
    }
};

// ── Size scale ───────────────────────────────────────────────────────────────
// The scale used in practice, from the audit. `fontSize` is authoritative;
// `lineHeight` and `letterSpacing` are Inter-tuned defaults for each step.
// Screens should read from `type.body.size`, not hardcode 14.
export const type = {
    // Small captions and section-heads.
    micro:    { size: 11, lineHeight: 14, letterSpacing:  0.2 },
    caption:  { size: 12, lineHeight: 16, letterSpacing:  0 },
    metaSm:   { size: 13, lineHeight: 18, letterSpacing:  0 },

    // Body copy — the workhorse. 14 is the most-used size in the app.
    body:     { size: 14, lineHeight: 20, letterSpacing:  0 },
    bodyLg:   { size: 15, lineHeight: 22, letterSpacing:  0 },
    bodyXl:   { size: 16, lineHeight: 24, letterSpacing:  0 },

    // Subheadings, section titles.
    subhead:  { size: 18, lineHeight: 24, letterSpacing: -0.1 },
    titleSm:  { size: 20, lineHeight: 26, letterSpacing: -0.2 },

    // Screen titles.
    title:    { size: 22, lineHeight: 28, letterSpacing: -0.2 },

    // Hero amounts (goal target, portfolio value).
    display:  { size: 32, lineHeight: 38, letterSpacing: -0.4 },
} as const;

export type TypeStep = keyof typeof type;

// ── ALL-CAPS section heads ───────────────────────────────────────────────────
// Positive tracking convention for uppercase labels.
export const capsSpacing = 1.2;

// ── Legacy alias kept for existing screens ───────────────────────────────────
// Existing v3 screens read `typography.weightSemibold` etc. Keep those strings
// working during the migration; new code should prefer `fontFor('semibold')`.
export const typography = {
    display: type.display.size,
    title:   type.title.size,
    body:    type.bodyLg.size,
    caption: type.caption.size,

    weightRegular:  '400' as const,
    weightMedium:   '500' as const,
    weightSemibold: '600' as const,
    weightBold:     '700' as const,
};

// ── Spacing (unchanged) ──────────────────────────────────────────────────────
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 48,
};

// ── Radii (unchanged) ────────────────────────────────────────────────────────
export const radii = {
    sm: 10,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
};
