#!/usr/bin/env node
// Usage: node scripts/reset-password.js <username> <new-password>
// Then: pm2 restart backup-server
'use strict';
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 8) {
  console.error('Usage: node scripts/reset-password.js <username> <new-password (min 8 chars)>');
  process.exit(1);
}
const file = path.join(path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data')), 'users.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const u = db.users.find((x) => x.username.toLowerCase() === username.toLowerCase());
if (!u) {
  console.error(`No user "${username}". Existing: ${db.users.map((x) => x.username).join(', ')}`);
  process.exit(1);
}
u.passwordHash = bcrypt.hashSync(password, 12);
u.disabled = false;
u.mustChangePassword = false;
u.sessionVersion = (u.sessionVersion || 1) + 1;
fs.writeFileSync(file, JSON.stringify(db, null, 2), { mode: 0o600 });
console.log(`Password for "${u.username}" updated. Now run: pm2 restart backup-server`);
