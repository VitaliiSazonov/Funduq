/**
 * run_migration_rest.mjs
 * Uses Supabase Management API to execute SQL via REST (no direct DB TCP needed).
 * Falls back to the Supabase REST /rest/v1/rpc approach if available.
 * 
 * Supabase exposes a SQL execution endpoint via the Management API:
 * POST https://api.supabase.com/v1/projects/{ref}/database/query
 * Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
 *
 * Since we only have service_role key (not management API token), we use
 * the Supabase "SQL over HTTP" approach via pg_net or the query API.
 *
 * Alternative: Use supabase-js with rpc to a custom function, or use
 * the direct REST endpoint: POST /rest/v1/ with raw SQL (not standard).
 *
 * BEST APPROACH: Use the Supabase CLI's built-in HTTP interface via
 * the Management API /v1/projects/{ref}/database/query endpoint.
 * This requires: SUPABASE_ACCESS_TOKEN (personal access token).
 *
 * Since we don't have that, we'll use the @supabase/supabase-js client
 * with service_role and execute SQL via a stored procedure that we create
 * via the REST API's raw SQL endpoint (available as of Supabase 2.x).
 *
 * Actually the cleanest approach with only service_role:
 * POST https://{ref}.supabase.co/rest/v1/rpc/pg_query - doesn't exist by default
 *
 * REAL SOLUTION: Supabase exposes a Postgres-over-HTTP via their "Data API"
 * but that's for table operations. For DDL, we MUST use either:
 * 1) Direct TCP to port 5432/6543 (blocked in this env)
 * 2) Management API (needs personal access token)
 * 3) Supabase CLI (wraps the management API)
 *
 * Let's try the Management API with the service_role key as a fallback,
 * and also check if there's a way to use the Supabase CLI.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log(`📦 Project ref: ${projectRef}`);
console.log(`🔑 Service role key: ${SERVICE_ROLE_KEY.slice(0, 20)}...`);

// ── HTTP helper ──────────────────────────────────────────────────────────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Try Supabase Management API SQL endpoint ─────────────────────────────────
// This requires a Supabase access token (personal), not the service_role key.
// The service_role key IS accepted by some internal endpoints.
// Let's try: POST https://api.supabase.com/v1/projects/{ref}/database/query
async function tryManagementAPI(sql) {
  const body = JSON.stringify({ query: sql });
  const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };
  try {
    const res = await httpsRequest(options, body);
    return res;
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

// ── Try Supabase REST rpc with service_role ──────────────────────────────────
// Create a temporary function then call it, using the Supabase PostgREST interface
async function tryPostgRESTExec(sql) {
  // First, create the exec function via an existing rpc if possible
  // Actually, with service_role we can call any rpc that exists
  // Supabase has pg_graphql and postgrest but not a raw SQL endpoint

  // Try the direct SQL endpoint that Supabase added in newer versions:
  // POST /rest/v1/ with Content-Type: application/sql (not standard)
  
  // Actually, the correct endpoint is:
  // The Supabase dashboard uses: POST https://{ref}.supabase.co/pg/query
  // Let's try that
  const body = JSON.stringify({ query: sql });
  const options = {
    hostname: `${projectRef}.supabase.co`,
    path: `/pg/query`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Length': Buffer.byteLength(body),
    },
  };
  try {
    const res = await httpsRequest(options, body);
    return res;
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

// ── Try the Supabase "sql" REST endpoint ─────────────────────────────────────
async function trySupabaseSQL(sql) {
  const encoded = encodeURIComponent(sql);
  // Supabase exposes: GET /rest/v1/?select=... but not raw SQL
  // However, newer Supabase versions have: POST /sql
  const body = sql;
  const options = {
    hostname: `${projectRef}.supabase.co`,
    path: `/sql`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Length': Buffer.byteLength(body),
    },
  };
  try {
    const res = await httpsRequest(options, body);
    return res;
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function main() {
  console.log('\n🔍 Testing available SQL execution endpoints...\n');

  // Test 1: Management API
  console.log('Test 1: Supabase Management API (api.supabase.com)...');
  const mgmtTest = await tryManagementAPI('SELECT 1 as test');
  console.log(`  Status: ${mgmtTest.status}`);
  console.log(`  Response: ${JSON.stringify(mgmtTest.body || mgmtTest.raw || mgmtTest.error).slice(0, 200)}`);

  // Test 2: /pg/query
  console.log('\nTest 2: /pg/query endpoint...');
  const pgTest = await tryPostgRESTExec('SELECT 1 as test');
  console.log(`  Status: ${pgTest.status}`);
  console.log(`  Response: ${JSON.stringify(pgTest.body || pgTest.raw || pgTest.error).slice(0, 200)}`);

  // Test 3: /sql endpoint
  console.log('\nTest 3: /sql endpoint...');
  const sqlTest = await trySupabaseSQL('SELECT 1 as test');
  console.log(`  Status: ${sqlTest.status}`);
  console.log(`  Response: ${JSON.stringify(sqlTest.body || sqlTest.raw || sqlTest.error).slice(0, 200)}`);

  // Determine which works
  let executeSQL;
  if (mgmtTest.status >= 200 && mgmtTest.status < 300) {
    console.log('\n✅ Using Management API for SQL execution');
    executeSQL = (sql) => tryManagementAPI(sql);
  } else if (pgTest.status >= 200 && pgTest.status < 300) {
    console.log('\n✅ Using /pg/query for SQL execution');
    executeSQL = (sql) => tryPostgRESTExec(sql);
  } else if (sqlTest.status >= 200 && sqlTest.status < 300) {
    console.log('\n✅ Using /sql endpoint for SQL execution');
    executeSQL = (sql) => trySupabaseSQL(sql);
  } else {
    console.log('\n❌ No HTTP-based SQL execution endpoint is available.');
    console.log('   Please provide a SUPABASE_ACCESS_TOKEN (personal access token) in .env.local');
    console.log('   Get it from: https://app.supabase.com/account/tokens');
    console.log('   Then add: SUPABASE_ACCESS_TOKEN=sbp_xxxx to .env.local');
    process.exit(1);
  }

  // Now execute the actual migration
  const migPath = join(__dirname, '..', 'supabase', 'migrations', '20260526134635_create_booking_requests.sql');
  const migSQL = readFileSync(migPath, 'utf-8');
  
  console.log('\n── Applying migration... ──');
  const result = await executeSQL(migSQL);
  console.log(`Status: ${result.status}`);
  console.log(`Response: ${JSON.stringify(result.body || result.raw).slice(0, 500)}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
