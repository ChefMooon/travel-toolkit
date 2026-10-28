import i18n from '@/i18n';

export function activeLocale(): string {
  return i18n.resolvedLanguage === 'fr-CA' ? 'fr-CA' : 'en-US';
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(activeLocale(), options).format(value);
}

export function formatCurrency(value: number, currency: string, options: Omit<Intl.NumberFormatOptions, 'style' | 'currency'> = {}): string {
  return new Intl.NumberFormat(activeLocale(), { style: 'currency', currency, ...options }).format(value);
}

export function formatDate(value: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(activeLocale(), options).format(value);
}

export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions): string {
  return new Intl.RelativeTimeFormat(activeLocale(), options).format(value, unit);
}
