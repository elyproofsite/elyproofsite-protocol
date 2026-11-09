// Register: every external fact is exactly one record with a state of stated | absent | unconfirmed.
// Nothing else in the codebase may hard-code these facts.
export const REG = {
  chain: {
    state: 'stated',
    name: 'Elysium',
    id: 99901,
    hex: '0x1863d',
    currency: 'HYPE',
    rpc: 'https://rpc.elysium.kinetiq.xyz',
    explorer: 'https://explorer.elysium.kinetiq.xyz',
  },
  ca: { state: 'absent', value: null },
  x: { state: 'stated', url: 'https://x.com/elyproofsite' },
  github: { state: 'absent', url: null },
  market: {
    state: 'stated',
    url: 'https://api.geckoterminal.com/api/v2/networks/elysium/trending_pools',
    include: 'base_token',
  },
  ownPair: { state: 'stated', url: 'https://api.dexscreener.com/latest/dex/tokens/' },
  site: { state: 'stated', domain: 'elyproof.site' },
};

// LINK RULE: an href exists only for a stated record that carries a url.
export const href = (rec) => (rec && rec.state === 'stated' && rec.url ? rec.url : null);

// The handle is derived from the stored url, never stored separately.
export const handleOf = (url) => {
  try {
    const p = new URL(url).pathname.split('/').filter(Boolean)[0];
    return p ? '@' + p : null;
  } catch {
    return null;
  }
};

// GATE: any well-formed 0x + 40 hex passes (lowercase, mixed-case, vanity, zero-heavy).
// There is no checksum or allow-list rejection. Only state and shape decide.
const HEX40 = /^0x[0-9a-fA-F]{40}$/;
export function caGate(rec = REG.ca) {
  if (rec.state !== 'stated') return { open: false, reason: rec.state };
  const v = typeof rec.value === 'string' ? rec.value.trim() : '';
  if (!HEX40.test(v)) return { open: false, reason: 'unconfirmed' };
  return { open: true, value: v };
}
