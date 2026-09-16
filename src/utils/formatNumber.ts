
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
 * Format a number input string with commas
 * Examples:
 *   "10000" => "10,000"
 *   "123abcd" => "123"
 * 
 * @param value - The input string
 * @returns Formatted string with commas
 */
export const formatNumberInput = (value: string): string => {
    // Drop the fractional part BEFORE stripping non-digits, so DECIMAL strings
    // from the backend like "200000.00" don't become "20000000" (×100 bug).
    const cleanValue = value.split('.')[0].replace(/[^0-9]/g, '');
    if (!cleanValue) return '';

    // Format with commas according to Indian locale
    return parseInt(cleanValue, 10).toLocaleString('en-IN');
};
