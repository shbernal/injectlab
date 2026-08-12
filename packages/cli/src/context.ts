import type { Renderer } from '@injectlab/core';

/**
 * What the CLI needs from the outside world.
 *
 * Injected rather than reached for, so tests drive `run` in process with a fake renderer and
 * captured output instead of spawning a binary and launching Chromium.
 */

export interface CliIo {
  /** Results. Kept parseable: nothing but the payload goes here. */
  out: (line: string) => void;
  /** Diagnostics, progress and errors, always. */
  err: (line: string) => void;
}

export interface CliContext {
  io: CliIo;
  createRenderer: () => Promise<Renderer>;
  /** Resolved once at the CLI boundary so core never reads a clock. */
  now: () => Date;
}

/**
 * The real renderer, imported lazily.
 *
 * `inject outlets` and `inject init` must not pay for Playwright, and on a machine with no
 * browser installed they must not fail because of it.
 */
export async function createPlaywrightRenderer(): Promise<Renderer> {
  const { PlaywrightRenderer } = await import('@injectlab/core/playwright');
  return new PlaywrightRenderer();
}

export function defaultContext(io: CliIo): CliContext {
  return { io, createRenderer: createPlaywrightRenderer, now: () => new Date() };
}
