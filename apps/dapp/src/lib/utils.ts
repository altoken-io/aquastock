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

export const capitalizeAll = (str: string) =>
  str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const currencyFormatter = ({
  locale,
  currency = 'USD',
  maximumFractionDigits = 0,
  minimumFractionDigits,
}: {
  locale: string;
  currency?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    ...(minimumFractionDigits !== undefined ? { minimumFractionDigits } : {}),
  });
};

export const dateFormatter = ({ locale }: { locale: string }) => {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateValue = ({
  locale,
  value,
  fallback = '--',
}: {
  locale: string;
  value?: string | Date | null;
  fallback?: string;
}) => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return dateFormatter({ locale }).format(date);
};

export const numberFormatter = ({
  locale,
  minimumFractionDigits,
  maximumFractionDigits,
}: {
  locale: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}) =>
  new Intl.NumberFormat(locale, {
    ...(minimumFractionDigits !== undefined ? { minimumFractionDigits } : {}),
    ...(maximumFractionDigits !== undefined ? { maximumFractionDigits } : {}),
  });
