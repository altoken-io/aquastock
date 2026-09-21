/**
 * Cleans what is typed or pasted into an amount box down to digits and at most one decimal
 * point. Spanish speakers often type a comma as the decimal mark, so a lone comma becomes a
 * point; when a point is also present, commas are grouping and are dropped ("1,234.5").
 */
export function sanitizeAmountInput(raw: string): string {
  const unified = raw.includes('.')
    ? raw.replace(/,/g, '')
    : raw.replace(/,(?=.*,)/g, '').replace(',', '.');
  const [head = '', ...rest] = unified.replace(/[^0-9.]/g, '').split('.');
  const value = rest.length > 0 ? `${head}.${rest.join('')}` : head;
  return (value.startsWith('.') ? `0${value}` : value).slice(0, 32);
}

/** A trailing point ("5.") is an unfinished number, not a mistake, so it is not parsed. */
export function amountForParsing(input: string): string {
  return input.endsWith('.') ? input.slice(0, -1) : input;
}
