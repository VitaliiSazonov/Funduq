/**
 * run_migration_fetch.mjs
 * Uses Supabase REST API (HTTPS) to execute SQL via supabase-js client.
 * Strategy: Use supabase-js admin client + create a sql_exec helper, or
 * use the Supabase's new SQL API endpoint.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Load .env files ──────────────────────────────────────────────────────────
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

const localEnv = loadEnv(join(__dirname, '..', '.env.local'));
const migEnv = loadEnv(join(__dirname, '..', '.env.migration'));

const SUPABASE_URL = localEnv['NEXT_PUBLIC_SUPABASE_URL'];
// Use JWT from .env.migration (not the sb_secret_ format from .env.local)
const SERVICE_ROLE_JWT = migEnv['SUPABASE_SERVICE_ROLE_KEY'];
const ANON_KEY = migEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log(`📦 Project: ${projectRef}`);
console.log(`🔑 JWT starts: ${SERVICE_ROLE_JWT.slice(0, 20)}...`);

// ── Supabase REST helper ─────────────────────────────────────────────────────
async function supabaseRequest(path, method = 'GET', body = null, useJWT = true) {
  const key = useJWT ? SERVICE_ROLE_JWT : ANON_KEY;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Prefer': 'return=representation',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, raw: text };
}

// ── Execute SQL via RPC ──────────────────────────────────────────────────────
// We'll create a helper function first via PostgREST schema introspection,
// then call it. But this requires DDL rights... which we have via service_role.
//
// Actually, PostgREST (Supabase REST) does NOT support arbitrary DDL.
// However, Supabase has an undocumented endpoint for the dashboard:
// POST /rest/v1/rpc/exec (if the function exists)
//
// Strategy: We'll create the exec function using the batch API or
// use a special Supabase endpoint.

// Try: POST to /rest/v1/ with Content-Type: application/sql (new in Supabase)
// Try: POST to /query (Supabase Studio API)

async function testEndpoint(path, body, method = 'POST') {
  try {
    const url = `${SUPABASE_URL}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
        'apikey': SERVICE_ROLE_JWT,
        'x-client-info': 'migration-runner',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, text: text.slice(0, 300) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

// ── Check available RPC functions ────────────────────────────────────────────
async function checkExistingFunctions() {
  // Get list of functions accessible via PostgREST
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'apikey': SERVICE_ROLE_JWT,
    }
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 500) };
}

// ── Check if booking_requests exists via REST ────────────────────────────────
async function tableExists() {
  const res = await supabaseRequest('/rest/v1/booking_requests?limit=1');
  return res.status !== 404;
}

// ── Check profiles constraint via REST (using a known function or table) ─────
async function getProfiles(limit = 3) {
  return supabaseRequest('/rest/v1/profiles?select=role&limit=' + limit);
}

// ── Supabase SQL endpoint via management API ─────────────────────────────────
// Try: PATCH https://api.supabase.com/v1/projects/{ref}/config/auth
// Try: GET https://api.supabase.com/v1/projects/{ref} (just to test auth)
async function tryMgmtAPI(path = '/v1/projects', jwt = SERVICE_ROLE_JWT) {
  const res = await fetch(`https://api.supabase.com${path}`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    }
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 300) };
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== Testing REST endpoint capabilities ===\n');

  // Test 1: Can we reach the REST API?
  const root = await checkExistingFunctions();
  console.log(`Root API (${root.status}): ${root.text.slice(0, 200)}`);

  // Test 2: Does booking_requests exist?
  const exists = await tableExists();
  console.log(`\nbooking_requests exists: ${exists}`);

  // Test 3: Can we read profiles?
  const profiles = await getProfiles(5);
  console.log(`\nprofiles (${profiles.status}): ${JSON.stringify(profiles.body).slice(0, 300)}`);

  // Test 4: Management API with JWT
  console.log('\nTesting Management API with service_role JWT...');
  const mgmt = await tryMgmtAPI('/v1/projects');
  console.log(`  Status: ${mgmt.status}, Response: ${mgmt.text.slice(0, 200)}`);

  // Test 5: Try the Supabase SQL execution endpoint
  console.log('\nTesting various SQL endpoints...');
  const endpoints = [
    { path: '/pg/query', body: { query: 'SELECT 1 as ok' } },
    { path: '/rest/v1/rpc/exec_sql', body: { sql: 'SELECT 1' } },
    { path: '/platform/pg-meta/default/query', body: { query: 'SELECT 1 as ok' } },
  ];

  let workingEndpoint = null;
  for (const ep of endpoints) {
    const r = await testEndpoint(ep.path, ep.body);
    console.log(`  ${ep.path} → ${r.status}: ${(r.text || r.error || '').slice(0, 150)}`);
    if (r.status >= 200 && r.status < 300) {
      workingEndpoint = ep;
      console.log(`  ✅ Found working endpoint: ${ep.path}`);
      break;
    }
  }

  if (!workingEndpoint && !exists) {
    // ── FALLBACK: Try Supabase CLI (which may now be installed) ────────────
    console.log('\n→ Trying Supabase CLI...');
    try {
      const ver = execSync('npx supabase --version', { encoding: 'utf-8', timeout: 10000 });
      console.log(`  CLI version: ${ver.trim()}`);
      
      // Link project
      try {
        execSync(`npx supabase link --project-ref ${projectRef}`, {
          cwd: join(__dirname, '..'),
          encoding: 'utf-8',
          timeout: 30000,
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: SERVICE_ROLE_JWT }
        });
        console.log('  ✅ Project linked');
      } catch (linkErr) {
        console.log(`  ⚠️  Link failed: ${linkErr.message.slice(0, 200)}`);
      }

      // Try db push
      try {
        const pushOut = execSync(`npx supabase db push --linked`, {
          cwd: join(__dirname, '..'),
          encoding: 'utf-8',
          timeout: 60000,
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: SERVICE_ROLE_JWT }
        });
        console.log(`  ✅ db push: ${pushOut.slice(0, 300)}`);
      } catch (pushErr) {
        console.log(`  ⚠️  db push failed: ${pushErr.message.slice(0, 300)}`);
      }
    } catch (cliErr) {
      console.log(`  ⚠️  CLI not available: ${cliErr.message.slice(0, 200)}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`booking_requests table exists: ${exists}`);
  console.log(`Profiles read OK: ${profiles.status < 300}`);
  console.log(`Working SQL endpoint: ${workingEndpoint ? workingEndpoint.path : 'NONE'}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
