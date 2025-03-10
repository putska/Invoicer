// utils/formatters.ts

/**
 * Converts decimal inches to a fractional representation
 * Example: 4.25 becomes "4-1/4"
 */
export function decimalToFraction(decimal: number): string {
  // Handle whole numbers
  if (Math.round(decimal) === decimal) {
    return decimal.toString();
  }

  // Split into whole and decimal parts
  const wholePart = Math.floor(decimal);
  let decimalPart = decimal - wholePart;

  // Round to nearest 1/16th (or your desired precision)
  const precision = 16;
  let numerator = Math.round(decimalPart * precision);
  let denominator = precision;

  // Simplify the fraction
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(numerator, denominator);

  numerator = numerator / divisor;
  denominator = denominator / divisor;

  // Format the result
  if (numerator === 0) {
    return wholePart.toString();
  } else if (wholePart === 0) {
    return `${numerator}/${denominator}`;
  } else {
    return `${wholePart}-${numerator}/${denominator}`;
  }
}

/**
 * Format a decimal as feet and inches
 * Example: 42.5 becomes "3'-6 1/2""
 */
export function decimalToFeetInches(decimal: number): string {
  const feet = Math.floor(decimal / 12);
  const inches = decimal % 12;

  if (feet === 0) {
    return `${decimalToFraction(inches)}"`;
  } else if (inches === 0) {
    return `${feet}'`;
  } else {
    return `${feet}'-${decimalToFraction(inches)}"`;
  }
}

/**
 * Convert inches to feet
 * Example: 36 becomes 3.0
 */
export function inchesToFeet(inches: number): number {
  return inches / 12;
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
