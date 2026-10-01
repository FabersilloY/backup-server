'use strict';

/*
 * Server-rendered pages for public share links (https://files.<domain>/s/<token>):
 * the landing page (file icon, name, download button), the passcode prompt and the
 * "not available" page. Plain HTML + CSS only: no JavaScript and no external assets,
 * so they work everywhere and can be served under a very strict CSP.
 */

const FileTypes = require('./public/filetypes.js');

const STRINGS = {
  en: {
    download: 'Download',
    protectedTitle: 'This file is protected',
    protectedHelp: 'Enter the passcode you were given to continue.',
    passcode: 'Passcode',
    continue: 'Continue',
    wrong: "That passcode isn't correct. Please try again.",
    tooMany: 'Too many attempts. Please try again in 15 minutes.',
    unavailableTitle: 'This link is not available',
    unavailableHelp: 'The file may have been removed, or it is no longer being shared.',
    footer: 'Shared with Backup Storage',
  },
  es: {
    download: 'Descargar',
    protectedTitle: 'Este archivo está protegido',
    protectedHelp: 'Introduce el código de acceso que te han dado para continuar.',
    passcode: 'Código de acceso',
    continue: 'Continuar',
    wrong: 'El código de acceso no es correcto. Inténtalo de nuevo.',
    tooMany: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.',
    unavailableTitle: 'Este enlace no está disponible',
    unavailableHelp: 'Es posible que el archivo se haya eliminado o que ya no se esté compartiendo.',
    footer: 'Compartido con Backup Storage',
  },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Language for a visitor: Spanish if their browser prefers it, otherwise English. */
function pickLang(req) {
  if (!req.headers['accept-language']) return 'en';
  return req.acceptsLanguages('es', 'en') || 'en';
}

function fmtSize(n, lang) {
  if (n < 1024) return n + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < units.length - 1);
  const d = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return n.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }) + ' ' + units[i];
}

const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
const ICON_LINK_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-.9.9M14 10a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l.9-.9M4 4l16 16"/></svg>';

const CSS = `
:root{--bg:#f4f6f5;--surface:#fff;--surface-2:#eff2f0;--border:#e0e5e2;--text:#1a2220;--muted:#66716c;--accent:#0f766e;--accent-hover:#0c5f58;--accent-soft:#e2f3f0;--danger:#b42318;--danger-soft:#fdecea;--icon-stroke:#aab4af;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101312;--surface:#181c1b;--surface-2:#212726;--border:#2c3330;--text:#e8ecea;--muted:#94a09b;--accent:#2bb3a3;--accent-hover:#3cc8b7;--accent-soft:#15332f;--danger:#f97066;--danger-soft:#3a1d1b;--icon-stroke:#4b5752;color-scheme:dark}}
*{box-sizing:border-box}
html,body{margin:0}
body{min-height:100vh;display:flex;flex-direction:column;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:radial-gradient(900px 420px at 50% -120px,var(--accent-soft),transparent 70%),var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
main{flex:1;display:grid;place-items:center;padding:24px 16px}
.card{width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:34px 28px 30px;text-align:center;box-shadow:0 1px 2px rgba(16,24,20,.05),0 8px 28px rgba(16,24,20,.07)}
.ficon{width:72px;height:88px;margin:0 auto 16px}
.ficon svg{width:100%;height:100%;display:block}
.ficon .pg{fill:var(--surface);stroke:var(--icon-stroke)}
.ficon .fold{fill:var(--surface-2);stroke:var(--icon-stroke)}
.badge{width:64px;height:64px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)}
.badge.off{background:var(--surface-2);color:var(--muted)}
.badge svg{width:30px;height:30px}
h1{margin:0 0 6px;font-size:20px;line-height:1.3;letter-spacing:-.01em;overflow-wrap:anywhere}
.meta{margin:0 0 24px;color:var(--muted);font-size:14px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 18px;border:1px solid var(--accent);border-radius:11px;background:var(--accent);color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
.btn:hover{background:var(--accent-hover);border-color:var(--accent-hover)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
input[type=password]{width:100%;margin:0 0 12px;padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:inherit;font:inherit;text-align:center;letter-spacing:.08em}
input[type=password]:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.err{margin:0 0 14px;padding:9px 12px;border-radius:9px;background:var(--danger-soft);color:var(--danger);font-size:14px}
footer{padding:0 16px 22px;text-align:center;color:var(--muted);font-size:13px}
`;

function layout(lang, title, body) {
  const L = STRINGS[lang];
  return `<!doctype html>
<html lang="${lang}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head><body>
<main>${body}</main>
<footer>${esc(L.footer)}</footer>
</body></html>`;
}

/** The page every share link lands on: file icon, name and a download button. */
function landing({ token, name, size, lang }) {
  const L = STRINGS[lang];
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  return layout(lang, name, `
<div class="card">
  <div class="ficon">${FileTypes.icon(ext)}</div>
  <h1 dir="auto">${esc(name)}</h1>
  <p class="meta">${esc(fmtSize(size, lang))}</p>
  <a class="btn" href="/s/${esc(token)}/download" rel="nofollow">${ICON_DOWNLOAD}<span>${esc(L.download)}</span></a>
</div>`);
}

/** Shown instead of the landing page until the right passcode is entered (reveals nothing about the file). */
function passcode({ token, lang, error }) {
  const L = STRINGS[lang];
  return layout(lang, L.protectedTitle, `
<div class="card">
  <div class="badge">${ICON_LOCK}</div>
  <h1>${esc(L.protectedTitle)}</h1>
  <p class="meta">${esc(L.protectedHelp)}</p>
  ${error ? `<p class="err" role="alert">${esc(L[error])}</p>` : ''}
  <form method="post" action="/s/${esc(token)}" autocomplete="off">
    <input type="password" name="passcode" required autofocus maxlength="128" autocomplete="off" aria-label="${esc(L.passcode)}" placeholder="${esc(L.passcode)}">
    <button class="btn" type="submit">${esc(L.continue)}</button>
  </form>
</div>`);
}

/** Same page for unknown, removed or switched-off links, so nothing can be probed. */
function unavailable(lang) {
  const L = STRINGS[lang];
  return layout(lang, L.unavailableTitle, `
<div class="card">
  <div class="badge off">${ICON_LINK_OFF}</div>
  <h1>${esc(L.unavailableTitle)}</h1>
  <p class="meta" style="margin:0">${esc(L.unavailableHelp)}</p>
</div>`);
}

module.exports = { landing, passcode, unavailable, pickLang };
