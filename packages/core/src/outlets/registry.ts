import { bbc } from './bbc.js';
import type { Outlet } from './types.js';

/**
 * Every outlet injectlab knows about.
 *
 * Adding one is a file plus a line here. `OutletId` is derived from this record rather than
 * written out, so the spec type, the CLI's validation and its "known outlets" error message
 * all move together and cannot drift apart.
 */
const OUTLETS = {
  bbc,
} as const satisfies Record<string, Outlet>;

export type OutletId = keyof typeof OUTLETS;

export function listOutlets(): readonly Outlet[] {
  return Object.values(OUTLETS);
}

export function listOutletIds(): readonly OutletId[] {
  return Object.keys(OUTLETS) as OutletId[];
}

export function getOutlet(id: OutletId): Outlet {
  return OUTLETS[id];
}

/** Narrowing entry point for strings off the command line or out of a spec file. */
export function isOutletId(value: string): value is OutletId {
  return Object.hasOwn(OUTLETS, value);
}
