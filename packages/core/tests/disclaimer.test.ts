import { describe, expect, it } from 'vitest';

import { DEFAULT_DISCLAIMER } from '../src/index.js';

describe('DEFAULT_DISCLAIMER', () => {
  it('carries the exercise framing three times, which is the convention controllers expect', () => {
    expect(DEFAULT_DISCLAIMER).toBe('[EXERCISE, EXERCISE, EXERCISE]');
  });

  it('is bracketed, so it reads as an annotation rather than as part of the article', () => {
    expect(DEFAULT_DISCLAIMER.startsWith('[')).toBe(true);
    expect(DEFAULT_DISCLAIMER.endsWith(']')).toBe(true);
  });
});
