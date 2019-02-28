import { R } from './libs';
import { compact } from './util';

/**
 * Conveninent way of processing a value and flipping to a default value if it doesn't exist.
 */
export function defaultValue<T>(value: T | undefined, defaultValue?: T) {
  return (value === undefined ? defaultValue : value) as T;
}

/**
 * A safe way to test any value as to wheather is is 'blank'
 * meaning it can be either:
 *   - null
 *   - undefined
 *   - empty-string ('')
 *   - empty-array ([]).
 */
export function isBlank(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (R.is(Array, value) && compact(value).length === 0) {
    return true;
  }
  if (R.is(String, value) && value.trim() === '') {
    return true;
  }
  return false;
}

/**
 * Determines whether the given value is a number, or can be
 * parsed into a number.
 *
 * NOTE: Examines string values to see if they are numeric.
 *
 * @param value: The value to examine.
 * @returns true if the value is a number.
 */
export function isNumeric(value: any) {
  if (isBlank(value)) {
    return false;
  }
  const num = parseFloat(value);
  if (num === undefined) {
    return false;
  }
  if (num.toString().length !== value.toString().length) {
    return false;
  }
  return !Number.isNaN(num);
}

/**
 * Converts a value to a number if possible.
 * @param value: The value to convert.
 * @returns the converted number, otherwise the original value.
 */
export function toNumber(value: any) {
  if (isBlank(value)) {
    return value;
  }
  const num = parseFloat(value);
  if (num === undefined) {
    return value;
  }
  if (num.toString().length !== value.toString().length) {
    return value;
  }
  return Number.isNaN(num) ? value : num;
}

/**
 * Converts a string to it's actual type if it can be derived.
 * @param {string} string: The string to convert.
 * @return the original or converted value.
 */
export function toType<T>(value: any) {
  if (!R.is(String, value)) {
    return value as T;
  }
  const lowerCase = value.toLowerCase().trim();

  // Boolean.
  if (lowerCase === 'true') {
    return true;
  }
  if (lowerCase === 'false') {
    return false;
  }

  // Number.
  const num = toNumber(lowerCase);
  if (R.is(Number, num)) {
    return num as T;
  }

  // Originanl type.
  return value as T;
}
