// Moshi Urban Hostel PMS - Standard Formatters & Token Utilities
import { SupportedCurrency } from '../types';

/**
 * Standard date display: "Wed 23 Sep 2026"
 * Strictly prevents raw ISO strings from appearing in the UI.
 */
export function formatDateDisplay(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  // If already formatted or invalid, attempt parsing
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }); // e.g. "Wed 23 Sep 2026"
    }
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  return dateStr;
}

/**
 * Short date display for compact tables: "23 Sep 2026"
 */
export function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  return dateStr;
}

/**
 * Format money with primary currency and secondary equivalent.
 * Rule: Never duplicate currency code (e.g. "TZS 53,000 TZS" is prohibited).
 * Returns: { primary: "TZS 53,000", secondary: "≈ $20" }
 */
export function formatMoney(
  amountInActiveCurrency: number,
  currency: SupportedCurrency,
  exchangeRates: Record<string, number> = { TZS: 1, USD: 2650, EUR: 2880, GBP: 3370 }
): { primary: string; secondary: string; full: string } {
  const rounded = Math.round(amountInActiveCurrency);
  let primary = '';

  if (currency === 'TZS') {
    primary = `TZS ${rounded.toLocaleString()}`;
    const usdEquiv = Math.round((rounded / (exchangeRates.USD || 2650)));
    const secondary = `≈ $${usdEquiv}`;
    return { primary, secondary, full: `${primary} (${secondary})` };
  } else {
    const symbolMap: Record<SupportedCurrency, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      TZS: 'TZS '
    };
    primary = `${symbolMap[currency]}${rounded.toLocaleString()}`;
    const rateToTZS = exchangeRates[currency] || (currency === 'USD' ? 2650 : 1);
    const tzsEquiv = Math.round(rounded * rateToTZS);
    const secondary = `≈ TZS ${tzsEquiv.toLocaleString()}`;
    return { primary, secondary, full: `${primary} (${secondary})` };
  }
}

/**
 * Format single currency amount cleanly without secondary line
 */
export function formatCurrencySingle(amount: number, currency: SupportedCurrency): string {
  const rounded = Math.round(amount);
  if (currency === 'TZS') {
    return `TZS ${rounded.toLocaleString()}`;
  }
  const symbolMap: Record<SupportedCurrency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    TZS: 'TZS '
  };
  return `${symbolMap[currency]}${rounded.toLocaleString()}`;
}

/**
 * Format booking ID consistently (MU-001)
 */
export function formatBookingId(id: string): string {
  if (!id) return 'MU-000';
  if (id.startsWith('MU-')) return id;
  // If starts with B- e.g. B-101 -> MU-101
  const numPart = id.replace(/^[A-Za-z-]+/, '');
  if (numPart) {
    const padded = numPart.padStart(3, '0');
    return `MU-${padded}`;
  }
  return id;
}
