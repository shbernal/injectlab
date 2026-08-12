import type { XTheme } from '../../spec/types.js';

/**
 * The X platform record.
 *
 * Deliberately not an entry in the outlet registry. An outlet has a masthead, a locale, date
 * conventions and a byline prefix, and X has none of those: it renders whatever its users
 * write, in whatever language they wrote it. Putting it in the registry would have meant
 * inventing a masthead and a `bylinePrefix` for a platform that has neither, which is the
 * sign that a model is being bent rather than used.
 *
 * The theme lives beside the layout because there is exactly one of it. If a second
 * platform arrives with the same shape, that is the moment to generalise, not before.
 */

export interface PlatformTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    muted: string;
    rule: string;
    accent: string;
    verifiedBlue: string;
    verifiedGold: string;
    verifiedGrey: string;
  };
  fidelity: string;
}

const PALETTES: Record<XTheme, PlatformTheme['colors']> = {
  light: {
    background: '#ffffff',
    text: '#0f1419',
    muted: '#536471',
    rule: '#eff3f4',
    accent: '#1d9bf0',
    verifiedBlue: '#1d9bf0',
    verifiedGold: '#e2b719',
    verifiedGrey: '#829aab',
  },
  dim: {
    background: '#15202b',
    text: '#f7f9f9',
    muted: '#8b98a5',
    rule: '#38444d',
    accent: '#1d9bf0',
    verifiedBlue: '#1d9bf0',
    verifiedGold: '#e2b719',
    verifiedGrey: '#829aab',
  },
  dark: {
    background: '#000000',
    text: '#e7e9ea',
    muted: '#71767b',
    rule: '#2f3336',
    accent: '#1d9bf0',
    verifiedBlue: '#1d9bf0',
    verifiedGold: '#e2b719',
    verifiedGrey: '#829aab',
  },
};

export const X_PLATFORM = {
  id: 'x',
  name: 'X',
  fidelity:
    'Typography is approximated: Inter stands in for the platform interface face, which is not ' +
    'bundled and could not be. The verification badge is a redrawn circle with a check, not the ' +
    'platform mark, and the wordmark is a plain letter rather than the logo. Avatars are ' +
    'generated initials blocks unless a local image is supplied; nothing is ever fetched. The ' +
    'palettes are the three published themes and are close, but this is a recognisable ' +
    'impression of the interface, not a copy of it.',
} as const;

export function xTheme(theme: XTheme = 'light'): PlatformTheme {
  return { ...X_PLATFORM, colors: PALETTES[theme] };
}

export function xThemes(): readonly XTheme[] {
  return Object.keys(PALETTES) as XTheme[];
}
