/**
 * Format a number using standard metrics (k, M, B)
 * Examples:
 *   5000 => "5k"
 *   50000 => "50k"
 *   1000000 => "1M"
 *   1500000 => "1.5M"
 * 
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with metric suffix
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
    if (num === 0) return '0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1_000_000_000) {
        const value = absNum / 1_000_000_000;
        return sign + parseFloat(value.toFixed(3)).toString() + 'B';
    }

    if (absNum >= 1_000_000) {
        const value = absNum / 1_000_000;
        return sign + parseFloat(value.toFixed(3)).toString() + 'M';
    }

    if (absNum >= 1_000) {
        const value = absNum / 1_000;
        return sign + parseFloat(value.toFixed(3)).toString() + 'k';
    }

    return sign + absNum.toString();
};

/**
 * Format a number as currency with metric suffix
 * Examples:
 *   5000 => "₹5k"
 *   50000 => "₹50k"
 *   1000000 => "₹1M"
 * 
 * @param num - The number to format
 * @param currency - Currency symbol (default: "₹")
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted currency string with metric suffix
 */
export const formatCurrency = (num: number, currency: string = '₹', decimals: number = 1): string => {
    return currency + formatNumber(num, decimals);
};

/**
 * Format a number with commas (for cases where full number is needed)
 * Examples:
 *   5000 => "5,000"
 *   50000 => "50,000"
 * 
 * @param num - The number to format
 * @returns Formatted string with commas
 */
export const formatFullNumber = (num: number): string => {
    return num.toLocaleString('en-IN');
};

/**
 * Format a number in compact style:
 *   - Up to 5 digits (≤ 99,999): show full number with commas
 *   - 6+ digits (≥ 100,000): show with K/M/B suffix
 * Examples:
 *   500 => "500"
 *   12000 => "12,000"
 *   99999 => "99,999"
 *   123456 => "123.46K"
 *   1500000 => "1.5M"
 *   2000000000 => "2B"
 *
 * @param num - The number to format
 * @returns Formatted string
 */
export const formatCompactNumber = (num: number): string => {
    if (num === 0) return '0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1_000_000_000) {
        const value = absNum / 1_000_000_000;
        return sign + parseFloat(value.toFixed(2)) + 'B';
    }

    if (absNum >= 1_000_000) {
        const value = absNum / 1_000_000;
        return sign + parseFloat(value.toFixed(2)) + 'M';
    }

    if (absNum >= 1_00_000) {
        const value = absNum / 1_000;
        return sign + parseFloat(value.toFixed(2)) + 'K';
    }

    return sign + absNum.toLocaleString('en-IN');
};

/**
 * Format a number as currency with compact style:
 *   - Up to 5 digits (≤ 99,999): show full number with commas
 *   - 6+ digits (≥ 100,000): show with K/M/B suffix
 * Examples:
 *   500 => "₹500"
 *   12000 => "₹12,000"
 *   99999 => "₹99,999"
 *   123456 => "₹123.46K"
 *   1500000 => "₹1.5M"
 *
 * @param num - The number to format
 * @param currency - Currency symbol (default: "₹")
 * @returns Formatted currency string
 */
export const formatCompactCurrency = (num: number, currency: string = '₹'): string => {
    return currency + formatCompactNumber(num);
};

/**
 * Format a number input string with commas
 * Examples:
 *   "10000" => "10,000"
 *   "123abcd" => "123"
 * 
 * @param value - The input string
 * @returns Formatted string with commas
 */
export const formatNumberInput = (value: string): string => {
    // Remove all non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) return '';

    // Format with commas according to Indian locale
    return parseInt(cleanValue, 10).toLocaleString('en-IN');
};
