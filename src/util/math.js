/**
 * Truncates a number to a specified number of decimal places without rounding.
 * @param {number} num - The number to truncate.
 * @param {number} decimalPlaces - The number of decimal places to keep.
 * @returns {number} The truncated number.
 */
function truncateDecimal(num, decimalPlaces) {
    if (decimalPlaces < 0) throw new Error('Decimal places must be non-negative.');
    const factor = Math.pow(10, decimalPlaces);
    return Math.trunc(num * factor) / factor;
}

export { truncateDecimal };
