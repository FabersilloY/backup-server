'use strict';

/*
 * Backup Storage Server
 * Simple private file storage with admin user management, per-user quotas,
 * file/folder management and in-browser .zip viewing.
 */

const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { Worker } = require('worker_threads');
const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const yauzl = require('yauzl');
const archiver = require('archiver');
const mime = require('mime-types');
const contentDisposition = require('content-disposition');

// ---------------------------------------------------------------------------
// Configuration (override with environment variables, see ecosystem.config.js)
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3005', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, 'storage'));
const TMP_DIR = path.join(STORAGE_DIR, '.uploads-tmp');
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_SIZE_MB || 10240) * 1024 * 1024; // default 10 GB per file
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'; // set true when served over HTTPS
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';     // set true behind nginx/caddy
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 14);
const ZIP_LIST_LIMIT = 50000;
const ZIP_EXTRACT_MAX_ENTRIES = 100000;
const OFFICE_MAX_BYTES = { doc: 30 * 1024 * 1024, sheet: 25 * 1024 * 1024 }; // largest file we will try to convert
const OFFICE_MAX_UNZIPPED = { doc: 120 * 1024 * 1024, sheet: 200 * 1024 * 1024 }; // docx/xlsx are zips: refuse bombs
const OFFICE_MAX_ZIP_ENTRIES = 20000;
const OFFICE_TIMEOUT_MS = 20000;
const OFFICE_MAX_PARALLEL = 2;

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
fs.mkdirSync(STORAGE_DIR, { recursive: true, mode: 0o700 });
fs.rmSync(TMP_DIR, { recursive: true, force: true }); // leftovers from interrupted uploads
fs.mkdirSync(TMP_DIR, { recursive: true, mode: 0o700 });

// ---------------------------------------------------------------------------
// Tiny JSON user store
// ---------------------------------------------------------------------------
const USERS_FILE = path.join(DATA_DIR, 'users.json');
let db = { users: [] };
try {
  db = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}

function saveDb() {
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, USERS_FILE);
}

const LANGS = ['en', 'es'];
const findUser = (id) => db.users.find((u) => u.id === id);
const findByName = (name) =>
  db.users.find((u) => u.username.toLowerCase() === String(name || '').toLowerCase());
const userRoot = (u) => path.join(STORAGE_DIR, u.id);

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    isAdmin: !!u.isAdmin,
    quotaBytes: u.quotaBytes || 0,
    disabled: !!u.disabled,
    mustChangePassword: !!u.mustChangePassword,
    lang: LANGS.includes(u.lang) ? u.lang : null, // null = not chosen yet; the browser decides
    createdAt: u.createdAt,
  };
}

function createUser({ username, password, isAdmin = false, quotaBytes = 0, mustChangePassword = false }) {
  const u = {
    id: crypto.randomBytes(8).toString('hex'),
    username,
    passwordHash: bcrypt.hashSync(password, 12),
    isAdmin,
    quotaBytes,
    disabled: false,
    mustChangePassword,
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
  };
  db.users.push(u);
  saveDb();
  fs.mkdirSync(userRoot(u), { recursive: true, mode: 0o700 });
  return u;
}

// First run: create the admin account
if (!db.users.some((u) => u.isAdmin)) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const fromEnv = !!process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  createUser({ username, password, isAdmin: true, mustChangePassword: !fromEnv });
  console.log('\n==============================================');
  console.log(' Admin account created');
  console.log(`   username: ${username}`);
  console.log(`   password: ${fromEnv ? '(from ADMIN_PASSWORD)' : password}`);
  if (!fromEnv) console.log(' You will be asked to change it on first login.');
  console.log('==============================================\n');
}

function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const f = path.join(DATA_DIR, '.session-secret');
  try {
    return fs.readFileSync(f, 'utf8').trim();
  } catch {
    const s = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(f, s, { mode: 0o600 });
    return s;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Resolve a user-relative path safely inside the user's root. */
function resolveSafe(user, rel = '') {
  const root = userRoot(user);
  const clean = String(rel).replace(/\\/g, '/');
  if (clean.includes('\0')) throw httpErr(400, 'Invalid path');
  const full = path.resolve(root, '.' + path.posix.normalize('/' + clean));
  if (full !== root && !full.startsWith(root + path.sep)) throw httpErr(400, 'Invalid path');
  return full;
}

const relOf = (user, full) => path.relative(userRoot(user), full).split(path.sep).join('/');

function validName(name) {
  name = String(name || '').trim();
  if (!name || name === '.' || name === '..') return null;
  if (/[\/\\\0]/.test(name) || /[\x00-\x1f]/.test(name)) return null;
  if (Buffer.byteLength(name) > 255) return null;
  return name;
}

function sanitizeUploadName(name) {
  let n = String(name || '').split(/[\/\\]/).pop();
  n = n.replace(/[\x00-\x1f]/g, '').trim();
  if (!n || n === '.' || n === '..') n = 'file';
  while (Buffer.byteLength(n) > 255) n = n.slice(0, -1);
  return n;
}

async function exists(p) {
  try {
    await fsp.lstat(p);
    return true;
  } catch {
    return false;
  }
}

async function uniquePath(dir, name) {
  let p = path.join(dir, name);
  if (!(await exists(p))) return p;
  const ext = path.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;
  for (let i = 1; ; i++) {
    p = path.join(dir, `${base} (${i})${ext}`);
    if (!(await exists(p))) return p;
  }
}

async function dirSize(dir) {
  let total = 0;
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === 'ENOENT') return 0;
    throw e;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += await dirSize(p);
    else if (e.isFile()) total += (await fsp.stat(p)).size;
  }
  return total;
}

const usageCache = new Map();
async function getUsage(u) {
  if (!usageCache.has(u.id)) usageCache.set(u.id, await dirSize(userRoot(u)));
  return usageCache.get(u.id);
}
const invalidateUsage = (u) => usageCache.delete(u.id);

async function remainingBytes(u) {
  if (!u.quotaBytes) return Infinity;
  return Math.max(0, u.quotaBytes - (await getUsage(u)));
}

// File types that are safe to show inline in the browser (never HTML/SVG)
const PREVIEW = {
  image: new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'ico']),
  video: new Set(['mp4', 'webm', 'm4v', 'mov', 'ogv']),
  audio: new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac', 'opus']),
  pdf: new Set(['pdf']),
  text: new Set(['txt', 'log', 'md', 'csv', 'tsv', 'json', 'xml', 'yml', 'yaml', 'ini', 'conf', 'cfg',
    'sh', 'bat', 'ps1', 'js', 'ts', 'py', 'rb', 'php', 'java', 'c', 'h', 'cpp', 'cs', 'go', 'rs', 'sql',
    'html', 'htm', 'css', 'svg', 'env', 'toml', 'properties', 'gitignore', 'srt', 'vtt']),
};
function previewKind(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  for (const [kind, set] of Object.entries(PREVIEW)) if (set.has(ext)) return kind;
  return null;
}

// Office documents are never sent inline; they are converted by preview-worker.js instead
const OFFICE = {
  doc: new Set(['docx']),
  sheet: new Set(['xlsx', 'xlsm', 'xlsb', 'xls', 'ods']),
};
function officeKind(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  for (const [kind, set] of Object.entries(OFFICE)) if (set.has(ext)) return kind;
  return null;
}

let officeRunning = 0;
const officeWaiting = [];
async function runPreviewJob(job) {
  if (officeRunning >= OFFICE_MAX_PARALLEL) await new Promise((r) => officeWaiting.push(r));
  officeRunning++;
  try {
    return await new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'preview-worker.js'), {
        workerData: job,
        resourceLimits: { maxOldGenerationSizeMb: 192, maxYoungGenerationSizeMb: 32 },
      });
      const timer = setTimeout(() => {
        worker.terminate();
        reject(httpErr(422, 'This file took too long to convert for a preview. Download it instead.'));
      }, OFFICE_TIMEOUT_MS);
      worker.once('message', (m) => {
        clearTimeout(timer);
        worker.terminate();
        m.error ? reject(httpErr(422, m.error)) : resolve(m.result);
      });
      worker.once('error', (e) => {
        clearTimeout(timer);
        reject(httpErr(422, e && e.code === 'ERR_WORKER_OUT_OF_MEMORY'
          ? 'This file is too large or complex to preview. Download it instead.'
          : 'Could not preview this file'));
      });
    });
  } finally {
    officeRunning--;
    const next = officeWaiting.shift();
    if (next) next();
  }
}

/** Set headers for sending a file either as a download or as a safe inline preview. */
function fileHeaders(res, name, inline) {
  const kind = inline ? previewKind(name) : null;
  if (kind === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  } else if (kind) {
    res.setHeader('Content-Type', mime.lookup(name) || 'application/octet-stream');
  } else {
    res.setHeader('Content-Type', 'application/octet-stream');
  }
  res.setHeader('Content-Disposition', contentDisposition(name, { type: kind ? 'inline' : 'attachment' }));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Lock the response down (browsers' built-in PDF viewer doesn't work in a sandbox, so skip it there)
  if (kind !== 'pdf')
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'");
}

// ---------------------------------------------------------------------------
// Zip helpers (yauzl reads only the central directory: fast even for huge zips)
// ---------------------------------------------------------------------------
function openZip(file) {
  return new Promise((resolve, reject) =>
    yauzl.open(file, { lazyEntries: true, autoClose: false, strictFileNames: false }, (err, zip) =>
      err ? reject(httpErr(400, 'Could not read zip: ' + err.message)) : resolve(zip)
    )
  );
}

function eachZipEntry(zip, onEntry) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (err, val) => {
      if (done) return;
      done = true;
      if (err) reject(httpErr(400, 'Could not read zip: ' + err.message));
      else resolve(val);
    };
    zip.on('entry', async (entry) => {
      try {
        const stop = await onEntry(entry);
        if (stop) return finish(null, entry);
        zip.readEntry();
      } catch (e) {
        finish(e);
      }
    });
    zip.on('end', () => finish(null, null));
    zip.on('error', (e) => finish(e));
    zip.readEntry();
  });
}

const openEntryStream = (zip, entry) =>
  new Promise((resolve, reject) =>
    zip.openReadStream(entry, (err, stream) => (err ? reject(httpErr(400, err.message)) : resolve(stream)))
  );

const isEncrypted = (entry) => (entry.generalPurposeBitFlag & 1) !== 0;

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
if (TRUST_PROXY) app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(
  cookieSession({
    name: 'bks',
    keys: [getSecret()],
    maxAge: SESSION_DAYS * 24 * 3600 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res) =>
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' blob: data:; media-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'none'"
      ),
  })
);

// CSRF protection: state-changing API calls must carry a custom header
// (browsers will not send it cross-site without a CORS preflight, which we never allow).
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'BackupServer') return res.status(403).json({ error: 'Forbidden' });
  next();
});

function currentUser(req) {
  const s = req.session;
  if (!s || !s.uid) return null;
  const u = findUser(s.uid);
  if (!u || u.disabled || s.sv !== u.sessionVersion) return null;
  return u;
}

function auth({ admin = false, allowMustChange = false } = {}) {
  return (req, res, next) => {
    const u = currentUser(req);
    if (!u) return res.status(401).json({ error: 'Not logged in' });
    if (u.mustChangePassword && !allowMustChange)
      return res.status(403).json({ error: 'Please change your password first' });
    if (admin && !u.isAdmin) return res.status(403).json({ error: 'Admins only' });
    req.user = u;
    next();
  };
}

// ---- Auth -----------------------------------------------------------------
const loginAttempts = new Map(); // ip -> { count, until }
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

app.post('/api/login', wrap(async (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (rec && rec.count >= 10 && rec.until > now)
    throw httpErr(429, 'Too many failed attempts. Try again in 15 minutes.');

  const { username, password } = req.body || {};
  const u = findByName(username);
  const ok = await bcrypt.compare(String(password || ''), u ? u.passwordHash : DUMMY_HASH);
  if (!u || !ok || u.disabled) {
    const r = rec && rec.until > now ? rec : { count: 0, until: now + 15 * 60 * 1000 };
    r.count++;
    loginAttempts.set(ip, r);
    throw httpErr(401, u && ok && u.disabled ? 'This account is disabled' : 'Wrong username or password');
  }
  loginAttempts.delete(ip);
  req.session = { uid: u.id, sv: u.sessionVersion };
  res.json({ user: publicUser(u) });
}));

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/me', auth({ allowMustChange: true }), wrap(async (req, res) => {
  const u = req.user;
  res.json({
    user: publicUser(u),
    usage: await getUsage(u),
    maxFileBytes: MAX_FILE_BYTES,
  });
}));

app.post('/api/me/password', auth({ allowMustChange: true }), wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const u = req.user;
  if (!(await bcrypt.compare(String(currentPassword || ''), u.passwordHash)))
    throw httpErr(400, 'Current password is incorrect');
  if (String(newPassword || '').length < 8) throw httpErr(400, 'New password must be at least 8 characters');
  u.passwordHash = await bcrypt.hash(newPassword, 12);
  u.mustChangePassword = false;
  u.sessionVersion++; // logs out other sessions
  saveDb();
  req.session = { uid: u.id, sv: u.sessionVersion };
  res.json({ ok: true });
}));

// Interface language is stored per user (users.json) so it follows them across browsers
app.post('/api/me/lang', auth({ allowMustChange: true }), wrap(async (req, res) => {
  const lang = String((req.body || {}).lang || '');
  if (!LANGS.includes(lang)) throw httpErr(400, 'Unsupported language');
  req.user.lang = lang;
  saveDb();
  res.json({ ok: true, lang });
}));

// ---- Files ----------------------------------------------------------------
app.get('/api/files', auth(), wrap(async (req, res) => {
  const u = req.user;
  const dir = resolveSafe(u, req.query.path);
  const st = await fsp.stat(dir).catch(() => null);
  if (!st || !st.isDirectory()) throw httpErr(404, 'Folder not found');
  const names = await fsp.readdir(dir, { withFileTypes: true });
  const entries = [];
  for (const d of names) {
    if (!d.isDirectory() && !d.isFile()) continue;
    const s = await fsp.stat(path.join(dir, d.name)).catch(() => null);
    if (!s) continue;
    entries.push({
      name: d.name,
      isDir: d.isDirectory(),
      size: d.isDirectory() ? null : s.size,
      mtime: s.mtime.toISOString(),
      isZip: !d.isDirectory() && /\.zip$/i.test(d.name),
      preview: d.isDirectory() ? null : previewKind(d.name) || officeKind(d.name),
    });
  }
  entries.sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })));
  res.json({ path: relOf(u, dir), entries, usage: await getUsage(u), quota: u.quotaBytes || 0 });
}));

// All folders (for the "move to" picker)
app.get('/api/folders', auth(), wrap(async (req, res) => {
  const u = req.user;
  const out = [''];
  async function walk(dir) {
    const items = await fsp.readdir(dir, { withFileTypes: true });
    for (const d of items) {
      if (!d.isDirectory()) continue;
      const p = path.join(dir, d.name);
      out.push(relOf(u, p));
      if (out.length > 5000) return;
      await walk(p);
    }
  }
  await walk(userRoot(u));
  out.sort((a, b) => a.localeCompare(b));
  res.json({ folders: out });
}));

app.post('/api/folder', auth(), wrap(async (req, res) => {
  const u = req.user;
  const parent = resolveSafe(u, req.body.path);
  const name = validName(req.body.name);
  if (!name) throw httpErr(400, 'Invalid folder name');
  const target = path.join(parent, name);
  if (await exists(target)) throw httpErr(409, 'Something with that name already exists');
  await fsp.mkdir(target);
  res.json({ ok: true });
}));

app.post('/api/rename', auth(), wrap(async (req, res) => {
  const u = req.user;
  const src = resolveSafe(u, req.body.path);
  if (src === userRoot(u)) throw httpErr(400, 'Cannot rename the root folder');
  const name = validName(req.body.newName);
  if (!name) throw httpErr(400, 'Invalid name');
  if (!(await exists(src))) throw httpErr(404, 'Not found');
  const dest = path.join(path.dirname(src), name);
  if (dest === src) return res.json({ ok: true });
  if (await exists(dest) && dest.toLowerCase() !== src.toLowerCase()) throw httpErr(409, 'Something with that name already exists');
  await fsp.rename(src, dest);
  res.json({ ok: true });
}));

app.post('/api/move', auth(), wrap(async (req, res) => {
  const u = req.user;
  const destDir = resolveSafe(u, req.body.dest);
  const st = await fsp.stat(destDir).catch(() => null);
  if (!st || !st.isDirectory()) throw httpErr(404, 'Destination folder not found');
  const paths = Array.isArray(req.body.paths) ? req.body.paths : [];
  for (const p of paths) {
    const src = resolveSafe(u, p);
    if (src === userRoot(u)) continue;
    if (destDir === src || destDir.startsWith(src + path.sep)) throw httpErr(400, 'Cannot move a folder into itself');
    if (path.dirname(src) === destDir) continue;
    await fsp.rename(src, await uniquePath(destDir, path.basename(src)));
  }
  res.json({ ok: true });
}));

app.post('/api/delete', auth(), wrap(async (req, res) => {
  const u = req.user;
  const paths = Array.isArray(req.body.paths) ? req.body.paths : [];
  for (const p of paths) {
    const full = resolveSafe(u, p);
    if (full === userRoot(u)) continue;
    await fsp.rm(full, { recursive: true, force: true });
  }
  invalidateUsage(u);
  res.json({ ok: true, usage: await getUsage(u) });
}));

app.post('/api/upload', auth(), wrap(async (req, res, next) => {
  const u = req.user;
  const dir = resolveSafe(u, req.query.path);
  const st = await fsp.stat(dir).catch(() => null);
  if (!st || !st.isDirectory()) throw httpErr(404, 'Folder not found');

  const remaining = await remainingBytes(u);
  const len = parseInt(req.get('content-length') || '0', 10);
  if (remaining !== Infinity && len > remaining + 64 * 1024) {
    res.set('Connection', 'close');
    throw httpErr(413, 'Not enough storage space left for this upload');
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: TMP_DIR,
      filename: (r, f, cb) => cb(null, crypto.randomBytes(16).toString('hex')),
    }),
    limits: { fileSize: Math.min(MAX_FILE_BYTES, remaining), files: 500, fields: 10 },
  }).array('files');

  upload(req, res, async (err) => {
    const files = req.files || [];
    const cleanup = () => Promise.all(files.map((f) => fsp.rm(f.path, { force: true })));
    try {
      if (err) {
        await cleanup();
        if (err.code === 'LIMIT_FILE_SIZE')
          throw httpErr(413, remaining < MAX_FILE_BYTES
            ? 'Not enough storage space left for this upload'
            : `File is larger than the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB limit`);
        throw httpErr(400, err.message);
      }
      const total = files.reduce((a, f) => a + f.size, 0);
      if (total > (await remainingBytes(u))) {
        await cleanup();
        throw httpErr(413, 'Not enough storage space left for this upload');
      }
      const saved = [];
      for (const f of files) {
        // busboy hands us latin1-decoded names; restore UTF-8
        let original = f.originalname;
        try {
          const utf8 = Buffer.from(original, 'latin1').toString('utf8');
          if (!utf8.includes('�')) original = utf8;
        } catch {}
        const dest = await uniquePath(dir, sanitizeUploadName(original));
        await fsp.rename(f.path, dest);
        saved.push(path.basename(dest));
      }
      invalidateUsage(u);
      res.json({ ok: true, saved, usage: await getUsage(u) });
    } catch (e) {
      next(e);
    }
  });
}));

app.get('/api/download', auth(), wrap(async (req, res) => {
  const u = req.user;
  const full = resolveSafe(u, req.query.path);
  const st = await fsp.stat(full).catch(() => null);
  if (!st || !st.isFile()) throw httpErr(404, 'File not found');
  const name = path.basename(full);
  fileHeaders(res, name, req.query.inline === '1');
  res.sendFile(full, { dotfiles: 'allow', headers: { 'Content-Type': res.getHeader('Content-Type') } });
}));

// Office previews: .xlsx/.xls/.ods -> JSON (capped rows/cols), .docx -> sandboxed HTML page.
//
// Zip bomb guard: reads only the central directory (cheap) and refuses files that would expand into
// huge buffers. Legacy .xls (not a zip) is skipped; the worker's heap/time limits still apply to it.
async function assertSafeToConvert(file, kind) {
  const fh = await fsp.open(file, 'r');
  const magic = Buffer.alloc(4);
  try { await fh.read(magic, 0, 4, 0); } finally { await fh.close(); }
  if (magic.toString('latin1') !== 'PK\x03\x04') return;
  const limit = OFFICE_MAX_UNZIPPED[kind];
  const tooBig = httpErr(413, 'This file expands to too much data to preview safely. Download it instead.');
  const zip = await openZip(file);
  try {
    if (zip.entryCount > OFFICE_MAX_ZIP_ENTRIES) throw tooBig;
    let total = 0;
    await eachZipEntry(zip, (e) => {
      total += e.uncompressedSize;
      return total > limit; // stop early
    });
    if (total > limit) throw tooBig;
  } finally {
    zip.close();
  }
}

async function officeFileFor(req, kind) {
  const full = resolveSafe(req.user, req.query.path);
  const st = await fsp.stat(full).catch(() => null);
  if (!st || !st.isFile()) throw httpErr(404, 'File not found');
  if (officeKind(full) !== kind) throw httpErr(400, 'This file type cannot be previewed');
  if (st.size > OFFICE_MAX_BYTES[kind])
    throw httpErr(413, `This file is too big to preview (over ${Math.round(OFFICE_MAX_BYTES[kind] / 1048576)} MB). Download it instead.`);
  await assertSafeToConvert(full, kind);
  return { file: full, st };
}

// Small LRU of converted documents so "check" + iframe load (and re-opens) convert only once.
// Keyed by path + mtime + size, so an edited/replaced file is never served stale.
const previewCache = new Map();
async function convertCached(kind, file, st) {
  const key = `${kind}|${file}|${st.mtimeMs}|${st.size}`;
  if (previewCache.has(key)) {
    const v = previewCache.get(key);
    previewCache.delete(key);
    previewCache.set(key, v);
    return v;
  }
  const result = await runPreviewJob({ kind, file });
  if (JSON.stringify(result).length < 4 * 1024 * 1024) {
    previewCache.set(key, result);
    while (previewCache.size > 6) previewCache.delete(previewCache.keys().next().value);
  }
  return result;
}

app.get('/api/preview/sheet', auth(), wrap(async (req, res) => {
  const { file, st } = await officeFileFor(req, 'sheet');
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(await convertCached('sheet', file, st));
}));

app.get('/api/preview/doc', auth(), wrap(async (req, res) => {
  const { file, st } = await officeFileFor(req, 'doc');
  const { html } = await convertCached('doc', file, st);
  // ?check=1 lets the UI surface a readable error before it loads the page into an iframe
  if (req.query.check === '1') return res.json({ ok: true });
  // Served into a sandboxed iframe; the CSP below also forbids scripts, network and forms.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Security-Policy',
    "sandbox allow-popups allow-popups-to-escape-sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'");
  res.send(`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><meta name="referrer" content="no-referrer"><style>
    html{background:#eef0ee}
    body{box-sizing:border-box;max-width:820px;margin:24px auto;padding:56px 64px;background:#fff;color:#1c2321;
      font:15px/1.65 Georgia,'Times New Roman',serif;box-shadow:0 1px 3px rgba(0,0,0,.12),0 8px 30px rgba(0,0,0,.08);border-radius:4px;overflow-wrap:anywhere}
    h1,h2,h3,h4,h5,h6{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.25;margin:1.4em 0 .5em}
    h1{font-size:1.9em}h2{font-size:1.5em}h3{font-size:1.25em}
    p{margin:0 0 .9em}a{color:#0f766e}img{max-width:100%;height:auto}
    table{border-collapse:collapse;margin:1em 0;max-width:100%}td,th{border:1px solid #cfd4d1;padding:5px 9px;vertical-align:top}
    ul,ol{padding-left:1.6em}
    @media (max-width:700px){body{margin:0;padding:24px 18px;border-radius:0}}
  </style></head><body>${html || `<p><em>${req.query.lang === 'es' ? 'Este documento no tiene texto legible.' : 'This document has no readable text.'}</em></p>`}</body></html>`);
}));

// Download a folder (or the whole storage) as a zip, streamed on the fly
app.get('/api/download-folder', auth(), wrap(async (req, res) => {
  const u = req.user;
  const full = resolveSafe(u, req.query.path);
  const st = await fsp.stat(full).catch(() => null);
  if (!st || !st.isDirectory()) throw httpErr(404, 'Folder not found');
  const name = (full === userRoot(u) ? `${u.username}-files` : path.basename(full)) + '.zip';
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', contentDisposition(name));
  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.on('warning', (e) => console.warn('zip warning:', e.message));
  archive.on('error', (e) => {
    console.error('zip error:', e.message);
    res.destroy(e);
  });
  res.on('close', () => archive.abort());
  archive.pipe(res);
  archive.directory(full, false);
  archive.finalize();
}));

// ---- Zip viewing ----------------------------------------------------------
async function zipFileFor(req) {
  const full = resolveSafe(req.user, req.query.path || req.body?.path);
  const st = await fsp.stat(full).catch(() => null);
  if (!st || !st.isFile()) throw httpErr(404, 'Zip file not found');
  return full;
}

app.get('/api/zip/list', auth(), wrap(async (req, res) => {
  const zip = await openZip(await zipFileFor(req));
  const entries = [];
  let truncated = false;
  try {
    await eachZipEntry(zip, (e) => {
      entries.push({
        name: e.fileName,
        dir: e.fileName.endsWith('/'),
        size: e.uncompressedSize,
        csize: e.compressedSize,
        mtime: e.getLastModDate().toISOString(),
        encrypted: isEncrypted(e),
      });
      if (entries.length >= ZIP_LIST_LIMIT) {
        truncated = true;
        return true;
      }
    });
  } finally {
    zip.close();
  }
  res.json({ entries, truncated, total: zip.entryCount });
}));

app.get('/api/zip/entry', auth(), wrap(async (req, res) => {
  const wanted = String(req.query.entry || '');
  const zip = await openZip(await zipFileFor(req));
  let entry;
  try {
    entry = await eachZipEntry(zip, (e) => e.fileName === wanted);
  } catch (e) {
    zip.close();
    throw e;
  }
  if (!entry || entry.fileName.endsWith('/')) {
    zip.close();
    throw httpErr(404, 'Entry not found in zip');
  }
  if (isEncrypted(entry)) {
    zip.close();
    throw httpErr(400, 'This file is password-protected inside the zip and cannot be opened here');
  }
  const stream = await openEntryStream(zip, entry);
  const name = path.posix.basename(entry.fileName);
  fileHeaders(res, name, req.query.inline === '1');
  res.setHeader('Content-Length', entry.uncompressedSize);
  try {
    await pipeline(stream, res);
  } catch {
    /* client aborted */
  } finally {
    zip.close();
  }
}));

// Extract ONE file out of a zip into a folder of the user's storage (default: next to the zip)
app.post('/api/zip/extract-entry', auth(), wrap(async (req, res) => {
  const u = req.user;
  const zipPath = await zipFileFor(req);
  const wanted = String((req.body || {}).entry || '');
  const destDir = (req.body || {}).dest == null ? path.dirname(zipPath) : resolveSafe(u, req.body.dest);
  const dst = await fsp.stat(destDir).catch(() => null);
  if (!dst || !dst.isDirectory()) throw httpErr(404, 'Destination folder not found');

  const zip = await openZip(zipPath);
  let target = null;
  try {
    const entry = await eachZipEntry(zip, (e) => e.fileName === wanted);
    if (!entry || entry.fileName.endsWith('/')) throw httpErr(404, 'Entry not found in zip');
    if (isEncrypted(entry)) throw httpErr(400, 'This file is password-protected inside the zip and cannot be opened here');
    if (entry.uncompressedSize > (await remainingBytes(u)))
      throw httpErr(413, 'Not enough storage space left to extract this file');

    // only the file name is used (never the zip's internal path), so nothing can escape destDir
    target = await uniquePath(destDir, sanitizeUploadName(path.posix.basename(entry.fileName)));
    const stream = await openEntryStream(zip, entry);
    await pipeline(stream, fs.createWriteStream(target, { flags: 'wx' }));
    const d = entry.getLastModDate();
    await fsp.utimes(target, d, d).catch(() => {});
  } catch (e) {
    if (target) await fsp.rm(target, { force: true }); // don't leave a partial file behind
    throw e;
  } finally {
    zip.close();
    invalidateUsage(u);
  }
  res.json({ ok: true, name: path.basename(target), path: relOf(u, target), usage: await getUsage(u) });
}));

// Extract a zip into a new folder next to it
app.post('/api/zip/extract', auth(), wrap(async (req, res) => {
  const u = req.user;
  const zipPath = await zipFileFor(req);
  const zip = await openZip(zipPath);
  try {
    if (zip.entryCount > ZIP_EXTRACT_MAX_ENTRIES) throw httpErr(400, 'Zip has too many entries to extract');

    // Pass 1: check total size against quota and detect encrypted entries
    let total = 0;
    let encrypted = 0;
    await eachZipEntry(zip, (e) => {
      total += e.uncompressedSize;
      if (isEncrypted(e)) encrypted++;
    });
    if (encrypted) throw httpErr(400, 'This zip is password-protected and cannot be extracted here');
    if (total > (await remainingBytes(u)))
      throw httpErr(413, 'Not enough storage space left to extract this zip');
  } finally {
    zip.close();
  }

  // Pass 2: extract
  const baseName = path.basename(zipPath).replace(/\.zip$/i, '') || 'extracted';
  const destRoot = await uniquePath(path.dirname(zipPath), baseName);
  await fsp.mkdir(destRoot);
  const zip2 = await openZip(zipPath);
  try {
    await eachZipEntry(zip2, async (e) => {
      const parts = e.fileName.split('/').filter((p) => p && p !== '.');
      if (!parts.length || parts.includes('..')) return;
      const target = path.join(destRoot, ...parts.map(sanitizeUploadName));
      if (!target.startsWith(destRoot + path.sep)) return; // zip-slip guard
      if (e.fileName.endsWith('/')) {
        await fsp.mkdir(target, { recursive: true });
        return;
      }
      await fsp.mkdir(path.dirname(target), { recursive: true });
      const stream = await openEntryStream(zip2, e);
      await pipeline(stream, fs.createWriteStream(target));
      const d = e.getLastModDate();
      await fsp.utimes(target, d, d).catch(() => {});
    });
  } catch (e) {
    await fsp.rm(destRoot, { recursive: true, force: true });
    throw e;
  } finally {
    zip2.close();
    invalidateUsage(u);
  }
  res.json({ ok: true, folder: relOf(u, destRoot), usage: await getUsage(u) });
}));

// ---- Admin ----------------------------------------------------------------
const USERNAME_RE = /^[a-zA-Z0-9._-]{2,32}$/;
const gbToBytes = (gb) => {
  const n = Number(gb);
  if (!Number.isFinite(n) || n < 0) throw httpErr(400, 'Quota must be a number of GB (0 = unlimited)');
  return Math.round(n * 1024 ** 3);
};

app.get('/api/admin/users', auth({ admin: true }), wrap(async (req, res) => {
  const users = [];
  for (const u of db.users) users.push({ ...publicUser(u), usage: await getUsage(u) });
  let disk = null;
  try {
    const s = await fsp.statfs(STORAGE_DIR);
    disk = { total: s.blocks * s.bsize, free: s.bavail * s.bsize };
  } catch {}
  const allocated = db.users.reduce((a, u) => a + (u.quotaBytes || 0), 0);
  res.json({ users, disk, allocated, maxFileBytes: MAX_FILE_BYTES });
}));

app.post('/api/admin/users', auth({ admin: true }), wrap(async (req, res) => {
  const { username, password, quotaGB, isAdmin } = req.body || {};
  if (!USERNAME_RE.test(String(username || '')))
    throw httpErr(400, 'Username must be 2-32 characters: letters, numbers, dot, dash or underscore');
  if (findByName(username)) throw httpErr(409, 'That username is taken');
  if (String(password || '').length < 8) throw httpErr(400, 'Password must be at least 8 characters');
  const u = createUser({ username, password, isAdmin: !!isAdmin, quotaBytes: gbToBytes(quotaGB || 0) });
  res.json({ user: publicUser(u) });
}));

app.patch('/api/admin/users/:id', auth({ admin: true }), wrap(async (req, res) => {
  const u = findUser(req.params.id);
  if (!u) throw httpErr(404, 'User not found');
  const self = u.id === req.user.id;
  const b = req.body || {};
  if ('quotaGB' in b) u.quotaBytes = gbToBytes(b.quotaGB);
  if ('password' in b) {
    if (String(b.password).length < 8) throw httpErr(400, 'Password must be at least 8 characters');
    u.passwordHash = await bcrypt.hash(String(b.password), 12);
    u.mustChangePassword = !self && !!b.mustChangePassword;
    if (!self) u.sessionVersion++;
  }
  if ('disabled' in b) {
    if (self) throw httpErr(400, "You can't disable your own account");
    u.disabled = !!b.disabled;
    u.sessionVersion++;
  }
  if ('isAdmin' in b) {
    if (self) throw httpErr(400, "You can't change your own admin role");
    u.isAdmin = !!b.isAdmin;
  }
  saveDb();
  res.json({ user: publicUser(u) });
}));

app.delete('/api/admin/users/:id', auth({ admin: true }), wrap(async (req, res) => {
  const u = findUser(req.params.id);
  if (!u) throw httpErr(404, 'User not found');
  if (u.id === req.user.id) throw httpErr(400, "You can't delete your own account");
  db.users = db.users.filter((x) => x.id !== u.id);
  saveDb();
  await fsp.rm(userRoot(u), { recursive: true, force: true });
  usageCache.delete(u.id);
  res.json({ ok: true });
}));

// ---- Errors ---------------------------------------------------------------
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  if (res.headersSent) return res.destroy();
  res.removeHeader('Content-Disposition');
  res.status(status).json({ error: status >= 500 ? 'Server error' : err.message });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Backup server listening on http://${HOST}:${PORT}`);
  console.log(`Storage: ${STORAGE_DIR}  |  Max file size: ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB`);
});
// Large uploads/downloads can take a long time; don't cut them off.
server.requestTimeout = 0;
server.headersTimeout = 120 * 1000;
server.keepAliveTimeout = 65 * 1000;

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
