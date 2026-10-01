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
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + ' ' + u[i];
}

function fmtDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const opts = d.getFullYear() === now.getFullYear()
    ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleString(undefined, opts);
}

const enc = encodeURIComponent;
const joinPath = (a, b) => (a ? a + '/' + b : b);
const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

const PREVIEW = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'ico'],
  video: ['mp4', 'webm', 'm4v', 'mov', 'ogv'],
  audio: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac', 'opus'],
  pdf: ['pdf'],
  text: ['txt', 'log', 'md', 'csv', 'tsv', 'json', 'xml', 'yml', 'yaml', 'ini', 'conf', 'cfg', 'sh', 'bat',
    'ps1', 'js', 'ts', 'py', 'rb', 'php', 'java', 'c', 'h', 'cpp', 'cs', 'go', 'rs', 'sql', 'html', 'htm',
    'css', 'svg', 'env', 'toml', 'properties', 'gitignore', 'srt', 'vtt'],
};
function previewKind(name) {
  const e = extOf(name);
  for (const [k, list] of Object.entries(PREVIEW)) if (list.includes(e)) return k;
  return null;
}

// ---------- icons ----------
const ICONS = {
  folder: '<svg viewBox="0 0 24 24" fill="#e8a33d"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.6c.6 0 1.2.24 1.6.66L12 6h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  zip: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c5cd6" stroke-width="1.7"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10 6h1M10 9h1M10 12h1M9.5 15h2v2.5h-2z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="#2e90fa" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="#e04f5f" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>',
  audio: '<svg viewBox="0 0 24 24" fill="none" stroke="#d6457b" stroke-width="1.7"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="#d92d20" stroke-width="1.7"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 15h7M8.5 12h7"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 12h7M8.5 15h7M8.5 18h4"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  logo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
};
const icon = (name) => h('span', { class: 'ficon', html: ICONS[name] });
function iconFor(entry) {
  if (entry.isDir || entry.dir) return 'folder';
  if (/\.zip$/i.test(entry.name)) return 'zip';
  return previewKind(entry.name) || 'file';
}

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
    throw new Error('Your session has expired. Please log in again.');
  }
  if (!r.ok) throw new Error((data && data.error) || `Request failed (${r.status})`);
  return data;
}

// ---------- toasts ----------
function toast(msg, type) {
  const t = h('div', { class: 'toast' + (type === 'error' ? ' error' : '') }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), type === 'error' ? 6000 : 3000);
}
const fail = (e) => toast(e.message || String(e), 'error');

// ---------- modal / dialogs ----------
function openModal({ title, body, foot, wide, flush, onClose }) {
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const overlay = h('div', { class: 'overlay', onmousedown: (e) => { if (e.target === overlay) close(); } },
    h('div', { class: 'modal' + (wide ? ' wide' : '') },
      h('div', { class: 'modal-head' }, h('h3', { title }, title), h('button', { class: 'btn ghost icon', onclick: close, 'aria-label': 'Close' }, '✕')),
      h('div', { class: 'modal-body' + (flush ? ' flush' : '') }, body),
      foot ? h('div', { class: 'modal-foot' }, foot) : null));
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  return { close, overlay };
}

/** Form dialog. Resolves with field values, or null when cancelled. */
function dialog({ title, message, fields = [], okText = 'OK', danger = false }) {
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
        h('button', { class: 'btn', onclick: () => m.close() }, 'Cancel'),
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
const confirmDialog = (title, message, okText = 'Delete') =>
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
      h('a', { href: '#/files/', class: active === 'files' ? 'active' : '' }, 'Files'),
      u.isAdmin ? h('a', { href: '#/admin', class: active === 'admin' ? 'active' : '' }, 'Admin') : null,
      h('a', { href: '#/account', class: active === 'account' ? 'active' : '' }, 'Account')),
    h('div', { class: 'spacer' }),
    h('span', { class: 'who' }, u.username),
    h('button', {
      class: 'btn small', onclick: async () => {
        await api('/api/logout', { method: 'POST' }).catch(() => {});
        state.user = null;
        location.hash = '';
        render();
      },
    }, 'Log out')));
}

// ===========================================================================
// Login
// ===========================================================================
function loginView() {
  const err = h('div', { class: 'error-box', hidden: true });
  const user = h('input', { type: 'text', autocomplete: 'username', required: true, autofocus: true });
  const pass = h('input', { type: 'password', autocomplete: 'current-password', required: true });
  const btn = h('button', { class: 'btn primary', type: 'submit', style: 'width:100%;justify-content:center;padding:10px' }, 'Log in');
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
  h('div', { class: 'field' }, h('label', {}, 'Username'), user),
  h('div', { class: 'field' }, h('label', {}, 'Password'), pass),
  btn);
  setTimeout(() => user.focus(), 0);
  return h('div', { class: 'center-screen' }, h('div', { class: 'login' },
    h('div', { class: 'brand' }, h('span', { class: 'logo', html: ICONS.logo }), 'Backup Storage'),
    form));
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
      if (np.value.length < 8) return toast('New password must be at least 8 characters', 'error');
      if (np.value !== np2.value) return toast("New passwords don't match", 'error');
      try {
        await api('/api/me/password', { json: { currentPassword: cur.value, newPassword: np.value } });
        toast('Password changed');
        state.user.mustChangePassword = false;
        if (forced) location.hash = '#/files/';
        render();
      } catch (ex) { fail(ex); }
    },
  },
  forced ? h('div', { class: 'notice-box' }, 'Welcome! Please choose a new password before continuing.') : null,
  h('div', { class: 'field' }, h('label', {}, 'Current password'), cur),
  h('div', { class: 'field' }, h('label', {}, 'New password (min. 8 characters)'), np),
  h('div', { class: 'field' }, h('label', {}, 'Repeat new password'), np2),
  h('button', { class: 'btn primary', type: 'submit' }, 'Change password'));
  return h('div', { class: 'card card-pad', style: 'max-width:440px' }, h('h2', {}, 'Change password'), form);
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
    main.replaceChildren(h('div', { class: 'card empty' }, h('div', { class: 'big' }, e.message), h('a', { href: '#/files/' }, 'Go to my files')));
    return;
  }
  state.listing = data;
  state.usage = data.usage;
  drawFiles(main, data);
}

function refresh() { render(); }

function usageBar(used, quota) {
  if (!quota) return h('div', { class: 'usage' }, h('span', {}, `${fmtSize(used)} used · no storage limit`));
  const pct = Math.min(100, (used / quota) * 100);
  return h('div', { class: 'usage' },
    h('div', { class: 'bar' + (pct >= 100 ? ' full' : pct >= 85 ? ' warn' : '') }, h('span', { style: `width:${pct}%` })),
    h('span', {}, `${fmtSize(used)} of ${fmtSize(quota)} used (${fmtSize(Math.max(0, quota - used))} free)`));
}

function drawFiles(main, data) {
  const path = data.path;
  const fileInput = h('input', { type: 'file', multiple: true, hidden: true, onchange: () => { uploadFiles([...fileInput.files], path); fileInput.value = ''; } });

  // breadcrumbs
  const parts = path ? path.split('/') : [];
  const crumbs = h('div', { class: 'crumbs' },
    parts.length ? h('a', { href: '#/files/' }, 'My files') : h('span', { class: 'current' }, 'My files'),
    parts.map((p, i) => [
      h('span', { class: 'sep' }, '/'),
      i === parts.length - 1 ? h('span', { class: 'current' }, p) : h('a', { href: '#/files/' + enc(parts.slice(0, i + 1).join('/')) }, p),
    ]));

  const toolbar = h('div', { class: 'toolbar' },
    h('button', { class: 'btn primary', onclick: () => fileInput.click() }, h('span', { html: ICONS.upload }), 'Upload'),
    h('button', { class: 'btn', onclick: () => newFolder(path) }, h('span', { html: ICONS.plus }), 'New folder'),
    h('button', { class: 'btn icon', title: 'More', onclick: (e) => showMenu(e.currentTarget, [
      { label: 'Download this folder as .zip', action: () => download('/api/download-folder?path=' + enc(path)) },
      { label: 'Refresh', action: refresh },
    ]), html: ICONS.more }));

  const selbar = h('div', { class: 'selbar', hidden: true });
  const updateSel = () => {
    const n = state.selected.size;
    selbar.hidden = n === 0;
    selbar.replaceChildren(
      h('strong', {}, `${n} selected`), h('div', { class: 'spacer' }),
      h('button', { class: 'btn small', onclick: () => moveItems([...state.selected].map((s) => joinPath(path, s))) }, 'Move'),
      h('button', { class: 'btn small danger', onclick: () => deleteItems([...state.selected].map((s) => joinPath(path, s))) }, 'Delete'),
      h('button', { class: 'btn small ghost', onclick: () => { state.selected.clear(); tbody.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = false)); tbody.querySelectorAll('tr').forEach((r) => r.classList.remove('selected')); allCb.checked = false; updateSel(); } }, 'Clear'));
  };

  const allCb = h('input', {
    type: 'checkbox', 'aria-label': 'Select all', onchange: () => {
      state.selected.clear();
      if (allCb.checked) data.entries.forEach((e) => state.selected.add(e.name));
      tbody.querySelectorAll('tr').forEach((r) => {
        r.classList.toggle('selected', allCb.checked);
        const c = r.querySelector('input[type=checkbox]');
        if (c) c.checked = allCb.checked;
      });
      updateSel();
    },
  });

  const tbody = h('tbody', {}, data.entries.map((e) => {
    const full = joinPath(path, e.name);
    const cb = h('input', { type: 'checkbox', 'aria-label': 'Select ' + e.name });
    const row = h('tr', {},
      h('td', { class: 'cb' }, cb),
      h('td', {}, h('div', { class: 'name' }, icon(iconFor(e)),
        h('a', { onclick: () => openEntry(e, full), title: e.name }, e.name),
        e.isZip ? h('span', { class: 'tag' }, 'zip') : null)),
      h('td', { class: 'num' }, e.isDir ? '' : fmtSize(e.size)),
      h('td', { class: 'when hide-sm' }, fmtDate(e.mtime)),
      h('td', { class: 'act' }, h('button', { class: 'btn ghost icon', title: 'Actions', html: ICONS.more, onclick: (ev) => entryMenu(ev.currentTarget, e, full) })));
    cb.addEventListener('change', () => {
      cb.checked ? state.selected.add(e.name) : state.selected.delete(e.name);
      row.classList.toggle('selected', cb.checked);
      updateSel();
    });
    return row;
  }));

  const listCard = h('div', { class: 'card' },
    data.entries.length
      ? h('table', { class: 'list' },
        h('thead', {}, h('tr', {}, h('th', { class: 'cb' }, allCb), h('th', {}, 'Name'), h('th', { class: 'num' }, 'Size'), h('th', { class: 'hide-sm' }, 'Modified'), h('th', { class: 'act' }))),
        tbody)
      : h('div', { class: 'empty' }, h('div', { class: 'big' }, 'This folder is empty'), 'Drag files here or use the Upload button.'));

  // drag & drop
  const dz = h('div', { class: 'dropzone' }, h('div', {}, 'Drop files to upload'));
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
    selbar, listCard, fileInput, dz);
  main.style.minHeight = 'calc(100vh - 60px)';
}

function openEntry(e, full) {
  if (e.isDir) return goFiles(full);
  if (e.isZip) return zipViewer(full, e.name);
  if (e.preview) return previewFile('/api/download?path=' + enc(full), e.name);
  download('/api/download?path=' + enc(full));
}

function entryMenu(anchor, e, full) {
  const dl = e.isDir ? '/api/download-folder?path=' + enc(full) : '/api/download?path=' + enc(full);
  showMenu(anchor, [
    e.isDir ? { label: 'Open', action: () => goFiles(full) } : null,
    e.isZip ? { label: 'View contents', action: () => zipViewer(full, e.name) } : null,
    e.isZip ? { label: 'Extract here', action: () => extractZip(full) } : null,
    !e.isDir && e.preview ? { label: 'Preview', action: () => previewFile('/api/download?path=' + enc(full), e.name) } : null,
    { label: e.isDir ? 'Download as .zip' : 'Download', action: () => download(dl) },
    '-',
    { label: 'Rename', action: () => renameItem(full, e.name) },
    { label: 'Move to…', action: () => moveItems([full]) },
    '-',
    { label: 'Delete', danger: true, action: () => deleteItems([full]) },
  ]);
}

function download(url) {
  const a = h('a', { href: url, download: '' });
  document.body.append(a);
  a.click();
  a.remove();
}

async function newFolder(path) {
  const v = await dialog({ title: 'New folder', fields: [{ name: 'name', label: 'Folder name', placeholder: 'e.g. Photos 2026' }], okText: 'Create' });
  if (!v) return;
  try {
    await api('/api/folder', { json: { path, name: v.name } });
    refresh();
  } catch (e) { fail(e); }
}

async function renameItem(full, name) {
  const v = await dialog({ title: 'Rename', fields: [{ name: 'newName', label: 'New name', value: name }], okText: 'Rename' });
  if (!v || v.newName === name) return;
  try {
    await api('/api/rename', { json: { path: full, newName: v.newName } });
    refresh();
  } catch (e) { fail(e); }
}

async function deleteItems(paths) {
  const label = paths.length === 1 ? `"${paths[0].split('/').pop()}"` : `${paths.length} items`;
  if (!(await confirmDialog('Delete', `Permanently delete ${label}? Folders are deleted with everything inside. This cannot be undone.`))) return;
  try {
    await api('/api/delete', { json: { paths } });
    state.selected.clear();
    toast('Deleted');
    refresh();
  } catch (e) { fail(e); }
}

async function moveItems(paths) {
  let folders;
  try { ({ folders } = await api('/api/folders')); } catch (e) { return fail(e); }
  // don't offer moving a folder into itself
  folders = folders.filter((f) => !paths.some((p) => f === p || f.startsWith(p + '/')));
  const v = await dialog({
    title: paths.length === 1 ? `Move "${paths[0].split('/').pop()}"` : `Move ${paths.length} items`,
    fields: [{ name: 'dest', label: 'Destination folder', type: 'select', value: '', options: folders.map((f) => ({ value: f, label: f ? '/ ' + f.split('/').join(' / ') : '/ (My files)' })) }],
    okText: 'Move',
  });
  if (!v) return;
  try {
    await api('/api/move', { json: { paths, dest: v.dest } });
    state.selected.clear();
    toast('Moved');
    refresh();
  } catch (e) { fail(e); }
}

async function extractZip(full) {
  const t = h('div', { class: 'toast' }, 'Extracting…');
  $('#toasts').append(t);
  try {
    const r = await api('/api/zip/extract', { json: { path: full } });
    toast('Extracted to "' + r.folder.split('/').pop() + '"');
    refresh();
  } catch (e) { fail(e); } finally { t.remove(); }
}

// ---------- uploads ----------
let uploadPanel = null;
function getUploadPanel() {
  if (uploadPanel && document.body.contains(uploadPanel.el)) return uploadPanel;
  const list = h('div', { class: 'uploads-list' });
  const title = h('span', {}, 'Uploads');
  const closeBtn = h('button', { class: 'btn ghost icon small', onclick: () => { el.remove(); uploadPanel = null; } }, '✕');
  const el = h('div', { class: 'uploads' }, h('div', { class: 'uploads-head' }, title, h('div', { class: 'spacer' }), closeBtn), list);
  document.body.append(el);
  uploadPanel = { el, list, title, closeBtn, active: 0 };
  return uploadPanel;
}

let uploadQueue = Promise.resolve();
function uploadFiles(files, path) {
  if (!files.length) return;
  const quota = state.listing?.quota || 0;
  const total = files.reduce((a, f) => a + f.size, 0);
  if (quota && total > quota - state.usage)
    return toast(`Not enough space: ${fmtSize(total)} selected, ${fmtSize(Math.max(0, quota - state.usage))} free.`, 'error');
  const tooBig = files.find((f) => state.maxFileBytes && f.size > state.maxFileBytes);
  if (tooBig) return toast(`"${tooBig.name}" is larger than the ${fmtSize(state.maxFileBytes)} per-file limit.`, 'error');

  const panel = getUploadPanel();
  for (const f of files) {
    const st = h('span', { class: 'st' }, 'Waiting');
    const bar = h('span', { style: 'width:0%' });
    const item = h('div', { class: 'up' }, h('div', { class: 'row' }, h('span', { class: 'fname', title: f.name }, f.name), st), h('div', { class: 'bar' }, bar));
    panel.list.append(item);
    panel.active++;
    panel.title.textContent = `Uploading ${panel.active} file${panel.active > 1 ? 's' : ''}`;
    uploadQueue = uploadQueue.then(async () => {
      st.textContent = '0%';
      try {
        const r = await uploadOne(f, path, (p) => {
          bar.style.width = (p * 100).toFixed(1) + '%';
          st.textContent = p >= 1 ? 'Saving…' : Math.floor(p * 100) + '% of ' + fmtSize(f.size);
        });
        state.usage = r.usage;
        item.classList.add('done');
        st.textContent = 'Done';
        bar.style.width = '100%';
      } catch (e) {
        item.classList.add('err');
        st.textContent = e.message;
        st.title = e.message;
      }
      panel.active--;
      panel.title.textContent = panel.active ? `Uploading ${panel.active} file${panel.active > 1 ? 's' : ''}` : 'Uploads finished';
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
      x.status >= 200 && x.status < 300 ? resolve(d) : reject(new Error(d.error || `Upload failed (${x.status})`));
    };
    x.onerror = () => reject(new Error('Upload failed (connection lost or rejected)'));
    x.send(fd);
  });
}

// ---------- preview ----------
async function previewFile(url, name) {
  const kind = previewKind(name);
  const inlineUrl = url + '&inline=1';
  if (kind === 'pdf') return window.open(inlineUrl, '_blank', 'noopener');
  let content;
  if (kind === 'image') content = h('img', { src: inlineUrl, alt: name });
  else if (kind === 'video') content = h('video', { src: inlineUrl, controls: true, autoplay: true });
  else if (kind === 'audio') content = h('audio', { src: inlineUrl, controls: true, autoplay: true });
  else if (kind === 'text') {
    content = h('pre', { class: 'text' }, 'Loading…');
    loadText(inlineUrl, content);
  } else return download(url);
  openModal({
    title: name, wide: true, flush: true,
    body: h('div', { class: 'preview-body' }, content),
    foot: [h('button', { class: 'btn', onclick: () => download(url) }, 'Download')],
  });
}

async function loadText(url, pre) {
  const LIMIT = 1024 * 1024;
  try {
    const r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not load file');
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
    pre.textContent = new TextDecoder().decode(buf) + (truncated ? '\n\n… (preview limited to the first 1 MB — download to see everything)' : '');
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
      h('button', { class: 'btn', onclick: () => download('/api/download?path=' + enc(full)) }, 'Download zip'),
      h('button', { class: 'btn primary', onclick: () => { m.close(); extractZip(full); } }, 'Extract here'),
    ],
  });
  let data;
  try {
    data = await api('/api/zip/list?path=' + enc(full));
  } catch (e) {
    body.replaceChildren(h('div', { class: 'empty' }, h('div', { class: 'big' }, "Couldn't open this zip"), e.message));
    return;
  }

  const files = data.entries.filter((e) => !e.dir);
  const totalSize = files.reduce((a, e) => a + e.size, 0);
  const totalC = files.reduce((a, e) => a + e.csize, 0);
  const encCount = files.filter((e) => e.encrypted).length;
  const meta = h('div', { class: 'zip-meta' },
    h('span', {}, h('b', {}, files.length.toLocaleString()), ' files'),
    h('span', {}, h('b', {}, fmtSize(totalSize)), ' uncompressed'),
    h('span', {}, h('b', {}, fmtSize(totalC)), ' compressed', totalSize ? ` (${Math.round((1 - totalC / totalSize) * 100)}% saved)` : ''),
    encCount ? h('span', { style: 'color:var(--warn)' }, `${encCount} password-protected`) : null,
    data.truncated ? h('span', { style: 'color:var(--warn)' }, `Showing first ${data.entries.length.toLocaleString()} of ${data.total.toLocaleString()} entries`) : null);

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
    crumbs.replaceChildren(
      parts.length ? h('a', { onclick: () => show('') }, name) : h('strong', {}, name),
      parts.map((p, i) => [h('span', { class: 'muted' }, ' / '),
        i === parts.length - 1 ? h('strong', {}, p) : h('a', { onclick: () => show(parts.slice(0, i + 1).join('/') + '/') }, p)]));
    const items = children(prefix);
    if (!items.length) return listWrap.replaceChildren(h('div', { class: 'empty' }, 'Empty'));
    listWrap.replaceChildren(h('table', { class: 'list' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Name'), h('th', { class: 'num' }, 'Size'), h('th', { class: 'hide-sm' }, 'Modified'), h('th', { class: 'act' }))),
      h('tbody', {}, items.map((it) => {
        const entryUrl = '/api/zip/entry?path=' + enc(full) + '&entry=' + enc(it.name);
        const kind = previewKind(it.label);
        const open = it.dir ? () => show(it.name)
          : it.encrypted ? () => toast('This file is password-protected inside the zip', 'error')
          : kind ? () => previewFile(entryUrl, it.label) : () => download(entryUrl);
        return h('tr', {},
          h('td', {}, h('div', { class: 'name' }, icon(it.dir ? 'folder' : iconFor({ name: it.label })),
            h('a', { onclick: open, title: it.name }, it.label),
            it.dir ? h('span', { class: 'tag' }, `${it.count} file${it.count === 1 ? '' : 's'}`) : null,
            it.encrypted ? h('span', { class: 'tag off' }, 'locked') : null)),
          h('td', { class: 'num' }, fmtSize(it.size)),
          h('td', { class: 'when hide-sm' }, it.dir ? '' : fmtDate(it.mtime)),
          h('td', { class: 'act' }, it.dir || it.encrypted ? null : h('button', {
            class: 'btn ghost icon', html: ICONS.more, onclick: (ev) => showMenu(ev.currentTarget, [
              kind ? { label: 'Preview', action: () => previewFile(entryUrl, it.label) } : null,
              { label: 'Download this file', action: () => download(entryUrl) },
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
    data.disk ? h('div', { class: 'card stat' }, h('div', { class: 'k' }, 'Server disk'),
      h('div', { class: 'v' }, fmtSize(data.disk.free) + ' free'),
      h('div', { class: 's' }, 'of ' + fmtSize(data.disk.total))) : null,
    h('div', { class: 'card stat' }, h('div', { class: 'k' }, 'Stored by users'), h('div', { class: 'v' }, fmtSize(totalUsed)), h('div', { class: 's' }, `${data.users.length} user${data.users.length === 1 ? '' : 's'}`)),
    h('div', { class: 'card stat' }, h('div', { class: 'k' }, 'Quota allocated'), h('div', { class: 'v' }, fmtSize(data.allocated)),
      h('div', { class: 's', style: data.disk && data.allocated > data.disk.free + totalUsed ? 'color:var(--warn)' : '' },
        data.disk && data.allocated > data.disk.free + totalUsed ? 'More than the disk can hold' : 'Users with no limit not counted')),
    h('div', { class: 'card stat' }, h('div', { class: 'k' }, 'Max upload per file'), h('div', { class: 'v' }, fmtSize(data.maxFileBytes)), h('div', { class: 's' }, 'Set MAX_FILE_SIZE_MB to change')));

  // create user
  const f = {
    username: h('input', { type: 'text', required: true, placeholder: 'e.g. carolina', autocomplete: 'off' }),
    password: h('input', { type: 'text', required: true, minLength: 8, placeholder: 'min. 8 characters', autocomplete: 'off' }),
    quota: h('input', { type: 'number', min: 0, step: 'any', value: '50' }),
    admin: h('input', { type: 'checkbox' }),
  };
  const createForm = h('form', {
    class: 'grid-form', onsubmit: async (e) => {
      e.preventDefault();
      try {
        await api('/api/admin/users', { json: { username: f.username.value.trim(), password: f.password.value, quotaGB: f.quota.value || 0, isAdmin: f.admin.checked } });
        toast(`User "${f.username.value.trim()}" created`);
        render();
      } catch (ex) { fail(ex); }
    },
  },
  h('div', { class: 'field' }, h('label', {}, 'Username'), f.username),
  h('div', { class: 'field' }, h('label', {}, 'Password'), f.password),
  h('div', { class: 'field' }, h('label', {}, 'Storage limit (GB, 0 = none)'), f.quota),
  h('div', { class: 'field', style: 'padding-bottom:9px' }, h('label', { class: 'check' }, f.admin, 'Admin')),
  h('button', { class: 'btn primary', type: 'submit' }, 'Add user'));

  const rows = data.users.map((u) => {
    const self = u.id === state.user.id;
    const pct = u.quotaBytes ? Math.min(100, (u.usage / u.quotaBytes) * 100) : 0;
    return h('tr', {},
      h('td', {}, h('div', { class: 'name' }, h('span', { class: 'label', style: 'font-weight:600' }, u.username),
        u.isAdmin ? h('span', { class: 'tag on' }, 'admin') : null,
        u.disabled ? h('span', { class: 'tag off' }, 'disabled') : null,
        self ? h('span', { class: 'tag' }, 'you') : null)),
      h('td', { class: 'usage-cell' },
        h('div', { class: 'small' }, fmtSize(u.usage), ' / ', u.quotaBytes ? fmtSize(u.quotaBytes) : 'no limit'),
        u.quotaBytes ? h('div', { class: 'bar' + (pct >= 100 ? ' full' : pct >= 85 ? ' warn' : '') }, h('span', { style: `width:${pct}%` })) : null),
      h('td', { class: 'when hide-sm' }, fmtDate(u.createdAt)),
      h('td', { class: 'act' }, h('button', {
        class: 'btn ghost icon', html: ICONS.more, onclick: (ev) => showMenu(ev.currentTarget, [
          { label: 'Change storage limit', action: () => editQuota(u) },
          { label: 'Reset password', action: () => resetPassword(u) },
          self ? null : { label: u.disabled ? 'Enable account' : 'Disable account', action: () => patchUser(u, { disabled: !u.disabled }, u.disabled ? 'Account enabled' : 'Account disabled') },
          self ? null : { label: u.isAdmin ? 'Remove admin rights' : 'Make admin', action: () => patchUser(u, { isAdmin: !u.isAdmin }, 'Role updated') },
          self ? null : '-',
          self ? null : { label: 'Delete user and files', danger: true, action: () => deleteUser(u) },
        ]),
      })));
  });

  main.replaceChildren(
    h('h1', {}, 'Admin'),
    h('p', { class: 'muted', style: 'margin:0 0 18px' }, 'Manage who can log in and how much each person can store.'),
    stats,
    h('div', { class: 'card card-pad', style: 'margin-bottom:18px' }, h('h2', {}, 'Add a user'), createForm),
    h('div', { class: 'card' }, h('table', { class: 'list' },
      h('thead', {}, h('tr', {}, h('th', {}, 'User'), h('th', {}, 'Storage'), h('th', { class: 'hide-sm' }, 'Created'), h('th', { class: 'act' }))),
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
    title: `Storage limit for ${u.username}`,
    message: `Currently using ${fmtSize(u.usage)}.`,
    fields: [{ name: 'gb', label: 'Limit in GB (0 = no limit)', type: 'number', min: 0, step: 'any', value: u.quotaBytes ? +(u.quotaBytes / 1024 ** 3).toFixed(2) : 0 }],
    okText: 'Save',
  });
  if (v) patchUser(u, { quotaGB: v.gb || 0 }, 'Storage limit updated');
}

async function resetPassword(u) {
  const self = u.id === state.user.id;
  const v = await dialog({
    title: `New password for ${u.username}`,
    fields: [
      { name: 'password', label: 'New password (min. 8 characters)', type: 'text' },
      self ? null : { name: 'must', label: 'Ask them to choose their own password at next login', type: 'checkbox', value: true },
    ].filter(Boolean),
    okText: 'Set password',
  });
  if (v) patchUser(u, { password: v.password, mustChangePassword: !!v.must }, 'Password updated');
}

async function deleteUser(u) {
  const v = await dialog({
    title: `Delete ${u.username}?`,
    message: `This removes the account and permanently deletes all of their files (${fmtSize(u.usage)}). Type the username to confirm.`,
    fields: [{ name: 'confirm', label: 'Username', placeholder: u.username }],
    okText: 'Delete user', danger: true,
  });
  if (!v) return;
  if (v.confirm !== u.username) return toast("Username didn't match — nothing was deleted", 'error');
  try {
    await api('/api/admin/users/' + u.id, { method: 'DELETE' });
    toast('User deleted');
    render();
  } catch (e) { fail(e); }
}

boot();
