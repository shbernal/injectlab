/**
 * The backend seam.
 *
 * Kept this small on purpose. It exists so a lighter backend, satori plus resvg with no
 * browser download, can be added later for the layouts that fit it, without touching a
 * single layout. It does not exist to abstract over needs nobody has yet.
 */

export interface RenderTarget {
  /** CSS pixels. The PNG comes out this wide multiplied by `scale`. */
  width: number;
  /** Omit for a full-page capture, which is the normal case for an article. */
  height?: number;
  scale: 1 | 2 | 3;
  format: 'png';
}

export interface Renderer {
  render(html: string, target: RenderTarget): Promise<Uint8Array>;
  close(): Promise<void>;
}

export const DEFAULT_TARGET: RenderTarget = { width: 1200, scale: 2, format: 'png' };
