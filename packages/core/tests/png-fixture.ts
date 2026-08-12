/**
 * A minimal but structurally valid PNG: signature, IHDR with real dimensions, IEND.
 *
 * Enough to exercise chunk insertion and to stand in for a screenshot, without carrying an
 * image fixture around or launching a browser.
 */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xff_ff_ff_ff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xff_ff_ff_ff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typed = new Uint8Array(4 + data.length);
  typed.set(
    [...type].map((character) => character.charCodeAt(0)),
    0,
  );
  typed.set(data, 4);

  const out = new Uint8Array(4 + typed.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typed, 4);
  view.setUint32(4 + typed.length, crc32(typed));
  return out;
}

export function tinyPng(width = 4, height = 3): Uint8Array {
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData.set([8, 6, 0, 0, 0], 8);

  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = chunk('IHDR', ihdrData);
  const iend = chunk('IEND', new Uint8Array(0));

  const png = new Uint8Array(signature.length + ihdr.length + iend.length);
  png.set(signature, 0);
  png.set(ihdr, signature.length);
  png.set(iend, signature.length + ihdr.length);
  return png;
}
