# Backup Storage Server

Private file storage with admin user management, per-user storage limits,
file/folder management and in-browser `.zip` viewing. No database server and no
native modules — users live in `data/users.json`, files in `storage/<user-id>/`.

## Install on the VPS

```bash
# Node 18.15+ required (20 or 22 LTS recommended)
cd /opt && unzip backup-server.zip && cd backup-server
npm install --omit=dev
pm2 start ecosystem.config.js
pm2 logs backup-server --lines 20   # shows the generated admin password
pm2 save && pm2 startup             # survive reboots
```

Open `http://YOUR-VPS-IP:3005`, log in as `admin` with the password from the log,
and you'll be asked to choose a new one. Then go to **Admin → Add a user**.

If a firewall is on: `sudo ufw allow 3005/tcp`.

## Features

- **Admin**: create users, set storage limit per user (GB, 0 = unlimited), reset
  passwords (optionally forcing a change at next login), disable/enable, grant admin,
  delete user + files. Shows disk free space and total quota allocated.
- **Files**: folders, multi-file upload with progress, drag & drop, download,
  download any folder as .zip, rename, move, delete, bulk select. List or grid
  view (with image thumbnails), sortable columns, per-folder filter, and
  file-type icons. The view and sort choice are remembered in the browser.
- **Previews**: images, video, audio, PDFs (in-page viewer) and text files, plus
  **Word (.docx)** and **Excel / OpenDocument (.xlsx .xlsm .xlsb .xls .ods)**.
  Office files are converted on the server in a memory- and time-limited worker
  thread and shown read-only: Word as sanitized HTML in a script-less sandboxed
  frame, spreadsheets as a table (first 1,000 rows / 60 columns of each visible
  sheet). Files over 30 MB (docx) / 25 MB (xlsx) or that expand to too much data
  are refused with a prompt to download instead.
- **Zips**: browse inside a zip like folders (reads only the zip index, so even
  very large zips open instantly), preview or download single files from inside,
  **extract a single file** (next to the zip, or into any folder you pick), or
  extract the whole archive into a folder (quota-checked, zip-slip protected).
- **Sharing**: every file has a **Share…** action that creates a public download
  link like `https://files.faberquintero.com/s/<random token>`. Each link is unique
  (256-bit random token), can have an optional **passcode** that visitors must enter
  first, and can be switched off at any time. A link always opens a landing page
  with the file's icon, name, size and a Download button. You can create several
  links per file (e.g. a different passcode per person). Links follow the file when
  it is renamed or moved, and stop working when it is deleted. See
  [Public share links](#public-share-links-filesfaberquinterocom).
- **Languages**: English and Spanish. The language is auto-detected from the
  browser on first visit; switching it (EN/ES in the header, or on the login
  page) is saved per user on the server, so it follows them to other browsers.
  To add a language: add its strings to `public/i18n.js` and its code to
  `LANGS` in `server.js`.
- **Limits**: 10 GB per file by default (`MAX_FILE_SIZE_MB`); uploads that would
  exceed the user's limit are rejected.

## Updating

```bash
git pull
npm install --omit=dev      # picks up new dependencies (mammoth, xlsx)
pm2 restart backup-server --update-env
```

`xlsx` (SheetJS) is installed from `cdn.sheetjs.com`, which is where its
maintained releases are published (the npm registry copy is outdated), so the
server needs outbound HTTPS access to it during `npm install`.

## Configuration (ecosystem.config.js → env)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 3005 | |
| `HOST` | 0.0.0.0 | Use `127.0.0.1` behind a reverse proxy |
| `MAX_FILE_SIZE_MB` | 10240 | Max size of a single uploaded file |
| `STORAGE_DIR` | ./storage | Where files are kept |
| `DATA_DIR` | ./data | users.json + session secret |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | admin / random | Only used on very first start |
| `COOKIE_SECURE` | false | Set `true` when served over HTTPS |
| `TRUST_PROXY` | false | Set `true` behind nginx/caddy |
| `SESSION_DAYS` | 14 | How long a login lasts |
| `SHARE_BASE_URL` | https://files.faberquintero.com | Public address used to build share links; the host part is the "share host" (see below) |

After changing: `pm2 restart backup-server --update-env`

## HTTPS (strongly recommended)

Over plain `http://IP:3005` passwords and files travel unencrypted. Easiest fix
with a domain pointing at the VPS is Caddy:

```
files.example.com {
    reverse_proxy 127.0.0.1:3005
}
```

or nginx:

```nginx
server {
    server_name files.example.com;
    client_max_body_size 0;          # no nginx upload limit (the app enforces its own)
    proxy_request_buffering off;     # stream uploads straight through
    proxy_buffering off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then set `HOST=127.0.0.1`, `COOKIE_SECURE=true`, `TRUST_PROXY=true` and restart.
Without `client_max_body_size 0`, nginx will reject anything over 1 MB.

## Public share links (files.faberquintero.com)

Share links live on a second subdomain that points at the **same app**:

1. DNS: add an `A` record for `files.faberquintero.com` pointing at the VPS.
2. Proxy: add a second site that forwards to the app, **keeping the `Host` header**
   (the app uses it to recognise the share host). With Caddy:

   ```
   files.faberquintero.com {
       reverse_proxy 127.0.0.1:3005
   }
   ```

   or nginx (plus a certificate, e.g. `certbot --nginx -d files.faberquintero.com`):

   ```nginx
   server {
       server_name files.faberquintero.com;
       client_max_body_size 16k;        # nothing is uploaded through this host
       proxy_buffering off;             # stream big downloads straight through
       proxy_read_timeout 3600s;
       proxy_send_timeout 3600s;
       location / {
           proxy_pass http://127.0.0.1:3005;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Make sure `TRUST_PROXY=true` and `COOKIE_SECURE=true` are set (so passcode lockouts
   count real visitor IPs and the unlock cookie is HTTPS-only), then
   `pm2 restart backup-server --update-env`.

On the share host the app serves **only** `/s/*`: the login page, API and app files
return 404 there, so recipients never see (or can probe) the rest of the app. To use a
different domain, set `SHARE_BASE_URL`.

How the links behave:

- Open a link: landing page with icon, name, size and a Download button. With a passcode
  set, visitors see only a passcode prompt (no file name) until it is entered; that
  unlocks the link in their browser for 12 hours. Changing or removing the passcode
  locks everyone out again immediately.
- 10 wrong passcodes from one visitor (or 50 for one link) lock that link's passcode
  form for 15 minutes.
- Passcodes are stored only as bcrypt hashes, so they can't be shown again later;
  set a new one if you forget it. Passcodes are 4-72 characters.
- Unknown, removed and switched-off links all show the same "not available" page.
  Downloads are never cached by proxies/CDNs.
- Links are kept in `data/shares.json` (included in the "back up `data/` and `storage/`"
  advice below). Disabling a user makes their links unavailable; deleting a user
  deletes their links.

## Forgot the admin password?

```bash
node scripts/reset-password.js admin 'new-password-here'
pm2 restart backup-server
```

## Backing up the backups

Everything lives in `data/` and `storage/` — copy those two folders to move or
back up the whole server.
