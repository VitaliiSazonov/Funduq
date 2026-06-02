/**
 * try_all_connection_formats.mjs
 * Tries every conceivable Supabase connection format.
 */

import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

function loadEnv(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const migEnv = loadEnv(join(__dirname, '..', '.env.migration'));
const localEnv = loadEnv(join(__dirname, '..', '.env.local'));

const SUPABASE_URL = localEnv['NEXT_PUBLIC_SUPABASE_URL'];
const JWT = migEnv['SUPABASE_SERVICE_ROLE_KEY'];
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const pg = require('pg');
const { Client } = pg;

// JWT URL-encoded
const jwtEncoded = encodeURIComponent(JWT);

// All connection strings to try
const configs = [
  // Session pooler - new format (IPv4 compatible)
  { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Session Pooler ap-south-1 (JWT pw)' },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Session Pooler eu-central-1 (JWT pw)' },
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Session Pooler us-east-1 (JWT pw)' },
  { host: 'aws-0-us-west-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Session Pooler us-west-1 (JWT pw)' },

  // Transaction pooler (port 6543)
  { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Txn Pooler ap-south-1:6543' },

  // Direct DB
  { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres', password: JWT, database: 'postgres', label: 'Direct DB (JWT pw)' },

  // Try with service_role as username
  { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432, user: 'service_role', password: JWT, database: 'postgres', label: 'Session Pooler (service_role user)' },

  // Try with different regions (Supabase Mumbai is aws-0-ap-south-1 but project might be on different region)
  { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Session Pooler ap-southeast-1' },
  { host: 'aws-0-ap-northeast-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: JWT, database: 'postgres', label: 'Session Pooler ap-northeast-1' },
];

async function tryConnect(cfg) {
  const client = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  
  try {
    await client.connect();
    const r = await client.query('SELECT current_user, current_database()');
    console.log(`✅ ${cfg.label}: user=${r.rows[0].current_user}, db=${r.rows[0].current_database}`);
    await client.end();
    return true;
  } catch (err) {
    const msg = err.message.split('\n')[0].slice(0, 100);
    console.log(`❌ ${cfg.label}: ${msg}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  console.log(`Testing ${configs.length} connection configurations...\n`);
  
  let connected = false;
  for (const cfg of configs) {
    const ok = await tryConnect(cfg);
    if (ok) {
      connected = true;
      break;
    }
  }
  
  if (!connected) {
    console.log('\n❌ All connection methods failed.');
    console.log('\nThis likely means:');
    console.log('1. The database password is NOT the service role JWT');
    console.log('2. Direct TCP access to Supabase DB is blocked by network');
    console.log('3. A personal access token (sbp_...) is required');
    console.log('\nTo proceed, you need one of:');
    console.log('a) The database password (from Supabase Dashboard → Settings → Database)');
    console.log('b) A personal access token (from Supabase Dashboard → Account → Tokens)');
    console.log('   Then set SUPABASE_ACCESS_TOKEN=sbp_... in .env.local');
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
