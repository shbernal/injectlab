/**
 * PNG provenance.
 *
 * Every PNG injectlab writes says, inside the file, that it is synthetic exercise material.
 * This is not switchable, including when the visible disclaimer bands are turned off. The
 * band serves the person looking at the asset; the metadata serves whoever finds the file
 * six months later with no idea where it came from.
 *
 * `tEXt` chunks are written by hand rather than through three small dependencies. The
 * framing is length, type, data, CRC, and the whole thing is shorter than the code that
 * would wire a library up.
 */

const SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface Provenance {
  /** `injectlab <version>`. */
  software: string;
  kind: string;
  /** Outlet id for news, platform id for a post. See `sourceOf`. */
  source: string;
  /** Spec file basename, when rendering from a file. */
  generatedFrom?: string;
}

export const PROVENANCE_COMMENT =
  'SYNTHETIC EXERCISE MATERIAL. Not a real publication. Generated for a crisis exercise.';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xff_ff_ff_ff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xff_ff_ff_ff) >>> 0;
}

/**
 * `tEXt` is Latin-1 only by the specification. Anything outside it is dropped rather than
 * mangled: the alternative is `iTXt`, and none of these values need it.
 */
function latin1(text: string): Uint8Array {
  const kept = [...text].filter((character) => character.codePointAt(0)! <= 0xff);
  return Uint8Array.from(kept.map((character) => character.codePointAt(0)!));
}

function textChunk(keyword: string, value: string): Uint8Array {
  const key = latin1(keyword);
  const text = latin1(value);
  const data = new Uint8Array(key.length + 1 + text.length);
  data.set(key, 0);
  data[key.length] = 0;
  data.set(text, key.length + 1);

  const type = latin1('tEXt');
  const typed = new Uint8Array(type.length + data.length);
  typed.set(type, 0);
  typed.set(data, type.length);

  const chunk = new Uint8Array(4 + typed.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typed, 4);
  view.setUint32(4 + typed.length, crc32(typed));
  return chunk;
}

export class NotAPngError extends Error {
  constructor() {
    super('not a PNG: the file does not start with the PNG signature');
    this.name = 'NotAPngError';
  }
}

/** Keywords this module owns and will overwrite rather than duplicate. */
function isOurs(keyword: string): boolean {
  return keyword === 'Software' || keyword === 'Comment' || keyword.startsWith('injectlab.');
}

/**
 * Drops any `tEXt` chunk carrying a keyword we own.
 *
 * Without this, marking a PNG twice leaves both records in the file and a reader gets
 * whichever it happens to reach last. Provenance that contradicts itself is worse than none,
 * and this also stops the file growing every time it is passed through.
 */
function withoutOurText(png: Uint8Array): Uint8Array {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const keep: [number, number][] = [];
  let offset = 8;
  let lastKept = 8;

  while (offset + 8 <= png.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;

    if (type === 'tEXt') {
      const data = png.subarray(offset + 8, offset + 8 + length);
      const separator = data.indexOf(0);
      if (separator > 0 && isOurs(String.fromCharCode(...data.subarray(0, separator)))) {
        keep.push([lastKept, offset]);
        lastKept = end;
      }
    }

    if (type === 'IEND') break;
    offset = end;
  }

  if (keep.length === 0) return png;

  keep.push([lastKept, png.length]);
  const ranges = [[0, 8] as [number, number], ...keep];
  const total = ranges.reduce((sum, [start, end]) => sum + (end - start), 0);

  const out = new Uint8Array(total);
  let written = 0;
  for (const [start, end] of ranges) {
    out.set(png.subarray(start, end), written);
    written += end - start;
  }
  return out;
}

/**
 * Inserts the chunks immediately after `IHDR`, which is where a decoder is guaranteed to see
 * them and where they cannot be mistaken for image data.
 */
export function addProvenance(source: Uint8Array, provenance: Provenance): Uint8Array {
  if (!SIGNATURE.every((byte, index) => source[index] === byte)) throw new NotAPngError();

  const png = withoutOurText(source);

  const entries: [string, string][] = [
    ['Software', provenance.software],
    ['Comment', PROVENANCE_COMMENT],
    ['injectlab.kind', provenance.kind],
    ['injectlab.source', provenance.source],
    ...(provenance.generatedFrom === undefined
      ? []
      : ([['injectlab.generatedFrom', provenance.generatedFrom]] as [string, string][])),
  ];

  // Signature is 8 bytes, then IHDR: 4 length + 4 type + 13 data + 4 CRC.
  const insertAt = 8 + 4 + 4 + 13 + 4;
  const chunks = entries.map(([keyword, value]) => textChunk(keyword, value));
  const added = chunks.reduce((total, chunk) => total + chunk.length, 0);

  const out = new Uint8Array(png.length + added);
  out.set(png.subarray(0, insertAt), 0);

  let offset = insertAt;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  out.set(png.subarray(insertAt), offset);

  return out;
}

/** Reads the `tEXt` chunks back. */
export function readProvenance(png: Uint8Array): Record<string, string> {
  if (!SIGNATURE.every((byte, index) => png[index] === byte)) throw new NotAPngError();

  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const found: Record<string, string> = {};
  let offset = 8;

  while (offset + 8 <= png.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type === 'IEND') break;

    if (type === 'tEXt') {
      const data = png.subarray(offset + 8, offset + 8 + length);
      const separator = data.indexOf(0);
      if (separator > 0) {
        found[String.fromCharCode(...data.subarray(0, separator))] = String.fromCharCode(
          ...data.subarray(separator + 1),
        );
      }
    }

    offset += 12 + length;
  }

  return found;
}

/** Width and height from `IHDR`, so a test can assert dimensions without decoding pixels. */
export function pngSize(png: Uint8Array): { width: number; height: number } {
  if (!SIGNATURE.every((byte, index) => png[index] === byte)) throw new NotAPngError();
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
