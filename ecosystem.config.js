// pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backup-server',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,            // keep at 1: users and sessions live in this process
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      kill_timeout: 6000,
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        HOST: '0.0.0.0',             // use 127.0.0.1 if you put nginx/caddy in front
        MAX_FILE_SIZE_MB: 10240,     // per-file upload limit (10 GB)
        // STORAGE_DIR: '/srv/backups',  // where files are stored (default: ./storage)
        // DATA_DIR: '/srv/backup-data', // users.json + session secret (default: ./data)
        // ADMIN_USERNAME: 'krijn',      // only used on first start
        COOKIE_SECURE: 'false',      // set 'true' once you serve it over HTTPS
        TRUST_PROXY: 'false',        // set 'true' when behind nginx/caddy
        SHARE_BASE_URL: 'https://files.faberquintero.com', // public share links: <this>/s/<token> (this host serves ONLY /s/*)
      },
    },
  ],
};
