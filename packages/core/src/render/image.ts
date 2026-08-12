import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Embedding a local image into the composed document.
 *
 * Same reason fonts are embedded: the document has to be self-contained and the render has to
 * make no request. A path that does not resolve is an error rather than a broken image,
 * because a broken image in an exercise asset is the kind of thing nobody notices until it is
 * in front of the exercise cell.
 */

export const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  // Here for supplied mastheads, which are usually vector, and harmless everywhere else. An
  // SVG behind `<img src="data:...">` cannot run script or pull a further resource, so this
  // adds a format without adding a way for a document to reach the network.
  '.svg': 'image/svg+xml',
};

export class ImageError extends Error {
  constructor(imagePath: string, cause: unknown) {
    super(`cannot read image ${imagePath}: ${cause instanceof Error ? cause.message : cause}`);
    this.name = 'ImageError';
  }
}

export async function embedImage(imagePath: string, baseDir: string | undefined): Promise<string> {
  const resolved = baseDir === undefined ? imagePath : path.resolve(baseDir, imagePath);
  const type = IMAGE_TYPES[path.extname(resolved).toLowerCase()];

  if (type === undefined) {
    throw new ImageError(
      imagePath,
      `unsupported extension, expected one of ${Object.keys(IMAGE_TYPES).join(', ')}`,
    );
  }

  try {
    const bytes = await readFile(resolved);
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch (error) {
    throw new ImageError(imagePath, error);
  }
}
