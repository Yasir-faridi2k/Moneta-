export function money(paise: number, options: { compact?: boolean } = {}) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: options.compact ? 'compact' : 'standard',
  }).format(paise / 100);
}

export function paiseToInput(paise: number) {
  return (paise / 100).toFixed(2);
}

export function rupeesToPaise(value: string) {
  const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const paise = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(paise) && paise > 0 ? paise : null;
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function monthLabel(year: number, month: number, format: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat('en-IN', { month: format, year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}
