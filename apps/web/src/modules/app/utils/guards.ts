/** Narrows untrusted data (e.g. a `t.raw()` list from the locale files) to a list of strings. */
export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** A `t.raw()` list of strings, or an empty list if the locale file doesn't hold one. */
export const stringList = (value: unknown): string[] =>
  isStringArray(value) ? value : [];

const isNavLink = (value: unknown): value is NavLink =>
  typeof value === 'object' &&
  value !== null &&
  'href' in value &&
  typeof value.href === 'string' &&
  'title' in value &&
  typeof value.title === 'string' &&
  (!('description' in value) ||
    value.description === undefined ||
    typeof value.description === 'string');

/** A `t.raw()` list of navigation links, or an empty list if the locale file doesn't hold one. */
export const navLinks = (value: unknown): NavLink[] =>
  Array.isArray(value) ? value.filter(isNavLink) : [];
