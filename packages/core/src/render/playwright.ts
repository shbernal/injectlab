import type { Renderer, RenderTarget } from './renderer.js';

/**
 * Headless Chromium, through Playwright.
 *
 * Fidelity to a real news page needs real CSS layout and real web fonts, which is the whole
 * reason for the browser. The cost is a browser download on install, which `inject doctor`
 * explains.
 *
 * Playwright is imported lazily from inside the constructor, so importing `@injectlab/core`
 * in a test that never renders neither pays for it nor fails when no browser is installed.
 * Nothing else in the package may import this file at module scope.
 */

/**
 * Launch flags chosen so two machines agree as closely as Chromium allows. They do not make
 * rendering byte-identical across operating systems, which is why tests snapshot the composed
 * HTML and never PNG bytes.
 */
const LAUNCH_ARGS = ['--force-color-profile=srgb', '--font-render-hinting=none'];

export interface PlaywrightRendererOptions {
  /** Passed to the browser context. Affects nothing we draw, but removes a variable. */
  locale?: string;
}

export class BrowserMissingError extends Error {
  constructor(cause: unknown) {
    super(
      'could not launch Chromium. Run `pnpm exec playwright install chromium`, or `inject doctor` for a check. ' +
        (cause instanceof Error ? cause.message : String(cause)),
    );
    this.name = 'BrowserMissingError';
  }
}

type Browser = Awaited<ReturnType<typeof launch>>;

async function launch() {
  const { chromium } = await import('playwright');
  return chromium.launch({ args: LAUNCH_ARGS });
}

export class PlaywrightRenderer implements Renderer {
  #browser: Browser | undefined;
  readonly #locale: string;

  constructor(options: PlaywrightRendererOptions = {}) {
    this.#locale = options.locale ?? 'en-GB';
  }

  async #ready(): Promise<Browser> {
    if (this.#browser === undefined) {
      try {
        this.#browser = await launch();
      } catch (error) {
        throw new BrowserMissingError(error);
      }
    }
    return this.#browser;
  }

  async render(html: string, target: RenderTarget): Promise<Uint8Array> {
    const browser = await this.#ready();

    const context = await browser.newContext({
      viewport: { width: target.width, height: target.height ?? 900 },
      deviceScaleFactor: target.scale,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      locale: this.#locale,
    });

    try {
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      // Measured as free, and kept anyway. A `data:` font is not a fetch, so there is no
      // request to race and the fonts are ready before `load` resolves. Depending on the
      // guarantee beats depending on the mechanism staying true across Chromium versions.
      await page.evaluate(() => document.fonts.ready);

      return await page.screenshot({ fullPage: target.height === undefined, type: 'png' });
    } finally {
      await context.close();
    }
  }

  async close(): Promise<void> {
    await this.#browser?.close();
    this.#browser = undefined;
  }
}
