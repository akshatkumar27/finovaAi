export type Palette = {
    // Surfaces
    canvas: string;
    surface: string;
    surfaceAlt: string;

    // Ink hierarchy
    ink1: string;
    ink2: string;
    ink3: string;

    // Borders
    border: string;
    borderStrong: string;

    // Accent
    accent: string;
    accentStrong: string;
    accentSoft: string;
    accentInk: string;

    // Semantic
    gain: string;
    gainSoft: string;
    loss: string;
    lossSoft: string;
    warn: string;
    warnSoft: string;

    // Utility
    shadow: string;
};

export const lightPalette: Palette = {
    canvas: '#F7F5F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F0EDE6',

    ink1: '#111418',
    ink2: '#4B5058',
    ink3: '#8A8F97',

    border: '#E5E1D8',
    borderStrong: '#D6D0C2',

    accent: '#245C50',
    accentStrong: '#17453B',
    accentSoft: '#E1EDE9',
    accentInk: '#FFFFFF',

    gain: '#0E7C4A',
    gainSoft: '#E5F0E9',
    loss: '#B94028',
    lossSoft: '#F5E4DF',
    warn: '#A5711A',
    warnSoft: '#F1E9D6',

    shadow: 'rgba(17,20,24,0.08)',
};

export const darkPalette: Palette = {
    canvas: '#0E1013',
    surface: '#171A1E',
    surfaceAlt: '#212429',

    ink1: '#F0EEE9',
    ink2: '#B0B4B9',
    ink3: '#7A7E84',

    border: '#262A2F',
    borderStrong: '#363B41',

    accent: '#5CBFA6',
    accentStrong: '#7ED8BF',
    accentSoft: '#1B2E29',
    accentInk: '#0E1013',

    gain: '#5FCE8C',
    gainSoft: '#1D3626',
    loss: '#E4826A',
    lossSoft: '#3A1F19',
    warn: '#DDB35C',
    warnSoft: '#392E17',

    shadow: 'rgba(0,0,0,0.45)',
};
