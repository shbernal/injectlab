import { IMAGE_TYPES } from './image.js';
import type { InjectSpec } from '../spec/types.js';

/**
 * Fetching a supplied asset over the network.
 *
 * This is the one module in the rendering package that makes a request, and it is deliberately
 * off the render path. `buildDocument` never calls it. The caller fetches first, at its own
 * boundary, and hands the resulting `data:` URI to the composer, so the composed document is
 * still self-contained, the render still issues no request, and the core test suite still runs
 * with no network. That separation is the reason this file exists rather than a `fetch` inside
 * `view.ts`.
 *
 * What the caller is accepting when it uses this, stated once here so it is not rediscovered:
 * the bytes at the far end are not ours, they are not verified, and they can change or vanish
 * between runs. A spec naming a URL is therefore not deterministic in the way the rest of the
 * format is. The guards below exist so that failure is quick and legible, not so that a
 * hostile asset becomes safe.
 */

/** Enough for any wordmark or device. A masthead that needs more than this is the wrong file. */
const MAX_BYTES = 2 * 1024 * 1024;

const TIMEOUT_MS = 10_000;

const ALLOWED_TYPES = new Set(Object.values(IMAGE_TYPES));

export class RemoteAssetError extends Error {
  readonly url: string;

  constructor(url: string, detail: string) {
    super(`cannot fetch ${url}: ${detail}`);
    this.name = 'RemoteAssetError';
    this.url = url;
  }
}

/**
 * Thrown when a spec names a URL and the caller has not permitted remote fetching.
 *
 * Separate from `RemoteAssetError` because it is not a failure of the fetch: nothing was
 * attempted. The CLI turns this into a usage error with the flag to pass, which is a different
 * exit code and a different message from a host that timed out.
 */
export class RemoteNotPermittedError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`remote asset not permitted: ${url}`);
    this.name = 'RemoteNotPermittedError';
    this.url = url;
  }
}

/**
 * The `Content-Type` decides the format, not the URL's extension.
 *
 * A URL often has no extension at all, and where it has one it is a claim by whoever wrote the
 * link rather than a fact about the bytes. Parameters are stripped because `image/svg+xml;
 * charset=utf-8` is a normal thing for a server to send.
 */
function imageTypeOf(response: Response, url: string): string {
  const header = response.headers.get('content-type') ?? '';
  const type = header.split(';')[0]?.trim().toLowerCase() ?? '';

  if (!ALLOWED_TYPES.has(type)) {
    throw new RemoteAssetError(
      url,
      `expected an image, got ${type === '' ? 'no content-type' : type}`,
    );
  }
  return type;
}

/** Fetches a remote image and returns it as a `data:` URI, ready to embed. */
export async function fetchRemoteImage(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new RemoteAssetError(url, 'not a valid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new RemoteAssetError(url, `unsupported protocol ${parsed.protocol}`);
  }

  let response: Response;
  try {
    response = await fetch(parsed, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new RemoteAssetError(url, error instanceof Error ? error.message : String(error));
  }

  if (!response.ok) {
    throw new RemoteAssetError(url, `HTTP ${response.status} ${response.statusText}`.trim());
  }

  const type = imageTypeOf(response, url);

  // Checked before reading and again after, because `Content-Length` is optional and a server
  // that omits it or lies about it should still not be able to stream unbounded bytes into
  // memory on the way to a base64 encode.
  const declared = Number(response.headers.get('content-length') ?? Number.NaN);
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    throw new RemoteAssetError(url, `too large: ${declared} bytes, limit ${MAX_BYTES}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    throw new RemoteAssetError(url, `too large: ${bytes.length} bytes, limit ${MAX_BYTES}`);
  }
  if (bytes.length === 0) throw new RemoteAssetError(url, 'empty response');

  return `data:${type};base64,${bytes.toString('base64')}`;
}

export interface PrefetchOptions {
  /** Required for a URL to be fetched at all. The CLI sets it from `--allow-remote`. */
  allowRemote?: boolean;
}

/** Every remote URL a batch of injects names. Currently only mastheads reference one. */
export function remoteUrlsIn(injects: readonly InjectSpec[]): string[] {
  const urls = new Set<string>();
  for (const inject of injects) {
    if (inject.kind !== 'news') continue;
    const url = inject.masthead?.url;
    if (url !== undefined) urls.add(url);
  }
  return [...urls];
}

/**
 * Fetches everything a batch names, once each, into the lookup the composer reads.
 *
 * A URL rather than an inject index is the key, so twenty injects sharing one mark cost one
 * request. The map is what `ViewContext.remoteAssets` wants, and an empty map is the ordinary
 * result: most specs name nothing remote.
 *
 * Throws `RemoteNotPermittedError` on the first URL when the caller has not opted in. Nothing
 * is fetched in that case, including the URLs after it.
 */
export async function prefetchRemoteAssets(
  injects: readonly InjectSpec[],
  options: PrefetchOptions = {},
): Promise<Map<string, string>> {
  const urls = remoteUrlsIn(injects);
  const resolved = new Map<string, string>();
  if (urls.length === 0) return resolved;

  if (options.allowRemote !== true) throw new RemoteNotPermittedError(urls[0] ?? '');

  for (const url of urls) resolved.set(url, await fetchRemoteImage(url));
  return resolved;
}
