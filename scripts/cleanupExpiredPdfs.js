// scripts/cleanupExpiredPdfs.js
// Deletes PDFs in /public/pdfs that do not have a matching active session in MongoDB (expired sessions are auto-removed by TTL)

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Session = require('../models/Session').default;

const PDF_DIR = path.join(__dirname, '../public/pdfs');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  const activeSessions = await Session.find({}, 'sessionCode');
  const activeCodes = new Set(activeSessions.map(s => s.sessionCode));

  const files = await fs.readdir(PDF_DIR);
  let deleted = 0;
  for (const file of files) {
    if (!file.endsWith('.pdf')) continue;
    const code = file.replace(/\.pdf$/, '');
    if (!activeCodes.has(code)) {
      await fs.unlink(path.join(PDF_DIR, file));
      deleted++;
    }
  }
  await mongoose.disconnect();
  console.log(`Cleanup complete. Deleted ${deleted} expired PDFs.`);
}

main().catch(e => { console.error(e); process.exit(1); });
