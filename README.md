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
  download any folder as .zip, rename, move, delete, bulk select.
  Preview images, video, audio, PDFs and text files in the browser.
- **Zips**: browse inside a zip like folders (reads only the zip index, so even
  very large zips open instantly), preview or download single files from inside,
  extract into a folder (quota-checked, zip-slip protected).
- **Limits**: 10 GB per file by default (`MAX_FILE_SIZE_MB`); uploads that would
  exceed the user's limit are rejected.

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

## Forgot the admin password?

```bash
node scripts/reset-password.js admin 'new-password-here'
pm2 restart backup-server
```

## Backing up the backups

Everything lives in `data/` and `storage/` — copy those two folders to move or
back up the whole server.
