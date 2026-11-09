# ELYPROOF

Verified signal from Elysium's frontier.

[![Live site](https://img.shields.io/badge/live-elyproof.site-3bbce6)](https://elyproof.site)

## Overview

ELYPROOF is a static site that tracks the busiest pools on the Elysium chain and pins its own token to the first row of the board once a contract address is published.

- Chain: Elysium (chain ID 99901, `0x1863d`), gas token HYPE
- RPC: https://rpc.elysium.kinetiq.xyz
- Explorer: https://explorer.elysium.kinetiq.xyz
- Contract address: `TBA` (the site wires both states, so it activates the moment the address is set)

## Features

- Live market board from GeckoTerminal trending pools, ranked by 24h volume, with a matching ticker
- Skeleton loading, exponential backoff, last-good-data retention, 60 second polling that pauses on hidden tabs
- Own token row 1, fed by DexScreener when the address is stated, brand placeholder otherwise
- Click-to-copy contract slot and per-row token address copy
- Scroll reveal, parallax hero, spotlight hover, count-up with flash, scroll progress bar
- Full `prefers-reduced-motion` fallback

## Links

- Site: https://elyproof.site
- X: https://x.com/elyproofsite
- Whitepaper: [docs/whitepaper.md](docs/whitepaper.md)

## Develop

```bash
npm install
npm run build   # writes the deployable site to dist/
npm run preview
```

Every external fact lives in `src/register.js` as a record with state `stated`, `absent` or `unconfirmed`. To announce the contract address, set `ca` to `{ state: 'stated', value: '0x…' }`.

## License

MIT
