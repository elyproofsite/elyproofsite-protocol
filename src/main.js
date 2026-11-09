import './style.css';
import { REG, href, handleOf, caGate } from './register.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;

/* ---------- icons ---------- */
const ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>';
const ICON_GH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>';
const ICON_COPY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const ICON_OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = typeof v === 'string' ? parseFloat(v) : v; return Number.isFinite(n) ? n : null; };
const short = (a) => (a && a.length > 12 ? a.slice(0, 6) + '…' + a.slice(-4) : a || '');
const DASH = '—';

function fmtPrice(n) {
  if (n == null) return DASH;
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return '$' + n.toFixed(n >= 100 ? 2 : 3);
  if (n === 0) return '$0';
  if (n >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(Math.min(14, -Math.floor(Math.log10(Math.abs(n))) + 2));
}
function fmtCompact(n) {
  if (n == null) return DASH;
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}
function fmtPct(n) {
  if (n == null) return DASH;
  return (n > 0 ? '▲ +' : n < 0 ? '▼ ' : '') + n.toFixed(2) + '%';
}
const FMT = { price: fmtPrice, compact: fmtCompact, pct: fmtPct, int: (n) => (n == null ? DASH : Math.round(n).toLocaleString('en-US')) };

/* count-up + flash on change */
function setNum(el, val, kind, opts = {}) {
  if (!el) return;
  const f = FMT[kind];
  if (val == null) { el._v = null; el.textContent = DASH; return; }
  const prev = el._v;
  if (prev === val) return;
  el._v = val;
  cancelAnimationFrame(el._raf);
  const first = prev == null;
  const from = first ? 0 : prev;
  if (reduced() || (!first && Math.abs(val - from) < 1e-12)) { el.textContent = f(val); return; }
  if (!first) {
    const cls = val > prev ? 'flash-up' : 'flash-dn';
    el.classList.remove('flash-up', 'flash-dn'); void el.offsetWidth; el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 950);
  }
  const dur = first ? 800 : 520;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(from + (val - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(step); else el.textContent = f(val);
  };
  el._raf = requestAnimationFrame(step);
}

/* clipboard with feedback */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch { return false; }
  }
}
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800);
}
function flashBtn(btn) {
  btn.classList.add('ok'); const old = btn.innerHTML; btn.innerHTML = ICON_OK;
  setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = old; }, 1200);
}

/* ---------- header: socials (register driven) ---------- */
function renderSocials() {
  const box = $('#socials');
  const xUrl = href(REG.x);
  const xHandle = REG.x.url ? handleOf(REG.x.url) : null;
  const x = xUrl
    ? `<a class="sbtn" href="${esc(xUrl)}" target="_blank" rel="noopener noreferrer" aria-label="X ${esc(xHandle || '')}">${ICON_X}</a>`
    : `<span class="sbtn" role="img" aria-disabled="true" aria-label="X link not published yet">${ICON_X}</span>`;
  const gUrl = href(REG.github);
  const g = gUrl
    ? `<a class="sbtn" href="${esc(gUrl)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub ${esc(handleOf(gUrl) || '')}">${ICON_GH}</a>`
    : `<span class="sbtn" role="img" aria-disabled="true" aria-label="GitHub link not published yet">${ICON_GH}</span>`;
  box.innerHTML = x + g;
  const f = $('#ftrLinks');
  if (xUrl && xHandle) f.insertAdjacentHTML('beforeend', `<a href="${esc(xUrl)}" target="_blank" rel="noopener noreferrer">${esc(xHandle)}</a>`);
  if (gUrl) f.insertAdjacentHTML('beforeend', `<a href="${esc(gUrl)}" target="_blank" rel="noopener noreferrer">GitHub</a>`);
  const exp = href({ state: REG.chain.state, url: REG.chain.explorer });
  const eb = $('#explorerBtn');
  if (exp) eb.href = exp; else { eb.removeAttribute('href'); eb.setAttribute('aria-disabled', 'true'); }
}

/* ---------- CA slot ---------- */
const gate = caGate();
function renderCA() {
  const slot = $('#caSlot');
  if (gate.open) {
    slot.innerHTML = `<div class="ca-box" id="caBox"><div class="ca-main"><span class="ca-lab">Contract address</span><button type="button" class="ca-val" id="caVal" style="text-align:left;width:100%" aria-label="Copy contract address">${esc(gate.value)}</button></div><span class="ca-fb" id="caFb" aria-hidden="true">Copied</span><button type="button" class="ca-copy" id="caCopy" aria-label="Copy contract address">${ICON_COPY}</button></div>`;
    const go = async () => {
      const ok = await copyText(gate.value);
      const box = $('#caBox'); const fb = $('#caFb');
      fb.textContent = ok ? 'Copied' : 'Copy failed';
      box.classList.add('done'); toast(ok ? 'Address copied' : 'Copy failed, select it by hand');
      if (ok) flashBtn($('#caCopy'));
      setTimeout(() => box.classList.remove('done'), 1400);
    };
    $('#caVal').addEventListener('click', go); $('#caCopy').addEventListener('click', go);
  } else {
    slot.innerHTML = `<div class="ca-box inert" aria-disabled="true"><div class="ca-main"><span class="ca-lab">Contract address</span><span class="ca-val pending">Not published yet</span></div><span class="ca-copy" aria-hidden="true">${ICON_COPY}</span></div>`;
  }
}

/* ---------- chain panel ---------- */
function renderChain() {
  const c = REG.chain;
  $('#t-chain').textContent = String(c.id);
  $('#t-cur').textContent = c.currency;
  const row = (k, v, copy) => `<div class="kv"><dt>${k}</dt><dd><span>${v}</span>${copy ? `<button type="button" class="cp" data-copy="${esc(copy)}" aria-label="Copy ${k}">${ICON_COPY}</button>` : ''}</dd></div>`;
  const exp = href({ state: c.state, url: c.explorer });
  $('#kvs').innerHTML =
    row('Network', esc(c.name)) +
    row('Chain ID', `${c.id} <span style="color:var(--faint)">(${esc(c.hex)})</span>`, String(c.id)) +
    row('Currency', esc(c.currency)) +
    row('RPC', esc(c.rpc), c.rpc) +
    row('Explorer', exp ? `<a href="${esc(exp)}" target="_blank" rel="noopener noreferrer">${esc(new URL(exp).host)}</a>` : DASH, exp) +
    `<div class="kv kv-btn"><button type="button" class="btn btn-primary" id="walletBtn2">Add network</button></div>`;
  $('#walletBtn2').addEventListener('click', addNetwork);
}
async function addNetwork() {
  const c = REG.chain;
  if (!window.ethereum?.request) { toast('No wallet detected in this browser'); return; }
  try {
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: c.hex, chainName: c.name, nativeCurrency: { name: c.currency, symbol: c.currency, decimals: 18 }, rpcUrls: [c.rpc], blockExplorerUrls: [c.explorer] }] });
  } catch (e) { if (e && e.code !== 4001) toast('Wallet could not add the network'); }
}

/* ---------- market state ---------- */
const M = { pools: [], hadData: false, failed: false, sort: 'vol', own: null, ownFailed: false, ownLoaded: false };
const ownOn = gate.open;

function tileLogo(url, sym, own) {
  const letter = esc((sym || '?').trim().charAt(0).toUpperCase() || '?');
  if (url) return `<span class="tilef" data-sym="${letter}"><img src="${esc(url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`;
  return `<span class="tilef letter">${letter}</span>`;
}
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.closest('.tilef')) {
    const tile = t.closest('.tilef'); const l = tile.dataset.sym || '?';
    tile.classList.add('letter'); tile.textContent = l;
  }
}, true);

/* data parse: GeckoTerminal trending pools, de-duplicated per base token, ranked by 24h volume */
function parseGecko(json) {
  const inc = new Map();
  for (const t of json.included || []) inc.set(t.id, t.attributes || {});
  const best = new Map();
  for (const p of json.data || []) {
    const a = p.attributes || {};
    const tid = p.relationships?.base_token?.data?.id || '';
    const tok = inc.get(tid) || {};
    const addr = (tok.address || tid.replace(/^[^_]+_/, '') || '').toLowerCase();
    const name = (a.name || '').split(' / ')[0];
    const img = tok.image_url && !/missing/i.test(tok.image_url) ? tok.image_url : null;
    const rec = {
      key: addr || p.id, addr, sym: tok.symbol || name || '?', name: tok.name || name || '',
      img, price: num(a.base_token_price_usd), chg: num(a.price_change_percentage?.h24),
      vol: num(a.volume_usd?.h24), liq: num(a.reserve_in_usd),
    };
    const cur = best.get(rec.key);
    if (!cur || (rec.vol ?? -1) > (cur.vol ?? -1)) best.set(rec.key, rec);
  }
  return [...best.values()].sort((a, b) => (b.vol ?? -1) - (a.vol ?? -1)).slice(0, 10);
}

/* ---------- rows ---------- */
const rowsEl = $('#rows');
const rowMap = new Map();
let firstPaintDone = false;

function rowHTML(r, rank) {
  return `<span class="rk">${rank}</span>
<div class="tkn">${tileLogo(r.img, r.sym)}<span class="nm"><b>${esc(r.sym)}</b><i>${esc(r.name)}</i></span></div>
<span class="c c-p" data-f="price">${DASH}</span><span class="c c-c" data-f="chg">${DASH}</span><span class="c c-v" data-f="vol">${DASH}</span><span class="c c-l" data-f="liq">${DASH}</span>
<button type="button" class="cp" data-addr="${esc(r.addr)}" aria-label="Copy ${esc(r.sym)} token address" ${r.addr ? '' : 'disabled'}>${ICON_COPY}</button>`;
}
function fillRow(el, r) {
  setNum($('[data-f=price]', el), r.price, 'price');
  const ch = $('[data-f=chg]', el);
  setNum(ch, r.chg, 'pct');
  ch.classList.toggle('up', (r.chg ?? 0) > 0); ch.classList.toggle('dn', (r.chg ?? 0) <= 0);
  setNum($('[data-f=vol]', el), r.vol, 'compact');
  setNum($('[data-f=liq]', el), r.liq, 'compact');
}
function skelRows() {
  const n = 9;
  let h = '';
  for (let i = 0; i < n; i++) h += `<div class="lrow sk-row fadein" style="--d:${i}"><span class="rk">${i + 2}</span><div class="tkn"><span class="sk t"></span><span class="sk w"></span></div><span class="c c-p"><span class="sk"></span></span><span class="c c-c"><span class="sk"></span></span><span class="c c-v"><span class="sk"></span></span><span class="c c-l"><span class="sk"></span></span><span></span></div>`;
  return h;
}

/* own row (#1): pinned. Both gate branches are live in code, state decides at runtime. */
function ownRowEl() {
  let el = rowMap.get('own');
  if (el) return el;
  el = document.createElement('div');
  el.className = 'lrow own spotr'; el.setAttribute('role', 'row'); el.dataset.key = 'own';
  rowMap.set('own', el);
  return el;
}
function renderOwn() {
  const el = ownRowEl();
  const logo = '/brand/logo-64.png';
  if (!ownOn) {
    // gate closed: brand logo placeholder (never a letter tile), inert data cells
    if (el.dataset.mode !== 'ph') {
      el.dataset.mode = 'ph';
      el.classList.add('ph-row'); el.removeAttribute('tabindex');
      el.innerHTML = `<span class="rk">1</span>
<div class="tkn"><span class="tilef"><img src="${logo}" alt="" width="28" height="28"></span><span class="nm"><b>ELYPROOF<span class="pin">Pinned</span></b><i>Awaiting address</i></span></div>
<span class="c c-p">· · · · ·</span><span class="c c-c">· · · · ·</span><span class="c c-v">· · · · ·</span><span class="c c-l">· · · · ·</span><span aria-hidden="true"></span>`;
    }
    return;
  }
  el.classList.remove('ph-row');
  if (el.dataset.mode !== 'live') {
    el.dataset.mode = 'live';
    const sym = M.own?.sym || 'ELYPROOF';
    el.innerHTML = `<span class="rk">1</span>
<div class="tkn"><span class="tilef" data-sym="${esc(sym.charAt(0).toUpperCase())}"><img src="${logo}" alt=""></span><span class="nm"><b data-f="sym">${esc(sym)}<span class="pin">Pinned</span></b><i data-f="nm">${esc(M.own?.name || '')}</i></span></div>
<span class="c c-p" data-f="price"><span class="sk"></span></span><span class="c c-c" data-f="chg"><span class="sk"></span></span><span class="c c-v" data-f="vol"><span class="sk"></span></span><span class="c c-l" data-f="liq"><span class="sk"></span></span>
<button type="button" class="cp" data-addr="${esc(gate.value)}" aria-label="Copy token address">${ICON_COPY}</button>`;
  }
  if (M.own) {
    $('[data-f=sym]', el).firstChild.nodeValue = M.own.sym;
    $('[data-f=nm]', el).textContent = M.own.name;
    $$('.c .sk', el).forEach((s) => { s.parentElement.textContent = DASH; });
    fillRow(el, M.own);
  } else if (M.ownFailed) {
    $$('.c', el).forEach((c) => { c.textContent = DASH; c._v = null; });
  }
}

function sortedPools() {
  const k = M.sort;
  const key = { vol: 'vol', chg: 'chg', liq: 'liq' }[k];
  let list = M.pools.filter((p) => !(ownOn && M.own && M.own.addr && p.addr === M.own.addr)); // dedup against own row
  list = [...list].sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity));
  return list.slice(0, 9); // ranks 2..10
}
function renderBoard() {
  renderOwn();
  const own = rowMap.get('own');
  if (!M.hadData) {
    if (!rowsEl.querySelector('.sk-row') && !M.failed) rowsEl.innerHTML = '';
    if (!rowsEl.contains(own)) rowsEl.prepend(own);
    if (!rowsEl.querySelector('.sk-row') && !M.failed) rowsEl.insertAdjacentHTML('beforeend', skelRows());
    if (M.failed && !M.hadData) {
      rowsEl.querySelectorAll('.sk-row').forEach((r) => r.remove());
      if (!rowsEl.querySelector('.err-row')) {
        let h = '';
        for (let i = 0; i < 9; i++) h += `<div class="lrow err-row"><span class="rk">${i + 2}</span><div class="tkn"><span class="tilef letter">?</span><span class="nm"><b>${DASH}</b></span></div><span class="c c-p">${DASH}</span><span class="c c-c">${DASH}</span><span class="c c-v">${DASH}</span><span class="c c-l">${DASH}</span><span></span></div>`;
        rowsEl.insertAdjacentHTML('beforeend', h);
      }
    }
    return;
  }
  rowsEl.querySelectorAll('.sk-row, .err-row').forEach((r) => r.remove());
  const list = sortedPools();
  const keep = new Set(['own', ...list.map((p) => p.key)]);
  for (const [k, el] of rowMap) if (!keep.has(k)) { el.remove(); rowMap.delete(k); }
  let rank = 2;
  const frag = [own];
  list.forEach((p, i) => {
    let el = rowMap.get(p.key);
    if (!el) {
      el = document.createElement('div');
      el.className = 'lrow spotr'; el.setAttribute('role', 'row'); el.dataset.key = p.key;
      el.innerHTML = rowHTML(p, rank);
      if (!firstPaintDone && !reduced()) { el.classList.add('fresh'); el.style.setProperty('--d', i); }
      rowMap.set(p.key, el);
    }
    $('.rk', el).textContent = rank++;
    fillRow(el, p);
    frag.push(el);
  });
  frag.forEach((el, i) => { if (rowsEl.children[i] !== el) rowsEl.insertBefore(el, rowsEl.children[i] || null); });
  firstPaintDone = true;
}

/* ---------- stats, ticker, chart ---------- */
function renderStats() {
  const P = M.pools;
  const has = M.hadData && P.length;
  const sum = (k) => P.reduce((s, p) => s + (p[k] || 0), 0);
  setNum($('[data-n=pools]'), has ? P.length : null, 'int');
  setNum($('[data-n=vol]'), has ? sum('vol') : null, 'compact');
  setNum($('[data-n=liq]'), has ? sum('liq') : null, 'compact');
  let top = null;
  for (const p of P) if (p.chg != null && (top == null || p.chg > top.chg)) top = p;
  setNum($('[data-n=mover]'), top ? top.chg : null, 'pct');
  $('#moverSub').textContent = top ? top.sym + ' · best 24h swing' : 'Best 24h swing';
  setNum($('[data-n=ownp]'), ownOn && M.own ? M.own.price : null, 'price');
  setNum($('[data-n=ownv]'), ownOn && M.own ? M.own.vol : null, 'compact');
}

function renderTicker() {
  const track = $('#tickerTrack');
  if (!M.hadData) {
    track.style.animation = 'none';
    track.innerHTML = `<span class="tk-item">${M.failed ? DASH + ' feed unavailable' : 'loading feed'}</span>`;
    return;
  }
  const item = (p) => `<span class="tk-item"><b>${esc(p.sym)}</b>${fmtPrice(p.price)}<span class="${(p.chg ?? 0) > 0 ? 'up' : 'dn'}">${fmtPct(p.chg)}</span></span>`;
  const html = M.pools.map(item).join('');
  const sig = html;
  if (track.dataset.sig === sig) return;
  track.dataset.sig = sig;
  track.style.animation = '';
  track.innerHTML = html + html; // doubled for a seamless -50% loop
  track.setAttribute('aria-hidden', 'false');
  const w = track.scrollWidth / 2;
  track.style.setProperty('--dur', Math.max(24, Math.round(w / 55)) + 's');
}

const barsEl = $('#bars');
function renderChart() {
  const P = M.hadData ? M.pools.slice(0, 10) : [];
  if (!P.length) {
    if (!barsEl.children.length) barsEl.innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="bar-c"><span class="sk" style="height:${30 + ((i * 37) % 60)}%;width:100%;max-width:none;float:none;border-radius:4px 4px 0 0"></span></span>`).join('');
    if (M.failed) { barsEl.innerHTML = ''; $('#readout').textContent = DASH + ' no data from the source'; $('#chartTotal').textContent = DASH; }
    return;
  }
  const max = Math.max(...P.map((p) => p.vol || 0), 1);
  if (!barsEl.dataset.built) {
    barsEl.dataset.built = '1'; barsEl.innerHTML = '';
    P.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bar-c'; b.setAttribute('role', 'listitem'); b.style.setProperty('--d', i);
      b.innerHTML = '<span class="bar-fill"></span><span class="bar-lab"></span>';
      const show = () => { $$('.bar-c', barsEl).forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); const q = b._p; $('#readout').textContent = `${q.sym}  ${fmtCompact(q.vol)} volume · ${fmtCompact(q.liq)} liquidity · ${fmtPct(q.chg)}`; };
      b.addEventListener('pointerenter', show); b.addEventListener('focus', show); b.addEventListener('click', show);
      barsEl.appendChild(b);
    });
  }
  P.forEach((p, i) => {
    const b = barsEl.children[i]; if (!b) return;
    b._p = p;
    b.style.setProperty('--h', Math.max(0.03, (p.vol || 0) / max).toFixed(3));
    $('.bar-lab', b).textContent = p.sym.slice(0, 5);
    b.setAttribute('aria-label', `${p.sym}: ${fmtCompact(p.vol)} volume`);
  });
  barsEl.classList.add('in');
  $('#ymax').textContent = fmtCompact(max); $('#ymid').textContent = fmtCompact(max / 2);
  $('#chartTotal').textContent = fmtCompact(P.reduce((s, p) => s + (p.vol || 0), 0));
}

/* ---------- status ---------- */
function setStatus(s) {
  const st = $('#status'), bd = $('#boardBadge'), t = $('#statusText');
  st.dataset.s = s; bd.dataset.s = s;
  const label = { live: 'Live', retry: 'Retrying', down: 'Source down' }[s];
  t.textContent = label;
  bd.innerHTML = `<i class="dot"></i>${label}`;
}
function setNote() {
  const n = $('#boardNote');
  if (M.failed && M.hadData) { n.hidden = false; n.textContent = 'The market source is not answering. Showing the last good figures while retrying.'; }
  else if (M.failed) { n.hidden = false; n.textContent = 'The market source is not answering. Figures show a dash until it returns.'; }
  else n.hidden = true;
}

/* ---------- polling: backoff, visibility pause, immediate refetch on visible ---------- */
const pollers = [];
function makePoller(run, onOk, onFail, base = 60000) {
  const p = { fails: 0, timer: 0, ctrl: null, base };
  p.tick = async () => {
    clearTimeout(p.timer);
    if (document.hidden) return;
    p.ctrl?.abort(); p.ctrl = new AbortController();
    try { await run(p.ctrl.signal); p.fails = 0; onOk(); }
    catch (e) { if (e && e.name === 'AbortError') return; p.fails++; onFail(e, p.fails); }
    p.schedule();
  };
  p.schedule = () => {
    clearTimeout(p.timer);
    if (document.hidden) return;
    const jitter = Math.random() * 400;
    const delay = p.fails ? Math.min(p.base, 2000 * 2 ** (p.fails - 1)) + jitter : p.base;
    p.timer = setTimeout(p.tick, delay);
  };
  p.stop = () => { clearTimeout(p.timer); p.ctrl?.abort(); };
  pollers.push(p);
  return p;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pollers.forEach((p) => p.stop());
  else pollers.forEach((p) => p.tick());
});
async function getJSON(url, signal) {
  const r = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

function startMarket() {
  if (REG.market.state !== 'stated') { M.failed = true; setStatus('down'); renderAll(); return; }
  const url = REG.market.url + (REG.market.include ? '?include=' + REG.market.include : '');
  makePoller(
    async (signal) => {
      const j = await getJSON(url, signal);
      const pools = parseGecko(j);
      if (!pools.length) throw new Error('empty');
      M.pools = pools; M.hadData = true; M.failed = false;
    },
    () => { setStatus('live'); renderAll(); },
    (e, n) => { M.failed = true; setStatus(n >= 3 ? 'down' : 'retry'); renderAll(); }
  ).tick();
}

/* own token: DexScreener, pairs[0] after sorting by volume.h24 desc. Runs only when the gate is open. */
function startOwn() {
  if (!ownOn) return;
  makePoller(
    async (signal) => {
      const j = await getJSON(REG.ownPair.url + encodeURIComponent(gate.value), signal);
      const pairs = (j.pairs || []).slice().sort((a, b) => (num(b.volume?.h24) ?? -1) - (num(a.volume?.h24) ?? -1));
      const p = pairs[0];
      if (!p) throw new Error('no pairs');
      const tok = (p.baseToken?.address || '').toLowerCase() === gate.value.toLowerCase() ? p.baseToken : (p.quoteToken || p.baseToken);
      M.own = {
        key: 'own', addr: gate.value.toLowerCase(), sym: tok?.symbol || 'ELYPROOF', name: tok?.name || '',
        price: num(p.priceUsd), chg: num(p.priceChange?.h24), vol: num(p.volume?.h24), liq: num(p.liquidity?.usd),
      };
      M.ownFailed = false;
    },
    () => renderAll(),
    () => { M.ownFailed = true; renderAll(); }
  ).tick();
}

function renderAll() {
  renderBoard(); renderStats(); renderTicker(); renderChart(); setNote();
}

/* ---------- interactions ---------- */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('.cp');
  if (!b) return;
  const text = b.dataset.addr || b.dataset.copy;
  if (!text) return;
  const ok = await copyText(text);
  if (ok) { flashBtn(b); toast('Copied'); } else toast('Copy failed');
});
$$('.tab').forEach((t) => t.addEventListener('click', () => {
  $$('.tab').forEach((x) => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
  M.sort = t.dataset.sort; renderBoard();
}));
$('#walletBtn').addEventListener('click', addNetwork);

/* spotlight: pointer position feeds CSS vars on cards, tiles and rows */
document.addEventListener('pointermove', (e) => {
  const t = e.target.closest?.('.spot, .spotr');
  if (!t) return;
  const r = t.getBoundingClientRect();
  t.style.setProperty('--mx', e.clientX - r.left + 'px'); t.style.setProperty('--my', e.clientY - r.top + 'px');
}, { passive: true });

/* scroll progress, parallax, scroll spy */
const prog = $('#progress');
const layers = $$('[data-depth]');
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    if (!reduced() && scrollY < innerHeight * 1.5) {
      layers.forEach((l) => { const d = parseFloat(l.dataset.depth); l.style.translate = `${px * d * 60}px ${scrollY * d + py * d * 40}px`; });
    }
  });
}
let px = 0, py = 0;
addEventListener('pointermove', (e) => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; if (!reduced() && scrollY < innerHeight) onScroll(); }, { passive: true });
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
$$('.rv').forEach((el) => io.observe(el));

const spy = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) $$('.nav a, .nav-m a').forEach((a) => a.classList.toggle('on', a.dataset.s === en.target.id));
}), { rootMargin: '-35% 0px -60% 0px' });
['top', 'board', 'chain', 'vision'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

/* ---------- boot ---------- */
renderSocials(); renderCA(); renderChain();
renderOwn(); renderBoard(); renderStats(); renderChart(); renderTicker();
setStatus('retry'); $('#statusText').textContent = 'Connecting';
onScroll();
startMarket();
startOwn();
