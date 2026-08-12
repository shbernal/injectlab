import { describe, expect, it } from 'vitest';

import {
  NotAPngError,
  PROVENANCE_COMMENT,
  addProvenance,
  pngSize,
  readProvenance,
} from '../src/render/provenance.js';
import { tinyPng } from './png-fixture.js';

const PROVENANCE = { software: 'injectlab 0.0.0', kind: 'news', outlet: 'bbc' };

describe('addProvenance', () => {
  it('round trips every key it wrote', () => {
    const marked = addProvenance(tinyPng(), { ...PROVENANCE, generatedFrom: 'acme.yaml' });
    expect(readProvenance(marked)).toEqual({
      Software: 'injectlab 0.0.0',
      Comment: PROVENANCE_COMMENT,
      'injectlab.kind': 'news',
      'injectlab.outlet': 'bbc',
      'injectlab.generatedFrom': 'acme.yaml',
    });
  });

  it('omits generatedFrom when the render did not come from a file', () => {
    const marked = addProvenance(tinyPng(), PROVENANCE);
    expect(Object.hasOwn(readProvenance(marked), 'injectlab.generatedFrom')).toBe(false);
  });

  /**
   * The point of the whole module. Whoever finds the file later has no exercise briefing,
   * and the visible band may have been cropped off before they saw it.
   */
  it('always states that the material is synthetic', () => {
    expect(readProvenance(addProvenance(tinyPng(), PROVENANCE)).Comment).toBe(PROVENANCE_COMMENT);
  });

  it('leaves the image dimensions untouched', () => {
    const marked = addProvenance(tinyPng(1200, 630), PROVENANCE);
    expect(pngSize(marked)).toEqual({ width: 1200, height: 630 });
  });

  it('keeps the signature and every original byte, only inserting', () => {
    const original = tinyPng();
    const marked = addProvenance(original, PROVENANCE);

    expect(marked.length).toBeGreaterThan(original.length);
    expect([...marked.subarray(0, 8 + 25)]).toEqual([...original.subarray(0, 8 + 25)]);
    expect([...marked.subarray(marked.length - 12)]).toEqual([
      ...original.subarray(original.length - 12),
    ]);
  });

  /**
   * Marking twice replaces rather than accumulates. Two records in one file means a reader
   * gets whichever it reaches last, which is worse than having none.
   */
  it('replaces its own records on a second pass instead of stacking them', () => {
    const once = addProvenance(tinyPng(), PROVENANCE);
    const twice = addProvenance(once, { ...PROVENANCE, outlet: 'lemonde' });

    expect(readProvenance(twice)['injectlab.outlet']).toBe('lemonde');
    // Grows only by the difference in the value itself, so the old chunks are gone rather
    // than sitting behind the new ones.
    expect(twice.length).toBe(once.length + ('lemonde'.length - 'bbc'.length));
  });

  it('refuses anything that is not a PNG rather than corrupting it', () => {
    expect(() => addProvenance(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), PROVENANCE)).toThrow(
      NotAPngError,
    );
    expect(() => readProvenance(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow(NotAPngError);
  });

  /** tEXt is Latin-1 by the specification, so anything outside it is dropped, not mangled. */
  it('drops characters a tEXt chunk cannot hold', () => {
    const marked = addProvenance(tinyPng(), { ...PROVENANCE, outlet: 'ab中文cd' });
    expect(readProvenance(marked)['injectlab.outlet']).toBe('abcd');
  });
});
