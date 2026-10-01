'use strict';

// ===========================================================================
// Small helpers
// ===========================================================================
const $ = (sel, el = document) => el.querySelector(sel);

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    // set via the CSSOM: the page CSP blocks inline style *attributes* (setAttribute('style', …))
    else if (k === 'style' && typeof v === 'string') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v; // only used with static icon markup
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function fmtSize(n) {
  if (n == null) return '—';
  if (n < 1024) return n + ' B';
  const u = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  const d = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return n.toLocaleString(LANG, { minimumFractionDigits: d, maximumFractionDigits: d }) + ' ' + u[i];
}

function fmtDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const opts = d.getFullYear() === now.getFullYear()
    ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleString(LANG, opts);
}

const enc = encodeURIComponent;
const joinPath = (a, b) => (a ? a + '/' + b : b);
const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

const PREVIEW = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'ico'],
  video: ['mp4', 'webm', 'm4v', 'mov', 'ogv'],
  audio: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac', 'opus'],
  pdf: ['pdf'],
  doc: ['docx'],
  sheet: ['xlsx', 'xlsm', 'xlsb', 'xls', 'ods'],
  text: ['txt', 'log', 'md', 'csv', 'tsv', 'json', 'xml', 'yml', 'yaml', 'ini', 'conf', 'cfg', 'sh', 'bat',
    'ps1', 'js', 'ts', 'py', 'rb', 'php', 'java', 'c', 'h', 'cpp', 'cs', 'go', 'rs', 'sql', 'html', 'htm',
    'css', 'svg', 'env', 'toml', 'properties', 'gitignore', 'srt', 'vtt'],
};
function previewKind(name) {
  const e = extOf(name);
  for (const [k, list] of Object.entries(PREVIEW)) if (list.includes(e)) return k;
  return null;
}
// Word/Excel are converted on the server from the file's own path, so they can't be previewed from inside a zip
const isOffice = (kind) => kind === 'doc' || kind === 'sheet';

// ---------- icons ----------
const ICONS = {
  folder: '<svg viewBox="0 0 32 32"><path d="M3 8a3 3 0 0 1 3-3h6.2a3 3 0 0 1 2.2 1l1.6 1.8H26a3 3 0 0 1 3 3V12H3z" fill="#dd8f27"/><path d="M3 11.5A2.5 2.5 0 0 1 5.5 9h21a2.5 2.5 0 0 1 2.5 2.5V24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="#f7b844"/><path d="M3 11.5A2.5 2.5 0 0 1 5.5 9h21a2.5 2.5 0 0 1 2.5 2.5V13H3z" fill="#fff" fill-opacity=".22"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  logo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  sort: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>',
};

// File-type page icons (colored extension badge) come from filetypes.js, which the public share page also uses.
const iconMarkup = (entry) => (entry.isDir || entry.dir ? ICONS.folder : FileTypes.icon(extOf(entry.name)));
const fileIcon = (entry, extra) => h('span', { class: 'ficon' + (extra ? ' ' + extra : ''), html: iconMarkup(entry) });

// ---------- api ----------
async function api(url, opts = {}) {
  const o = { credentials: 'same-origin', ...opts, headers: { 'X-Requested-With': 'BackupServer', ...(opts.headers || {}) } };
  if (opts.json !== undefined) {
    o.body = JSON.stringify(opts.json);
    o.headers['Content-Type'] = 'application/json';
    o.method = opts.method || 'POST';
    delete o.json;
  }
  const r = await fetch(url, o);
  let data = null;
  if ((r.headers.get('content-type') || '').includes('json')) data = await r.json().catch(() => null);
  if (r.status === 401 && !url.startsWith('/api/login')) {
    state.user = null;
    render();
    throw new Error(t('Your session has expired. Please log in again.'));
  }
  if (!r.ok) throw new Error(data && data.error ? tErr(data.error) : t('Request failed ({n})', { n: r.status }));
  return data;
}

// ---------- toasts ----------
function toast(msg, type) {
  const el = h('div', { class: 'toast' + (type === 'error' ? ' error' : '') }, msg);
  $('#toasts').append(el);
  setTimeout(() => el.remove(), type === 'error' ? 6000 : 3000);
}
const fail = (e) => toast(e.message || String(e), 'error');

// ---------- language ----------
// Chosen language is remembered in this browser (so the login page matches) and, once logged in,
// per user on the server (so it follows them to other browsers/devices).
async function setLang(lang) {
  if (lang === LANG) return;
  setLangLocal(lang);
  render();
  if (state.user) api('/api/me/lang', { json: { lang } }).catch(fail);
}
const langSwitch = () => h('div', { class: 'segs lang', role: 'group', 'aria-label': t('Language') },
  Object.keys(LANG_NAMES).map((code) => h('button', {
    class: 'seg' + (LANG === code ? ' on' : ''), title: LANG_NAMES[code], 'aria-pressed': String(LANG === code),
    onclick: () => setLang(code),
  }, code.toUpperCase())));

// ---------- modal / dialogs ----------
function openModal({ title, body, foot, wide, xl, md, flush, icon: iconEntry, onClose }) {
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  // Escape closes only the topmost dialog (e.g. a confirm opened on top of the share dialog)
  const onKey = (e) => { if (e.key === 'Escape' && overlay === [...document.querySelectorAll('.overlay')].pop()) close(); };
  const overlay = h('div', { class: 'overlay', onmousedown: (e) => { if (e.target === overlay) close(); } },
    h('div', { class: 'modal' + (xl ? ' xl' : wide ? ' wide' : md ? ' md' : '') },
      h('div', { class: 'modal-head' }, iconEntry ? fileIcon(iconEntry) : null, h('h3', { title }, title), h('button', { class: 'btn ghost icon', onclick: close, 'aria-label': t('Close') }, '✕')),
      h('div', { class: 'modal-body' + (flush ? ' flush' : '') }, body),
      foot ? h('div', { class: 'modal-foot' }, foot) : null));
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  return { close, overlay };
}

/** Form dialog. Resolves with field values, or null when cancelled. */
function dialog({ title, message, fields = [], okText = t('OK'), danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const inputs = {};
    const form = h('form', {
      onsubmit: (e) => {
        e.preventDefault();
        const vals = {};
        for (const [k, el] of Object.entries(inputs)) vals[k] = el.type === 'checkbox' ? el.checked : el.value;
        done = true;
        m.close();
        resolve(vals);
      },
    },
    message ? h('p', { style: 'margin-top:0' }, message) : null,
    fields.map((f) => {
      if (f.type === 'checkbox') {
        inputs[f.name] = h('input', { type: 'checkbox', checked: !!f.value });
        return h('div', { class: 'field' }, h('label', { class: 'check' }, inputs[f.name], f.label));
      }
      if (f.type === 'select') {
        inputs[f.name] = h('select', {}, f.options.map((o) => h('option', { value: o.value, selected: o.value === f.value }, o.label)));
      } else {
        inputs[f.name] = h('input', {
          type: f.type || 'text', value: f.value ?? '', placeholder: f.placeholder || '',
          required: f.required !== false, min: f.min, step: f.step, autocomplete: 'off',
        });
      }
      return h('div', { class: 'field' }, h('label', {}, f.label), inputs[f.name], f.hint ? h('div', { class: 'muted small', style: 'margin-top:4px' }, f.hint) : null);
    }),
    h('button', { type: 'submit', hidden: true }));
    const m = openModal({
      title,
      body: form,
      foot: [
        h('button', { class: 'btn', onclick: () => m.close() }, t('Cancel')),
        h('button', { class: 'btn ' + (danger ? 'danger solid' : 'primary'), onclick: () => form.requestSubmit() }, okText),
      ],
      onClose: () => { if (!done) resolve(null); },
    });
    const first = form.querySelector('input,select');
    if (first) {
      first.focus();
      if (first.select && first.dataset.selectBase !== undefined) first.select();
    }
  });
}
const confirmDialog = (title, message, okText = t('Delete')) =>
  dialog({ title, message, okText, danger: true }).then((v) => v !== null);

// ---------- dropdown menu ----------
let openMenuEl = null;
function closeMenu() { if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; } }
document.addEventListener('mousedown', (e) => { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu(); });
window.addEventListener('scroll', closeMenu, true);
function showMenu(anchor, items) {
  closeMenu();
  const m = h('div', { class: 'menu' }, items.filter(Boolean).map((it) =>
    it === '-' ? h('hr') : h('button', { class: it.danger ? 'danger' : '', onclick: () => { closeMenu(); it.action(); } }, it.label)));
  document.body.append(m);
  const r = anchor.getBoundingClientRect();
  const mr = m.getBoundingClientRect();
  let top = r.bottom + 4;
  if (top + mr.height > innerHeight - 8) top = Math.max(8, r.top - mr.height - 4);
  m.style.top = top + 'px';
  m.style.left = Math.max(8, Math.min(r.right - mr.width, innerWidth - mr.width - 8)) + 'px';
  openMenuEl = m;
}

// ===========================================================================
// State & routing
// ===========================================================================
const state = { user: null, usage: 0, maxFileBytes: 0, selected: new Set(), listing: null };

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('admin')) return { view: 'admin' };
  if (hash.startsWith('account')) return { view: 'account' };
  const m = hash.match(/^files\/?(.*)$/);
  return { view: 'files', path: m ? decodeURIComponent(m[1]) : '' };
}
const goFiles = (p) => { location.hash = '#/files/' + (p ? enc(p) : ''); };
window.addEventListener('hashchange', () => { state.selected.clear(); render(); });

async function boot() {
  try {
    const me = await fetch('/api/me', { credentials: 'same-origin' });
    if (me.ok) {
      const d = await me.json();
      state.user = d.user;
      if (d.user.lang) setLangLocal(d.user.lang); // the user's saved language wins over this browser's
      state.usage = d.usage;
      state.maxFileBytes = d.maxFileBytes;
    }
  } catch {}
  render();
}

function render() {
  closeMenu();
  const app = $('#app');
  if (!state.user) return app.replaceChildren(loginView());
  if (state.user.mustChangePassword) return app.replaceChildren(header('account'), h('main', {}, accountView(true)));
  const r = route();
  if (r.view === 'admin' && !state.user.isAdmin) { location.hash = '#/files/'; return; }
  const main = h('main');
  app.replaceChildren(header(r.view), main);
  if (r.view === 'admin') adminView(main);
  else if (r.view === 'account') main.append(accountView(false));
  else filesView(main, r.path);
}

function header(active) {
  const u = state.user;
  return h('header', { class: 'top' }, h('div', { class: 'inner' },
    h('a', { class: 'brand', href: '#/files/' }, h('span', { class: 'logo', html: ICONS.logo }), h('span', { class: 'hide-sm' }, 'Backup Storage')),
    u.mustChangePassword ? null : h('nav', { class: 'tabs' },
      h('a', { href: '#/files/', class: active === 'files' ? 'active' : '' }, t('Files')),
      u.isAdmin ? h('a', { href: '#/admin', class: active === 'admin' ? 'active' : '' }, t('Admin')) : null,
      h('a', { href: '#/account', class: active === 'account' ? 'active' : '' }, t('Account'))),
    h('div', { class: 'spacer' }),
    langSwitch(),
    h('span', { class: 'who' }, u.username),
    h('button', {
      class: 'btn small', onclick: async () => {
        await api('/api/logout', { method: 'POST' }).catch(() => {});
        state.user = null;
        location.hash = '';
        render();
      },
    }, t('Log out'))));
}

// ===========================================================================
// Login
// ===========================================================================
function loginView() {
  const err = h('div', { class: 'error-box', hidden: true });
  const user = h('input', { type: 'text', autocomplete: 'username', required: true, autofocus: true });
  const pass = h('input', { type: 'password', autocomplete: 'current-password', required: true });
  const btn = h('button', { class: 'btn primary', type: 'submit', style: 'width:100%;justify-content:center;padding:10px' }, t('Log in'));
  const form = h('form', {
    class: 'card card-pad', onsubmit: async (e) => {
      e.preventDefault();
      btn.disabled = true;
      err.hidden = true;
      try {
        await api('/api/login', { json: { username: user.value.trim(), password: pass.value } });
        await boot();
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
        btn.disabled = false;
        pass.value = '';
        pass.focus();
      }
    },
  },
  err,
  h('div', { class: 'field' }, h('label', {}, t('Username')), user),
  h('div', { class: 'field' }, h('label', {}, t('Password')), pass),
  btn);
  setTimeout(() => user.focus(), 0);
  return h('div', { class: 'center-screen' }, h('div', { class: 'login' },
    h('div', { class: 'brand' }, h('span', { class: 'logo', html: ICONS.logo }), 'Backup Storage'),
    h('p', { class: 'login-sub' }, t('Sign in to your private file storage')),
    form,
    h('div', { class: 'login-lang' }, langSwitch())));
}

// ===========================================================================
// Account
// ===========================================================================
function accountView(forced) {
  const cur = h('input', { type: 'password', autocomplete: 'current-password', required: true });
  const np = h('input', { type: 'password', autocomplete: 'new-password', required: true, minLength: 8 });
  const np2 = h('input', { type: 'password', autocomplete: 'new-password', required: true });
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (np.value.length < 8) return toast(t('New password must be at least 8 characters'), 'error');
      if (np.value !== np2.value) return toast(t("New passwords don't match"), 'error');
      try {
        await api('/api/me/password', { json: { currentPassword: cur.value, newPassword: np.value } });
        toast(t('Password changed'));
        state.user.mustChangePassword = false;
        if (forced) location.hash = '#/files/';
        render();
      } catch (ex) { fail(ex); }
    },
  },
  forced ? h('div', { class: 'notice-box' }, t('Welcome! Please choose a new password before continuing.')) : null,
  h('div', { class: 'field' }, h('label', {}, t('Current password')), cur),
  h('div', { class: 'field' }, h('label', {}, t('New password (min. 8 characters)')), np),
  h('div', { class: 'field' }, h('label', {}, t('Repeat new password')), np2),
  h('button', { class: 'btn primary', type: 'submit' }, t('Change password')));
  return h('div', { class: 'card card-pad', style: 'max-width:440px' }, h('h2', {}, t('Change password')), form);
}

// ===========================================================================
// Files
// ===========================================================================
async function filesView(main, path) {
  main.append(h('div', { class: 'center-screen', style: 'min-height:200px' }, h('div', { class: 'spinner' })));
  let data;
  try {
    data = await api('/api/files?path=' + enc(path));
  } catch (e) {
    main.replaceChildren(h('div', { class: 'card empty' }, h('div', { class: 'big' }, e.message), h('a', { href: '#/files/' }, t('Go to my files'))));
    return;
  }
  state.listing = data;
  state.usage = data.usage;
  drawFiles(main, data);
}

function refresh() { render(); }

function usageBar(used, quota) {
  if (!quota) return h('div', { class: 'usage' }, h('span', {}, t('{size} used · no storage limit', { size: fmtSize(used) })));
  const pct = Math.min(100, (used / quota) * 100);
  return h('div', { class: 'usage' },
    h('div', { class: 'bar' + (pct >= 100 ? ' full' : pct >= 85 ? ' warn' : '') }, h('span', { style: `width:${pct}%` })),
    h('span', {}, t('{used} of {quota} used ({free} free)', { used: fmtSize(used), quota: fmtSize(quota), free: fmtSize(Math.max(0, quota - used)) })));
}

// ---------- view preferences (remembered in this browser) ----------
function loadPref(k, dflt) {
  try { const v = JSON.parse(localStorage.getItem('bks.' + k)); return v ?? dflt; } catch { return dflt; }
}
function savePref(k, v) {
  try { localStorage.setItem('bks.' + k, JSON.stringify(v)); } catch {}
}
const SORT_LABELS = { name: 'Name', size: 'Size', mtime: 'Modified' };
const SORT_DEFAULT_DIR = { name: 'asc', size: 'desc', mtime: 'desc' };
const prefs = { view: loadPref('view', 'list'), sort: loadPref('sort', { key: 'name', dir: 'asc' }) };
if (!['list', 'grid'].includes(prefs.view)) prefs.view = 'list';
if (!prefs.sort || !SORT_LABELS[prefs.sort.key] || !['asc', 'desc'].includes(prefs.sort.dir)) prefs.sort = { key: 'name', dir: 'asc' };

const THUMB_MAX_BYTES = 8 * 1024 * 1024; // don't pull huge photos just to draw a thumbnail
const THUMB_EXT = /\.(png|jpe?g|gif|webp|bmp|avif)$/i;
const thumbUrl = (e, full) =>
  !e.isDir && e.size != null && e.size <= THUMB_MAX_BYTES && THUMB_EXT.test(e.name)
    ? '/api/download?path=' + enc(full) + '&inline=1' : null;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function sortEntries(entries) {
  const { key, dir } = prefs.sort;
  const m = dir === 'asc' ? 1 : -1;
  return [...entries].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1; // folders always first
    let r = 0;
    if (key === 'name') return collator.compare(a.name, b.name) * m;
    if (key === 'size') r = (a.size || 0) - (b.size || 0);
    else r = new Date(a.mtime) - new Date(b.mtime);
    return r * m || collator.compare(a.name, b.name);
  });
}

function drawFiles(main, data) {
  const path = data.path;
  let filter = '';
  const fileInput = h('input', { type: 'file', multiple: true, hidden: true, onchange: () => { uploadFiles([...fileInput.files], path); fileInput.value = ''; } });

  // breadcrumbs
  const parts = path ? path.split('/') : [];
  const crumbs = h('div', { class: 'crumbs' },
    parts.length ? h('a', { href: '#/files/' }, t('My files')) : h('span', { class: 'current' }, t('My files')),
    parts.map((p, i) => [
      h('span', { class: 'sep' }, '/'),
      i === parts.length - 1 ? h('span', { class: 'current' }, p) : h('a', { href: '#/files/' + enc(parts.slice(0, i + 1).join('/')) }, p),
    ]));

  const toolbar = h('div', { class: 'toolbar' },
    h('button', { class: 'btn primary', onclick: () => fileInput.click() }, h('span', { html: ICONS.upload }), t('Upload')),
    h('button', { class: 'btn', onclick: () => newFolder(path) }, h('span', { html: ICONS.plus }), t('New folder')),
    h('button', { class: 'btn icon', title: t('More'), onclick: (e) => showMenu(e.currentTarget, [
      { label: t('Download this folder as .zip'), action: () => download('/api/download-folder?path=' + enc(path)) },
      { label: t('Refresh'), action: refresh },
    ]), html: ICONS.more }));

  // ---- selection bar ----
  const selbar = h('div', { class: 'selbar', hidden: true });
  const updateSel = () => {
    const n = state.selected.size;
    selbar.hidden = n === 0;
    selbar.replaceChildren(
      h('strong', {}, t('{n} selected', { n })), h('div', { class: 'spacer' }),
      h('button', { class: 'btn small', onclick: () => moveItems([...state.selected].map((s) => joinPath(path, s))) }, t('Move')),
      h('button', { class: 'btn small danger', onclick: () => deleteItems([...state.selected].map((s) => joinPath(path, s))) }, t('Delete')),
      h('button', { class: 'btn small ghost', onclick: () => { state.selected.clear(); renderEntries(); } }, t('Clear')));
  };

  // ---- strip: select-all, count, filter, sort, view toggle ----
  const visibleEntries = () => {
    const list = sortEntries(data.entries);
    return filter ? list.filter((e) => e.name.toLowerCase().includes(filter)) : list;
  };
  const syncAll = () => {
    const list = visibleEntries();
    const n = list.filter((e) => state.selected.has(e.name)).length;
    allCb.checked = list.length > 0 && n === list.length;
    allCb.indeterminate = n > 0 && n < list.length;
  };
  const allCb = h('input', {
    type: 'checkbox', 'aria-label': t('Select all'), onchange: () => {
      for (const e of visibleEntries()) allCb.checked ? state.selected.add(e.name) : state.selected.delete(e.name);
      renderEntries();
    },
  });
  const count = h('span', { class: 'count' });
  const search = h('input', {
    type: 'search', class: 'search', placeholder: t('Filter this folder…'), 'aria-label': t('Filter this folder'), autocomplete: 'off',
    oninput: () => {
      filter = search.value.trim().toLowerCase();
      // never act on items that are hidden by the filter
      if (filter) for (const n of [...state.selected]) if (!n.toLowerCase().includes(filter)) state.selected.delete(n);
      renderEntries();
    },
    onkeydown: (e) => { if (e.key === 'Escape' && search.value) { search.value = ''; filter = ''; renderEntries(); } },
  });
  const sortText = h('span', { class: 'hide-sm' });
  const sortBtn = h('button', {
    class: 'btn small', title: t('Sort'), onclick: (ev) => showMenu(ev.currentTarget, Object.keys(SORT_LABELS).map((k) => ({
      label: (prefs.sort.key === k ? (prefs.sort.dir === 'asc' ? '↑  ' : '↓  ') : '     ') + t(SORT_LABELS[k]),
      action: () => setSort(k),
    }))),
  }, h('span', { html: ICONS.sort }), sortText);
  const seg = (mode, svg, label) => h('button', {
    class: 'seg', title: label, 'aria-label': label, html: svg,
    onclick: () => { prefs.view = mode; savePref('view', mode); renderEntries(); },
  });
  const segList = seg('list', ICONS.list, t('List view'));
  const segGrid = seg('grid', ICONS.grid, t('Grid view'));
  const strip = h('div', { class: 'strip' }, allCb, count, h('div', { class: 'spacer' }), search, sortBtn, h('div', { class: 'segs' }, segList, segGrid));

  function setSort(key) {
    prefs.sort = prefs.sort.key === key
      ? { key, dir: prefs.sort.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: SORT_DEFAULT_DIR[key] };
    savePref('sort', prefs.sort);
    renderEntries();
  }

  const checkbox = (e, onChange) => {
    const cb = h('input', { type: 'checkbox', 'aria-label': t('Select {name}', { name: e.name }), checked: state.selected.has(e.name) });
    cb.addEventListener('change', () => {
      cb.checked ? state.selected.add(e.name) : state.selected.delete(e.name);
      onChange(cb.checked);
      updateSel();
      syncAll();
    });
    return cb;
  };

  const actions = (e, full, cls) => h('button', {
    class: 'btn ghost icon ' + cls, title: t('Actions'), 'aria-label': t('Actions for {name}', { name: e.name }), html: ICONS.more,
    onclick: (ev) => { ev.stopPropagation(); entryMenu(ev.currentTarget, e, full); },
  });

  // ---- list (table) view ----
  const tableOf = (list) => {
    const th = (key, label, cls = '') => h('th', {
      class: `${cls} sortable${prefs.sort.key === key ? ' sorted' : ''}`.trim(), onclick: () => setSort(key),
    }, label, prefs.sort.key === key ? h('span', { class: 'arrow' }, prefs.sort.dir === 'asc' ? '↑' : '↓') : null);
    return h('table', { class: 'list' },
      h('thead', {}, h('tr', {}, h('th', { class: 'cb' }), th('name', t('Name')), th('size', t('Size'), 'num'), th('mtime', t('Modified'), 'hide-sm'), h('th', { class: 'act' }))),
      h('tbody', {}, list.map((e) => {
        const full = joinPath(path, e.name);
        const row = h('tr', { class: state.selected.has(e.name) ? 'selected' : '' });
        row.append(
          h('td', { class: 'cb' }, checkbox(e, (on) => row.classList.toggle('selected', on))),
          h('td', {}, h('div', { class: 'name' }, fileIcon(e),
            h('a', { onclick: () => openEntry(e, full), title: e.name }, e.name),
            e.isZip ? h('span', { class: 'tag' }, 'zip') : null,
            e.shares ? h('span', { class: 'tag on', title: t('Shared by link') }, t('shared')) : null)),
          h('td', { class: 'num' }, e.isDir ? '' : fmtSize(e.size)),
          h('td', { class: 'when hide-sm' }, fmtDate(e.mtime)),
          h('td', { class: 'act' }, actions(e, full, '')));
        return row;
      })));
  };

  // ---- grid view (image thumbnails where cheap) ----
  const gridOf = (list) => h('div', { class: 'grid' }, list.map((e) => {
    const full = joinPath(path, e.name);
    const bigIcon = () => fileIcon(e, 'big');
    const thumb = thumbUrl(e, full);
    const tile = h('div', {
      class: 'tile' + (state.selected.has(e.name) ? ' selected' : ''), tabindex: '0', title: e.name,
      onclick: (ev) => { if (!ev.target.closest('.tcb, .tact')) openEntry(e, full); },
      onkeydown: (ev) => { if (ev.key === 'Enter' && ev.target === tile) openEntry(e, full); },
    });
    tile.append(
      h('div', { class: 'tthumb' }, thumb
        ? h('img', { src: thumb, loading: 'lazy', alt: '', onerror: (ev) => ev.target.replaceWith(bigIcon()) })
        : bigIcon()),
      h('span', { class: 'tcb' }, checkbox(e, (on) => tile.classList.toggle('selected', on))),
      actions(e, full, 'tact'),
      h('div', { class: 'tinfo' },
        h('div', { class: 'tname' }, e.name),
        h('div', { class: 'tmeta' }, e.isDir ? t('Folder') : fmtSize(e.size), ' · ', fmtDate(e.mtime), e.shares ? [' · ', t('shared')] : null)));
    return tile;
  }));

  const listBox = h('div', { class: 'card listbox' });
  function renderEntries() {
    const all = data.entries;
    const list = visibleEntries();
    strip.hidden = all.length === 0;
    count.textContent = filter ? t('{shown} of {total} items', { shown: list.length, total: all.length }) : plural(all.length, '{n} item', '{n} items');
    sortText.textContent = t(SORT_LABELS[prefs.sort.key]) + (prefs.sort.dir === 'asc' ? ' ↑' : ' ↓');
    segList.classList.toggle('on', prefs.view === 'list');
    segGrid.classList.toggle('on', prefs.view === 'grid');
    listBox.classList.toggle('is-grid', prefs.view === 'grid' && list.length > 0);
    if (!all.length) {
      listBox.replaceChildren(h('div', { class: 'empty' },
        h('div', { class: 'empty-ico', html: ICONS.folder }),
        h('div', { class: 'big' }, t('This folder is empty')), t('Drag files here or use the Upload button.')));
    } else if (!list.length) {
      listBox.replaceChildren(h('div', { class: 'empty' }, h('div', { class: 'big' }, t('No matches')), t('Nothing in this folder matches “{q}”.', { q: search.value.trim() })));
    } else {
      listBox.replaceChildren(prefs.view === 'grid' ? gridOf(list) : tableOf(list));
    }
    syncAll();
    updateSel();
  }

  // drag & drop
  const dz = h('div', { class: 'dropzone' }, h('div', {}, t('Drop files to upload')));
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  main.ondragenter = (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; dz.classList.add('on'); };
  main.ondragleave = () => { if (--depth <= 0) { depth = 0; dz.classList.remove('on'); } };
  main.ondragover = (e) => { if (hasFiles(e)) e.preventDefault(); };
  main.ondrop = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    dz.classList.remove('on');
    const files = [...e.dataTransfer.files].filter((f) => f.size > 0 || f.type);
    if (files.length) uploadFiles(files, path);
  };

  main.replaceChildren(
    h('div', { class: 'files-head' }, crumbs, toolbar),
    usageBar(data.usage, data.quota),
    selbar, strip, listBox, fileInput, dz);
  main.style.minHeight = 'calc(100vh - 60px)';
  renderEntries();
}

function openEntry(e, full) {
  if (e.isDir) return goFiles(full);
  if (e.isZip) return zipViewer(full, e.name);
  if (e.preview) return previewFile('/api/download?path=' + enc(full), e.name, full);
  download('/api/download?path=' + enc(full));
}

function entryMenu(anchor, e, full) {
  const dl = e.isDir ? '/api/download-folder?path=' + enc(full) : '/api/download?path=' + enc(full);
  showMenu(anchor, [
    e.isDir ? { label: t('Open'), action: () => goFiles(full) } : null,
    e.isZip ? { label: t('View contents'), action: () => zipViewer(full, e.name) } : null,
    e.isZip ? { label: t('Extract here'), action: () => extractZip(full) } : null,
    !e.isDir && e.preview ? { label: t('Preview'), action: () => previewFile('/api/download?path=' + enc(full), e.name, full) } : null,
    { label: e.isDir ? t('Download as .zip') : t('Download'), action: () => download(dl) },
    e.isDir ? null : { label: t('Share…'), action: () => shareDialog(full, e.name) },
    '-',
    { label: t('Rename'), action: () => renameItem(full, e.name) },
    { label: t('Move to…'), action: () => moveItems([full]) },
    '-',
    { label: t('Delete'), danger: true, action: () => deleteItems([full]) },
  ]);
}

function download(url) {
  const a = h('a', { href: url, download: '' });
  document.body.append(a);
  a.click();
  a.remove();
}

// ---------- sharing ----------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  // fallback for pages served over plain http, where the clipboard API is unavailable
  const ta = h('textarea', { style: 'position:fixed;top:0;left:0;opacity:0' });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  ta.remove();
  return ok;
}

/** Manage the public links of one file: list them, create a new one (optionally with a passcode), change passcodes, stop sharing. */
async function shareDialog(full, name) {
  let shares;
  try { ({ shares } = await api('/api/shares?path=' + enc(full))); } catch (e) { return fail(e); }
  let changed = false;

  const list = h('div', { class: 'share-list' });

  const rowOf = (s) => {
    const url = h('input', { type: 'text', readonly: true, value: s.url, 'aria-label': t('Share link'), onfocus: (ev) => ev.target.select() });
    return h('div', { class: 'share-row' },
      h('div', { class: 'share-url' }, url,
        h('button', {
          class: 'btn small', type: 'button',
          onclick: async () => {
            url.select();
            toast((await copyText(s.url)) ? t('Link copied') : t('Press Ctrl+C to copy the link'));
          },
        }, t('Copy'))),
      h('div', { class: 'share-meta' },
        s.hasPasscode
          ? h('span', { class: 'tag on' }, h('span', { class: 'ico', html: ICONS.lock }), t('Passcode'))
          : h('span', { class: 'tag' }, t('No passcode')),
        h('span', { class: 'muted small' }, fmtDate(s.createdAt)),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => editPasscode(s) }, s.hasPasscode ? t('Change passcode') : t('Add passcode')),
        h('button', { class: 'btn small ghost danger', type: 'button', onclick: () => stopSharing(s) }, t('Stop sharing'))));
  };
  function draw() {
    list.replaceChildren(...(shares.length ? shares.map(rowOf) : [h('div', { class: 'muted small' }, t('This file is not shared yet.'))]));
  }

  async function editPasscode(s) {
    const v = await dialog({
      title: s.hasPasscode ? t('Change passcode') : t('Add passcode'),
      message: t('People opening this link will have to enter the passcode first. Leave it empty to remove the passcode.'),
      fields: [{ name: 'passcode', label: t('Passcode'), required: false, hint: t("For security, a saved passcode can't be shown again.") }],
      okText: t('Save'),
    });
    if (!v) return;
    try {
      const r = await api('/api/shares/' + s.id, { method: 'PATCH', json: { passcode: v.passcode.trim() } });
      Object.assign(s, r.share);
      changed = true;
      draw();
      toast(r.share.hasPasscode ? t('Passcode saved') : t('Passcode removed'));
    } catch (ex) { fail(ex); }
  }

  async function stopSharing(s) {
    if (!(await confirmDialog(t('Stop sharing'), t('Anyone with this link will no longer be able to open or download the file.'), t('Stop sharing')))) return;
    try {
      await api('/api/shares/' + s.id, { method: 'DELETE' });
      shares.splice(shares.indexOf(s), 1);
      changed = true;
      draw();
      toast(t('Link removed'));
    } catch (ex) { fail(ex); }
  }

  const pass = h('input', { type: 'text', autocomplete: 'off', maxlength: '72', placeholder: t('Passcode (optional)'), 'aria-label': t('Passcode (optional)') });
  const form = h('form', {
    class: 'share-new',
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        const r = await api('/api/shares', { json: { path: full, passcode: pass.value.trim() } });
        shares.push(r.share);
        pass.value = '';
        changed = true;
        draw();
        toast((await copyText(r.share.url)) ? t('Link created and copied') : t('Link created'));
      } catch (ex) { fail(ex); }
    },
  },
  h('label', {}, t('Create a new link')),
  h('div', { class: 'share-new-row' }, pass, h('button', { class: 'btn primary', type: 'submit' }, t('Create link'))),
  h('div', { class: 'muted small', style: 'margin-top:6px' }, t('Add a passcode if people should have to enter it before they can download. Min. 4 characters.')));

  draw();
  const m = openModal({
    title: t('Share "{name}"', { name }), md: true, icon: { name },
    body: h('div', {},
      h('p', { class: 'muted', style: 'margin-top:0' }, t('Anyone with a link can download this file. Every link you create is unique, and you can switch it off at any time.')),
      list, form),
    foot: [h('button', { class: 'btn', onclick: () => m.close() }, t('Close'))],
    onClose: () => { if (changed) refresh(); }, // update the "shared" tags in the list behind
  });
}

async function newFolder(path) {
  const v = await dialog({ title: t('New folder'), fields: [{ name: 'name', label: t('Folder name'), placeholder: t('e.g. Photos 2026') }], okText: t('Create') });
  if (!v) return;
  try {
    await api('/api/folder', { json: { path, name: v.name } });
    refresh();
  } catch (e) { fail(e); }
}

async function renameItem(full, name) {
  const v = await dialog({ title: t('Rename'), fields: [{ name: 'newName', label: t('New name'), value: name }], okText: t('Rename') });
  if (!v || v.newName === name) return;
  try {
    await api('/api/rename', { json: { path: full, newName: v.newName } });
    refresh();
  } catch (e) { fail(e); }
}

async function deleteItems(paths) {
  const label = paths.length === 1 ? `"${paths[0].split('/').pop()}"` : plural(paths.length, '{n} item', '{n} items');
  if (!(await confirmDialog(t('Delete'), t('Permanently delete {label}? Folders are deleted with everything inside. This cannot be undone.', { label })))) return;
  try {
    await api('/api/delete', { json: { paths } });
    state.selected.clear();
    toast(t('Deleted'));
    refresh();
  } catch (e) { fail(e); }
}

async function moveItems(paths) {
  let folders;
  try { ({ folders } = await api('/api/folders')); } catch (e) { return fail(e); }
  // don't offer moving a folder into itself
  folders = folders.filter((f) => !paths.some((p) => f === p || f.startsWith(p + '/')));
  const v = await dialog({
    title: paths.length === 1 ? t('Move "{name}"', { name: paths[0].split('/').pop() }) : t('Move {n} items', { n: paths.length }),
    fields: [{ name: 'dest', label: t('Destination folder'), type: 'select', value: '', options: folders.map((f) => ({ value: f, label: f ? '/ ' + f.split('/').join(' / ') : t('/ (My files)') })) }],
    okText: t('Move'),
  });
  if (!v) return;
  try {
    await api('/api/move', { json: { paths, dest: v.dest } });
    state.selected.clear();
    toast(t('Moved'));
    refresh();
  } catch (e) { fail(e); }
}

const parentOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

/** Extract ONE file from a zip. `choose` = ask for a destination folder, otherwise put it next to the zip. */
async function extractZipEntry(zipFull, entry, choose) {
  let dest = parentOf(zipFull);
  if (choose) {
    let folders;
    try { ({ folders } = await api('/api/folders')); } catch (e) { return fail(e); }
    const v = await dialog({
      title: t('Extract file'), message: entry.label,
      fields: [{ name: 'dest', label: t('Destination folder'), type: 'select', value: dest,
        options: folders.map((f) => ({ value: f, label: f ? '/ ' + f.split('/').join(' / ') : t('/ (My files)') })) }],
      okText: t('Extract'),
    });
    if (!v) return;
    dest = v.dest;
  }
  const note = h('div', { class: 'toast' }, t('Extracting…'));
  $('#toasts').append(note);
  try {
    const r = await api('/api/zip/extract-entry', { json: { path: zipFull, entry: entry.name, dest } });
    state.usage = r.usage;
    toast(t('Extracted "{name}"', { name: r.name }));
    refresh(); // update the file list behind the open zip viewer
  } catch (e) { fail(e); } finally { note.remove(); }
}

async function extractZip(full) {
  const note = h('div', { class: 'toast' }, t('Extracting…'));
  $('#toasts').append(note);
  try {
    const r = await api('/api/zip/extract', { json: { path: full } });
    toast(t('Extracted to "{name}"', { name: r.folder.split('/').pop() }));
    refresh();
  } catch (e) { fail(e); } finally { note.remove(); }
}

// ---------- uploads ----------
let uploadPanel = null;
function getUploadPanel() {
  if (uploadPanel && document.body.contains(uploadPanel.el)) return uploadPanel;
  const list = h('div', { class: 'uploads-list' });
  const title = h('span', {}, t('Uploads'));
  const closeBtn = h('button', { class: 'btn ghost icon small', onclick: () => { el.remove(); uploadPanel = null; } }, '✕');
  const el = h('div', { class: 'uploads' }, h('div', { class: 'uploads-head' }, title, h('div', { class: 'spacer' }), closeBtn), list);
  document.body.append(el);
  uploadPanel = { el, list, title, closeBtn, active: 0 };
  return uploadPanel;
}

const uploadingLabel = (n) => plural(n, 'Uploading {n} file', 'Uploading {n} files');
let uploadQueue = Promise.resolve();
function uploadFiles(files, path) {
  if (!files.length) return;
  const quota = state.listing?.quota || 0;
  const total = files.reduce((a, f) => a + f.size, 0);
  if (quota && total > quota - state.usage)
    return toast(t('Not enough space: {total} selected, {free} free.', { total: fmtSize(total), free: fmtSize(Math.max(0, quota - state.usage)) }), 'error');
  const tooBig = files.find((f) => state.maxFileBytes && f.size > state.maxFileBytes);
  if (tooBig) return toast(t('"{name}" is larger than the {size} per-file limit.', { name: tooBig.name, size: fmtSize(state.maxFileBytes) }), 'error');

  const panel = getUploadPanel();
  for (const f of files) {
    const st = h('span', { class: 'st' }, t('Waiting'));
    const bar = h('span', { style: 'width:0%' });
    const item = h('div', { class: 'up' }, h('div', { class: 'row' }, h('span', { class: 'fname', title: f.name }, f.name), st), h('div', { class: 'bar' }, bar));
    panel.list.append(item);
    panel.active++;
    panel.title.textContent = uploadingLabel(panel.active);
    uploadQueue = uploadQueue.then(async () => {
      st.textContent = '0%';
      try {
        const r = await uploadOne(f, path, (p) => {
          bar.style.width = (p * 100).toFixed(1) + '%';
          st.textContent = p >= 1 ? t('Saving…') : t('{pct}% of {size}', { pct: Math.floor(p * 100), size: fmtSize(f.size) });
        });
        state.usage = r.usage;
        item.classList.add('done');
        st.textContent = t('Done');
        bar.style.width = '100%';
      } catch (e) {
        item.classList.add('err');
        st.textContent = e.message;
        st.title = e.message;
      }
      panel.active--;
      panel.title.textContent = panel.active ? uploadingLabel(panel.active) : t('Uploads finished');
      if (!panel.active && route().view === 'files' && route().path === path) refresh();
    });
  }
}

function uploadOne(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('files', file, file.name);
    const x = new XMLHttpRequest();
    x.open('POST', '/api/upload?path=' + enc(path));
    x.setRequestHeader('X-Requested-With', 'BackupServer');
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => {
      let d = {};
      try { d = JSON.parse(x.responseText); } catch {}
      if (x.status === 401) { state.user = null; render(); }
      x.status >= 200 && x.status < 300 ? resolve(d) : reject(new Error(d.error ? tErr(d.error) : t('Upload failed ({n})', { n: x.status })));
    };
    x.onerror = () => reject(new Error(t('Upload failed (connection lost or rejected)')));
    x.send(fd);
  });
}

// ---------- preview ----------
const downloadBtn = (url) => h('button', { class: 'btn', onclick: () => download(url) }, t('Download'));
// (the modal footer already offers the Download button)
const officeError = (msg) => h('div', { class: 'empty' }, h('div', { class: 'big' }, t("Can't preview this file")), msg);
const spinnerBox = () => h('div', { class: 'center-screen', style: 'min-height:280px' }, h('div', { class: 'spinner' }));

/**
 * @param url      download URL of the file (also used for zip entries)
 * @param name     file name
 * @param fullPath the file's own path in the user's storage; required for Word/Excel
 *                 previews (they are converted server-side), absent for zip entries
 */
async function previewFile(url, name, fullPath) {
  const kind = previewKind(name);
  const inlineUrl = url + '&inline=1';

  if (isOffice(kind)) {
    if (!fullPath) return download(url);
    return kind === 'doc' ? previewDocx(fullPath, name, url) : previewSheet(fullPath, name, url);
  }

  const foot = [downloadBtn(url)];
  let content;
  let big = false;
  if (kind === 'pdf') {
    big = true;
    content = h('iframe', { class: 'doc-frame', src: inlineUrl, title: name });
    foot.unshift(h('button', { class: 'btn', onclick: () => window.open(inlineUrl, '_blank', 'noopener') }, t('Open in new tab')));
  } else if (kind === 'image') content = h('img', { src: inlineUrl, alt: name });
  else if (kind === 'video') content = h('video', { src: inlineUrl, controls: true, autoplay: true });
  else if (kind === 'audio') content = h('audio', { src: inlineUrl, controls: true, autoplay: true });
  else if (kind === 'text') {
    content = h('pre', { class: 'text' }, t('Loading…'));
    loadText(inlineUrl, content);
  } else return download(url);

  openModal({
    title: name, icon: { name }, wide: !big, xl: big, flush: true,
    body: h('div', { class: 'preview-body' + (big ? ' fill' : '') }, content),
    foot,
  });
}

// Word: converted to sanitized HTML on the server, shown in a script-less sandboxed iframe
async function previewDocx(full, name, dlUrl) {
  const body = h('div', { class: 'preview-body fill' }, spinnerBox());
  openModal({ title: name, icon: { name }, xl: true, flush: true, body, foot: [downloadBtn(dlUrl)] });
  const src = '/api/preview/doc?path=' + enc(full) + '&lang=' + LANG;
  try {
    await api(src + '&check=1'); // surfaces a readable error instead of raw JSON inside the frame
  } catch (e) {
    return body.replaceChildren(officeError(e.message));
  }
  body.replaceChildren(h('iframe', {
    class: 'doc-frame', src, title: name,
    sandbox: 'allow-popups allow-popups-to-escape-sandbox',
  }));
}

// Excel / ODS: first rows of each sheet rendered as a table with sheet tabs
const colName = (i) => {
  let s = '';
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};
const looksNumeric = (s) => /^[\s(\-−]*[$€£¥]?\s*\d[\d.,\s]*%?\)?\s*$/.test(s);

async function previewSheet(full, name, dlUrl) {
  const body = h('div', { class: 'office-wrap' }, spinnerBox());
  openModal({ title: name, icon: { name }, xl: true, flush: true, body, foot: [downloadBtn(dlUrl)] });
  let data;
  try {
    data = await api('/api/preview/sheet?path=' + enc(full));
  } catch (e) {
    return body.replaceChildren(officeError(e.message));
  }
  if (!data.sheets.length) return body.replaceChildren(h('div', { class: 'empty' }, t('This workbook is empty')));

  const view = h('div', { class: 'sheet-scroll' });
  const note = h('div', { class: 'sheet-note' });
  const tabs = h('div', { class: 'sheet-tabs' }, data.sheets.map((s, i) =>
    h('button', { class: 'sheet-tab', onclick: () => show(i), title: s.name }, s.name)));

  function show(i) {
    const s = data.sheets[i];
    [...tabs.children].forEach((t, j) => t.classList.toggle('on', j === i));
    const cols = s.rows.reduce((m, r) => Math.max(m, r.length), 0);
    if (!s.rows.length) {
      view.replaceChildren(h('div', { class: 'empty' }, t('This sheet is empty')));
    } else {
      view.replaceChildren(h('table', { class: 'sheet' },
        h('thead', {}, h('tr', {}, h('th', { class: 'rn' }), Array.from({ length: cols }, (_, c) => h('th', { class: 'colh' }, colName(c))))),
        h('tbody', {}, s.rows.map((r, ri) => h('tr', {},
          h('th', { class: 'rn' }, ri + 1),
          r.map((v) => h('td', { class: looksNumeric(v) ? 'n' : '', title: v.length > 40 ? v : null }, v)))))));
    }
    const parts = [];
    parts.push(s.truncatedRows
      ? t('First {shown} of {total} rows', { shown: s.rows.length.toLocaleString(LANG), total: s.totalRows.toLocaleString(LANG) })
      : plural(s.rows.length, '{n} row', '{n} rows'));
    parts.push(s.truncatedCols
      ? t('{shown} of {total} columns', { shown: cols.toLocaleString(LANG), total: s.totalCols.toLocaleString(LANG) })
      : plural(cols, '{n} column', '{n} columns'));
    note.textContent = parts.join(' · ') + (s.truncatedRows || s.truncatedCols ? ' — ' + t('download for the full sheet') : '');
    view.scrollTop = 0;
    view.scrollLeft = 0;
  }

  body.replaceChildren(view, h('div', { class: 'sheet-foot' }, tabs, note));
  show(0);
}

async function loadText(url, pre) {
  const LIMIT = 1024 * 1024;
  try {
    const r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || t('Could not load file'));
    const reader = r.body.getReader();
    const chunks = [];
    let got = 0;
    while (got < LIMIT) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
    }
    const truncated = got >= LIMIT;
    if (truncated) reader.cancel();
    const buf = new Uint8Array(Math.min(got, LIMIT));
    let off = 0;
    for (const c of chunks) {
      const part = c.subarray(0, Math.min(c.length, buf.length - off));
      buf.set(part, off);
      off += part.length;
      if (off >= buf.length) break;
    }
    pre.textContent = new TextDecoder().decode(buf) + (truncated ? '\n\n' + t('… (preview limited to the first 1 MB — download to see everything)') : '');
  } catch (e) {
    pre.textContent = e.message;
  }
}

// ---------- zip viewer ----------
async function zipViewer(full, name) {
  const body = h('div', {}, h('div', { class: 'center-screen', style: 'min-height:200px' }, h('div', { class: 'spinner' })));
  const m = openModal({
    title: name, wide: true, flush: true, body,
    foot: [
      h('button', { class: 'btn', onclick: () => download('/api/download?path=' + enc(full)) }, t('Download zip')),
      h('button', { class: 'btn primary', onclick: () => { m.close(); extractZip(full); } }, t('Extract here')),
    ],
  });
  let data;
  try {
    data = await api('/api/zip/list?path=' + enc(full));
  } catch (e) {
    body.replaceChildren(h('div', { class: 'empty' }, h('div', { class: 'big' }, t("Couldn't open this zip")), e.message));
    return;
  }

  const files = data.entries.filter((e) => !e.dir);
  const totalSize = files.reduce((a, e) => a + e.size, 0);
  const totalC = files.reduce((a, e) => a + e.csize, 0);
  const encCount = files.filter((e) => e.encrypted).length;
  const meta = h('div', { class: 'zip-meta' },
    h('span', {}, h('b', {}, files.length.toLocaleString(LANG)), ' ', t('files')),
    h('span', {}, h('b', {}, fmtSize(totalSize)), ' ', t('uncompressed')),
    h('span', {}, h('b', {}, fmtSize(totalC)), ' ', t('compressed'), totalSize ? ' ' + t('({pct}% saved)', { pct: Math.round((1 - totalC / totalSize) * 100) }) : ''),
    encCount ? h('span', { style: 'color:var(--warn)' }, t('{n} password-protected', { n: encCount })) : null,
    data.truncated ? h('span', { style: 'color:var(--warn)' }, t('Showing first {shown} of {total} entries', { shown: data.entries.length.toLocaleString(LANG), total: data.total.toLocaleString(LANG) })) : null);

  const crumbs = h('div', { class: 'zip-crumbs' });
  const listWrap = h('div', { style: 'max-height:60vh;overflow:auto' });
  body.replaceChildren(meta, crumbs, listWrap);

  // Build children of a prefix (handles zips that don't list folder entries)
  function children(prefix) {
    const dirs = new Map();
    const out = [];
    for (const e of data.entries) {
      if (!e.name.startsWith(prefix)) continue;
      const rest = e.name.slice(prefix.length);
      if (!rest) continue;
      const i = rest.indexOf('/');
      if (i === -1) out.push({ ...e, label: rest });
      else {
        const d = rest.slice(0, i);
        const cur = dirs.get(d) || { name: prefix + d + '/', label: d, dir: true, size: 0, count: 0, mtime: e.mtime };
        if (!e.dir) { cur.size += e.size; cur.count++; }
        dirs.set(d, cur);
      }
    }
    const coll = (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
    return [...[...dirs.values()].sort(coll), ...out.sort(coll)];
  }

  function show(prefix) {
    const parts = prefix ? prefix.slice(0, -1).split('/') : [];
    // (replaceChildren() does not flatten nested arrays like h() does, so flatten explicitly)
    crumbs.replaceChildren(
      parts.length ? h('a', { onclick: () => show('') }, name) : h('strong', {}, name),
      ...parts.flatMap((p, i) => [h('span', { class: 'muted' }, ' / '),
        i === parts.length - 1 ? h('strong', {}, p) : h('a', { onclick: () => show(parts.slice(0, i + 1).join('/') + '/') }, p)]));
    const items = children(prefix);
    if (!items.length) return listWrap.replaceChildren(h('div', { class: 'empty' }, t('Empty')));
    listWrap.replaceChildren(h('table', { class: 'list' },
      h('thead', {}, h('tr', {}, h('th', {}, t('Name')), h('th', { class: 'num' }, t('Size')), h('th', { class: 'hide-sm' }, t('Modified')), h('th', { class: 'act' }))),
      h('tbody', {}, items.map((it) => {
        const entryUrl = '/api/zip/entry?path=' + enc(full) + '&entry=' + enc(it.name);
        // Word/Excel previews are converted from a stored file's path, so inside a zip they just download
        const kind = previewKind(it.label);
        const zkind = isOffice(kind) ? null : kind;
        const open = it.dir ? () => show(it.name)
          : it.encrypted ? () => toast(t('This file is password-protected inside the zip'), 'error')
          : zkind ? () => previewFile(entryUrl, it.label) : () => download(entryUrl);
        return h('tr', {},
          h('td', {}, h('div', { class: 'name' }, fileIcon({ name: it.label, dir: it.dir }),
            h('a', { onclick: open, title: it.name }, it.label),
            it.dir ? h('span', { class: 'tag' }, plural(it.count, '{n} file', '{n} files')) : null,
            it.encrypted ? h('span', { class: 'tag off' }, t('locked')) : null)),
          h('td', { class: 'num' }, fmtSize(it.size)),
          h('td', { class: 'when hide-sm' }, it.dir ? '' : fmtDate(it.mtime)),
          h('td', { class: 'act' }, it.dir || it.encrypted ? null : h('button', {
            class: 'btn ghost icon', html: ICONS.more, onclick: (ev) => showMenu(ev.currentTarget, [
              zkind ? { label: t('Preview'), action: () => previewFile(entryUrl, it.label) } : null,
              { label: t('Download this file'), action: () => download(entryUrl) },
              '-',
              { label: t('Extract this file here'), action: () => extractZipEntry(full, it, false) },
              { label: t('Extract this file to…'), action: () => extractZipEntry(full, it, true) },
            ]),
          })));
      }))));
    listWrap.scrollTop = 0;
  }
  show('');
}

// ===========================================================================
// Admin
// ===========================================================================
async function adminView(main) {
  main.append(h('div', { class: 'center-screen', style: 'min-height:200px' }, h('div', { class: 'spinner' })));
  let data;
  try { data = await api('/api/admin/users'); } catch (e) { main.replaceChildren(h('div', { class: 'card empty' }, e.message)); return; }

  const totalUsed = data.users.reduce((a, u) => a + u.usage, 0);
  const stats = h('div', { class: 'stats' },
    data.disk ? h('div', { class: 'card stat' }, h('div', { class: 'k' }, t('Server disk')),
      h('div', { class: 'v' }, t('{size} free', { size: fmtSize(data.disk.free) })),
      h('div', { class: 's' }, t('of {size}', { size: fmtSize(data.disk.total) }))) : null,
    h('div', { class: 'card stat' }, h('div', { class: 'k' }, t('Stored by users')), h('div', { class: 'v' }, fmtSize(totalUsed)), h('div', { class: 's' }, plural(data.users.length, '{n} user', '{n} users'))),
    h('div', { class: 'card stat' }, h('div', { class: 'k' }, t('Quota allocated')), h('div', { class: 'v' }, fmtSize(data.allocated)),
      h('div', { class: 's', style: data.disk && data.allocated > data.disk.free + totalUsed ? 'color:var(--warn)' : '' },
        data.disk && data.allocated > data.disk.free + totalUsed ? t('More than the disk can hold') : t('Users with no limit not counted'))),
    h('div', { class: 'card stat' }, h('div', { class: 'k' }, t('Max upload per file')), h('div', { class: 'v' }, fmtSize(data.maxFileBytes)), h('div', { class: 's' }, t('Set MAX_FILE_SIZE_MB to change'))));

  // create user
  const f = {
    username: h('input', { type: 'text', required: true, placeholder: t('e.g. carolina'), autocomplete: 'off' }),
    password: h('input', { type: 'text', required: true, minLength: 8, placeholder: t('min. 8 characters'), autocomplete: 'off' }),
    quota: h('input', { type: 'number', min: 0, step: 'any', value: '50' }),
    admin: h('input', { type: 'checkbox' }),
  };
  const createForm = h('form', {
    class: 'grid-form', onsubmit: async (e) => {
      e.preventDefault();
      try {
        await api('/api/admin/users', { json: { username: f.username.value.trim(), password: f.password.value, quotaGB: f.quota.value || 0, isAdmin: f.admin.checked } });
        toast(t('User "{name}" created', { name: f.username.value.trim() }));
        render();
      } catch (ex) { fail(ex); }
    },
  },
  h('div', { class: 'field' }, h('label', {}, t('Username')), f.username),
  h('div', { class: 'field' }, h('label', {}, t('Password')), f.password),
  h('div', { class: 'field' }, h('label', {}, t('Storage limit (GB, 0 = none)')), f.quota),
  h('div', { class: 'field', style: 'padding-bottom:9px' }, h('label', { class: 'check' }, f.admin, t('Admin'))),
  h('button', { class: 'btn primary', type: 'submit' }, t('Add user')));

  const rows = data.users.map((u) => {
    const self = u.id === state.user.id;
    const pct = u.quotaBytes ? Math.min(100, (u.usage / u.quotaBytes) * 100) : 0;
    return h('tr', {},
      h('td', {}, h('div', { class: 'name' }, h('span', { class: 'label', style: 'font-weight:600' }, u.username),
        u.isAdmin ? h('span', { class: 'tag on' }, t('admin')) : null,
        u.disabled ? h('span', { class: 'tag off' }, t('disabled')) : null,
        self ? h('span', { class: 'tag' }, t('you')) : null)),
      h('td', { class: 'usage-cell' },
        h('div', { class: 'small' }, fmtSize(u.usage), ' / ', u.quotaBytes ? fmtSize(u.quotaBytes) : t('no limit')),
        u.quotaBytes ? h('div', { class: 'bar' + (pct >= 100 ? ' full' : pct >= 85 ? ' warn' : '') }, h('span', { style: `width:${pct}%` })) : null),
      h('td', { class: 'when hide-sm' }, fmtDate(u.createdAt)),
      h('td', { class: 'act' }, h('button', {
        class: 'btn ghost icon', html: ICONS.more, onclick: (ev) => showMenu(ev.currentTarget, [
          { label: t('Change storage limit'), action: () => editQuota(u) },
          { label: t('Reset password'), action: () => resetPassword(u) },
          self ? null : { label: u.disabled ? t('Enable account') : t('Disable account'), action: () => patchUser(u, { disabled: !u.disabled }, u.disabled ? t('Account enabled') : t('Account disabled')) },
          self ? null : { label: u.isAdmin ? t('Remove admin rights') : t('Make admin'), action: () => patchUser(u, { isAdmin: !u.isAdmin }, t('Role updated')) },
          self ? null : '-',
          self ? null : { label: t('Delete user and files'), danger: true, action: () => deleteUser(u) },
        ]),
      })));
  });

  main.replaceChildren(
    h('h1', {}, t('Admin')),
    h('p', { class: 'muted', style: 'margin:0 0 18px' }, t('Manage who can log in and how much each person can store.')),
    stats,
    h('div', { class: 'card card-pad', style: 'margin-bottom:18px' }, h('h2', {}, t('Add a user')), createForm),
    h('div', { class: 'card' }, h('table', { class: 'list' },
      h('thead', {}, h('tr', {}, h('th', {}, t('User')), h('th', {}, t('Storage')), h('th', { class: 'hide-sm' }, t('Created')), h('th', { class: 'act' }))),
      h('tbody', {}, rows))));
}

async function patchUser(u, body, msg) {
  try {
    await api('/api/admin/users/' + u.id, { method: 'PATCH', json: body });
    toast(msg);
    render();
  } catch (e) { fail(e); }
}

async function editQuota(u) {
  const v = await dialog({
    title: t('Storage limit for {name}', { name: u.username }),
    message: t('Currently using {size}.', { size: fmtSize(u.usage) }),
    fields: [{ name: 'gb', label: t('Limit in GB (0 = no limit)'), type: 'number', min: 0, step: 'any', value: u.quotaBytes ? +(u.quotaBytes / 1024 ** 3).toFixed(2) : 0 }],
    okText: t('Save'),
  });
  if (v) patchUser(u, { quotaGB: v.gb || 0 }, t('Storage limit updated'));
}

async function resetPassword(u) {
  const self = u.id === state.user.id;
  const v = await dialog({
    title: t('New password for {name}', { name: u.username }),
    fields: [
      { name: 'password', label: t('New password (min. 8 characters)'), type: 'text' },
      self ? null : { name: 'must', label: t('Ask them to choose their own password at next login'), type: 'checkbox', value: true },
    ].filter(Boolean),
    okText: t('Set password'),
  });
  if (v) patchUser(u, { password: v.password, mustChangePassword: !!v.must }, t('Password updated'));
}

async function deleteUser(u) {
  const v = await dialog({
    title: t('Delete {name}?', { name: u.username }),
    message: t('This removes the account and permanently deletes all of their files ({size}). Type the username to confirm.', { size: fmtSize(u.usage) }),
    fields: [{ name: 'confirm', label: t('Username'), placeholder: u.username }],
    okText: t('Delete user'), danger: true,
  });
  if (!v) return;
  if (v.confirm !== u.username) return toast(t("Username didn't match — nothing was deleted"), 'error');
  try {
    await api('/api/admin/users/' + u.id, { method: 'DELETE' });
    toast(t('User deleted'));
    render();
  } catch (e) { fail(e); }
}

boot();
