import type { DateFormat, Outlet } from '../outlets/types.js';

/**
 * Dates, the way each outlet writes them.
 *
 * Pure, and the host time zone is never read. The outlet's own zone is the only one that
 * matters: a BBC story is timestamped in London whether it is rendered in Paris or in CI.
 */

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let found = cache.get(key);
  if (found === undefined) {
    found = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    cache.set(key, found);
  }
  return found;
}

/** '12 August 2026', '12 aout 2026'. */
export function formatDate(instant: string, outlet: Outlet): string {
  const date = new Date(instant);
  const { locale, timeZone } = outlet;

  switch (outlet.conventions.dateFormat) {
    case 'iso':
      return formatter('en-CA', timeZone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    case 'uk-long':
    case 'fr-long':
      return formatter(locale, timeZone, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
  }
}

/** '09:14'. Twenty-four hour in both locales we care about, but the locale decides. */
export function formatTime(instant: string, outlet: Outlet): string {
  return formatter(outlet.locale, outlet.timeZone, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instant));
}

/**
 * The full timestamp line as the outlet prints it, label included.
 *
 * 'Published 12 August 2026, 09:14' against 'Publie le 12 aout 2026 a 09h14'. The joining
 * words are part of the convention, which is why this is not one `Intl` call with a format
 * option.
 */
export function formatTimestamp(instant: string, outlet: Outlet): string {
  const date = formatDate(instant, outlet);
  const time = formatTime(instant, outlet);
  const label = outlet.conventions.updatedLabel;

  return joinTimestamp(outlet.conventions.dateFormat, label, date, time);
}

function joinTimestamp(format: DateFormat, label: string, date: string, time: string): string {
  switch (format) {
    case 'fr-long':
      return `${label} ${date} a ${time.replace(':', 'h')}`;
    case 'uk-long':
    case 'iso':
      return `${label} ${date}, ${time}`;
  }
}

/** 'By Helen Morrow', 'Par Jean Dupont'. Empty when the spec carries no byline. */
export function formatByline(byline: string | undefined, outlet: Outlet): string {
  if (byline === undefined || byline.trim() === '') return '';
  return `${outlet.conventions.bylinePrefix}${byline.trim()}`;
}
