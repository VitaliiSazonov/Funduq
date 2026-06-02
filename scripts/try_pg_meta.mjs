/**
 * try_pg_meta.mjs
 * Tries various pg-meta and internal Supabase API endpoints to execute SQL.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function tryPost(url, body, headers = {}) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
        'apikey': SERVICE_ROLE_JWT,
        ...headers
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, text: text.slice(0, 400) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function tryGet(url, headers = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
        'apikey': SERVICE_ROLE_JWT,
        ...headers
      }
    });
    const text = await res.text();
    return { status: res.status, text: text.slice(0, 400) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function main() {
  console.log(`Testing pg-meta and internal endpoints for ${projectRef}\n`);

  const testSQL = "SELECT to_regclass('public.booking_requests') as r";
  const testBody = { query: testSQL };

  const endpoints = [
    // Standard REST
    [`${SUPABASE_URL}/rest/v1/rpc/is_admin`, {}],
    
    // pg-meta style paths
    [`${SUPABASE_URL}/pg/query`, testBody],
    [`${SUPABASE_URL}/meta/query`, testBody],
    [`${SUPABASE_URL}/query`, testBody],
    [`${SUPABASE_URL}/sql`, testSQL],

    // Supabase Studio API paths
    [`https://api.supabase.com/v1/projects/${projectRef}/database/query`, testBody],
    [`https://api.supabase.io/v1/projects/${projectRef}/database/query`, testBody],
    
    // Internal paths
    [`${SUPABASE_URL}/api/pg-meta/query`, testBody],
    [`${SUPABASE_URL}/functions/v1/db-query`, testBody],
    
    // Supabase Edge Functions (if deployed)
    [`${SUPABASE_URL}/functions/v1/execute-sql`, testBody],
  ];

  for (const [url, body] of endpoints) {
    const r = await tryPost(url, body);
    console.log(`POST ${url.replace(SUPABASE_URL, '').replace('https://api.supabase.com', '[mgmt]').slice(0, 60)}`);
    console.log(`  → ${r.status}: ${(r.text || r.error || '').slice(0, 150)}\n`);
  }

  // Special: try Supabase's new SQL API (introduced in newer versions)
  // POST /rest/v1/ with Content-Type: application/sql
  console.log('Testing SQL Content-Type endpoint...');
  const sqlEndpoint = await tryPost(`${SUPABASE_URL}/rest/v1/`, testSQL, {
    'Content-Type': 'application/sql',
    'Accept': 'application/json',
  });
  console.log(`POST /rest/v1/ (application/sql) → ${sqlEndpoint.status}: ${sqlEndpoint.text || sqlEndpoint.error}`);

  // Try via PostgREST's table api with a SECURITY DEFINER view or function
  // Create a function via a known pattern - use PostgREST's OpenAPI spec
  console.log('\nChecking if we can reach the database via supabase-js package...');
  
  // Try importing supabase-js (it's in dependencies)
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_JWT, {
      auth: { persistSession: false }
    });
    
    // Try calling is_admin (which should return false since we're not authenticated as a user)
    const { data, error } = await supabase.rpc('is_admin');
    console.log(`supabase.rpc('is_admin'): data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
    
    // Try executing SQL via the rpc mechanism with a raw query approach
    // Check: can we use the "Query" approach?
    
    // Try: supabase.from('booking_requests').select (should fail with 404 since table doesn't exist)
    const { data: d2, error: e2 } = await supabase.from('booking_requests').select('*').limit(1);
    console.log(`from('booking_requests'): data=${JSON.stringify(d2)}, error=${JSON.stringify(e2)}`);
    
  } catch (importErr) {
    console.log(`supabase-js import error: ${importErr.message}`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
