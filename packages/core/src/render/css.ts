import type { OutletTheme } from '../outlets/types.js';

/**
 * The shared stylesheet and the theme's custom properties.
 *
 * The rule that makes an outlet a data change and not a code change: **layouts read
 * variables only.** No layout hardcodes an outlet colour, family or metric. If a layout needs
 * a value the theme does not expose, the theme gains a field, not the layout a literal.
 */

export const RESET = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
img { max-width: 100%; display: block; }
figure { margin: 0; }
h1, h2, h3, p { margin: 0; }
body {
  background: var(--il-bg);
  color: var(--il-text);
  font-family: var(--il-font-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
`.trim();

/**
 * The theme, as custom properties.
 *
 * Font stacks are written here rather than in a layout so that the embedded family always
 * comes first and the fallback stack always follows, in one place.
 */
const stack = (font: OutletTheme['fonts']['body']) => `'${font.family}', ${font.fallback}`;

export function themeVariables(theme: OutletTheme): string {
  const variables: Record<string, string> = {
    '--il-font-headline': stack(theme.fonts.headline),
    '--il-font-body': stack(theme.fonts.body),
    '--il-font-ui': stack(theme.fonts.ui),

    '--il-text': theme.colors.text,
    '--il-muted': theme.colors.muted,
    '--il-accent': theme.colors.accent,
    '--il-on-accent': theme.colors.onAccent,
    '--il-rule': theme.colors.rule,
    '--il-bg': theme.colors.background,
    '--il-section': theme.colors.sectionTag,

    '--il-headline-size': `${theme.scale.headlineSize}px`,
    '--il-headline-weight': String(theme.scale.headlineWeight),
    '--il-headline-leading': String(theme.scale.headlineLeading),
    '--il-measure': `${theme.scale.measure}px`,
    '--il-hero-measure': `${theme.hero.measure}px`,
    '--il-hero-align': theme.hero.align,
  };

  const body = Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `:root {\n${body}\n}`;
}
