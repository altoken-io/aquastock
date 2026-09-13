import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges an array of class names using clsx and twMerge.
 *
 * @param {...ClassValue} inputs - Array of classnames to be merged
 * @returns {string} - Merged classnames
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Merges an array of class names using clsx.
 *
 * @param {...ClassValue} inputs - Array of classnames to be merged
 * @returns {string} - Merged classnames
 */
export function cnNoTwMerge(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
