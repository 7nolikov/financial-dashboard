import type { CoreState } from '../state/store';

/**
 * Encode the shareable portion of state as a base64 URL-safe string.
 * We omit chart.zoom (UI state) to keep the URL shorter.
 */
export function encodeStateToHash(state: CoreState): string {
  const shareable = {
    version: state.version,
    dobISO: state.dobISO,
    incomes: state.incomes,
    expenses: state.expenses,
    investments: state.investments,
    loans: state.loans,
    safetySavings: state.safetySavings,
    retirement: state.retirement,
    milestones: state.milestones,
    inflation: state.inflation,
  };
  try {
    const json = JSON.stringify(shareable);
    // btoa expects binary string; encodeURIComponent handles unicode
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

export function decodeHashToState(hash: string): Partial<CoreState> | null {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    return JSON.parse(json) as Partial<CoreState>;
  } catch {
    return null;
  }
}

export function buildShareURL(state: CoreState): string {
  const encoded = encodeStateToHash(state);
  if (!encoded) return window.location.href;
  const url = new URL(window.location.href);
  url.hash = `state=${encoded}`;
  return url.toString();
}

export function loadStateFromURL(): Partial<CoreState> | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#state=')) return null;
    const encoded = hash.slice('#state='.length);
    return decodeHashToState(encoded);
  } catch {
    return null;
  }
}
