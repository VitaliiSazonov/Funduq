/**
 * discover_rpcs.mjs
 * Discovers what PostgreSQL functions are available via PostgREST RPC.
 * Then tries to execute SQL through any DDL-capable function.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const SERVICE_ROLE_JWT = migEnv['SUPABASE_SERVICE_ROLE_KEY'];
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function rpc(funcName, params = {}, preferSingle = false) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
    'apikey': SERVICE_ROLE_JWT,
  };
  if (preferSingle) headers['Prefer'] = 'return=representation';

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, raw: text };
}

async function get(path) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'apikey': SERVICE_ROLE_JWT,
    }
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

// ── Try all known Supabase internal functions ─────────────────────────────────
async function main() {
  console.log(`🔍 Discovering RPC functions for ${projectRef}...\n`);

  // Check Swagger spec for available RPCs
  const swagger = await get('/rest/v1/');
  const swaggerBody = swagger.body;
  
  // Parse paths from swagger to find RPC functions
  let rpcFunctions = [];
  if (swaggerBody && swaggerBody.paths) {
    rpcFunctions = Object.keys(swaggerBody.paths)
      .filter(p => p.startsWith('/rpc/'))
      .map(p => p.replace('/rpc/', ''));
  }
  
  console.log(`Found ${rpcFunctions.length} RPC functions in swagger:`);
  rpcFunctions.forEach(f => console.log(`  - ${f}`));

  // Try calling known utility functions
  console.log('\n\n🔵 Testing RPC calls...');
  
  // Try is_admin()
  const isAdmin = await rpc('is_admin');
  console.log(`is_admin(): ${isAdmin.status} → ${JSON.stringify(isAdmin.body)}`);

  // Try recalculate_popularity_scores()
  const scores = await rpc('recalculate_popularity_scores');
  console.log(`recalculate_popularity_scores(): ${scores.status} → ${JSON.stringify(scores.body).slice(0, 100)}`);

  // Try to call a non-existent function to check error format
  const dummy = await rpc('exec_sql_unsafe', { query: 'SELECT 1' });
  console.log(`exec_sql_unsafe: ${dummy.status} → ${JSON.stringify(dummy.body).slice(0, 100)}`);

  // Check what constraints profiles has by reading system tables via an rpc
  // Try: select from information_schema via PostgREST table access
  const infoSchema = await get('/rest/v1/information_schema?select=*&table_name=eq.profiles&limit=1');
  console.log(`\ninfo_schema query (${infoSchema.status}): ${JSON.stringify(infoSchema.body).slice(0, 200)}`);

  // Check if pg_meta is exposed
  const pgMeta = await get('/pg/tables?schema=public');
  console.log(`pg_meta tables (${pgMeta.status}): ${JSON.stringify(pgMeta.body).slice(0, 200)}`);

  // NEW: Try Supabase's internal dashboard API
  const dashboardSQL = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'apikey': SERVICE_ROLE_JWT,
    },
    body: JSON.stringify({ query: 'SELECT to_regclass(\'public.booking_requests\') as r' })
  });
  const dashText = await dashboardSQL.text();
  console.log(`\npg/query (${dashboardSQL.status}): ${dashText.slice(0, 200)}`);

  // Try Supabase CLI db remote commit approach
  console.log('\n\n🔵 Checking Supabase CLI installation...');
  try {
    // Check if supabase is globally installed
    const ver1 = execSync('supabase --version 2>&1', { encoding: 'utf-8', shell: 'cmd.exe', timeout: 5000 });
    console.log(`  Supabase CLI (global): ${ver1.trim()}`);
  } catch (e) {
    console.log(`  Global Supabase CLI: not found`);
  }

  // Check npx supabase  
  const cliPath = join(__dirname, '..', 'node_modules', '.bin', 'supabase');
  if (existsSync(cliPath) || existsSync(cliPath + '.cmd')) {
    console.log(`  Local Supabase CLI found: ${cliPath}`);
  } else {
    console.log(`  Local Supabase CLI: not in node_modules`);
  }

  // Check scripts dir
  const scriptsDir = join(__dirname, '..', 'node_modules', 'supabase');
  console.log(`  node_modules/supabase exists: ${existsSync(scriptsDir)}`);

  console.log('\n✅ Discovery complete.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
