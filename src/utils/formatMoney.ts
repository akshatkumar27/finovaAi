/**
 * Single canonical money formatter. Replaces the four legacy formatters
 * (formatCurrency, formatCompactCurrency, formatCompactNumber, formatChip).
 *
 * Rules per docs/redesign/07-decisions.md §6:
 * - Symbol defaults to '₹', always before the number.
 * - Indian numbering (en-IN) — grouping is 2-2-3 for thousands/lakhs.
 * - compact:false → full number ('₹1,50,000').
 * - compact:true  → Indian scale: K/L/Cr with one decimal only if needed.
 *     < 1,000                  → full ('₹850')
 *     1,000 – 99,999           → K ('₹1K', '₹1.5K', '₹99K')
 *     1,00,000 – 99,99,999     → L ('₹1L', '₹1.5L', '₹99L')
 *     ≥ 1,00,00,000            → Cr ('₹1Cr', '₹25Cr')
 */

interface Opts {
    symbol?: string;
    compact?: boolean;
}

const trim = (n: number): string => {
    // 1.0 → '1', 1.5 → '1.5'
    const s = n.toFixed(1);
    return s.endsWith('.0') ? s.slice(0, -2) : s;
};

const compactIndian = (abs: number, symbol: string, sign: string): string => {
    if (abs >= 1_00_00_000) return `${sign}${symbol}${trim(abs / 1_00_00_000)}Cr`;
    if (abs >= 1_00_000) return `${sign}${symbol}${trim(abs / 1_00_000)}L`;
    if (abs >= 1_000) return `${sign}${symbol}${trim(abs / 1_000)}K`;
    return `${sign}${symbol}${Math.round(abs)}`;
};

const full = (abs: number, symbol: string, sign: string): string => {
    const rounded = Math.round(abs);
    return `${sign}${symbol}${rounded.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatMoney = (amount: number, opts: Opts = {}): string => {
    const { symbol = '₹', compact = false } = opts;
    if (!Number.isFinite(amount)) return `${symbol}0`;
    const sign = amount < 0 ? '-' : '';
    const abs = Math.abs(amount);
    return compact ? compactIndian(abs, symbol, sign) : full(abs, symbol, sign);
};
