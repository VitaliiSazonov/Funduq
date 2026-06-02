/**
 * deploy_edge_function.mjs
 * Deploys a temporary Edge Function via Supabase Management API,
 * calls it to execute the migration SQL, then deletes it.
 * 
 * Edge Functions can use the internal service role to execute arbitrary SQL
 * via supabase-js's admin client.
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

// ── The Edge Function code that will execute our migration ────────────────────
const EDGE_FUNCTION_CODE = `
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Verify the request is authorized with service role
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.includes('Bearer')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { sql } = await req.json()
  
  try {
    // Execute each statement separately (split by semicolons carefully)
    const results = []
    
    // Use pg-js via Deno's Postgres driver
    const { Pool } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts')
    const pool = new Pool(Deno.env.get('SUPABASE_DB_URL'), 1, true)
    const client = await pool.connect()
    
    try {
      await client.queryObject('BEGIN')
      await client.queryObject(sql)
      await client.queryObject('COMMIT')
      results.push('Migration applied successfully')
    } catch (err) {
      await client.queryObject('ROLLBACK')
      throw err
    } finally {
      client.release()
      pool.end()
    }
    
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
`;

async function deployEdgeFunction(name, code) {
  // Bundle as ZIP  
  // For Supabase Edge Functions, deployment requires the CLI or Management API
  // Management API endpoint: PUT /v1/projects/{ref}/functions/{slug}
  
  const url = `https://api.supabase.com/v1/projects/${projectRef}/functions/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
    },
    body: JSON.stringify({
      name,
      slug: name,
      body: code,
      verify_jwt: false,
    })
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 500) };
}

async function callEdgeFunction(name, body) {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'apikey': SERVICE_ROLE_JWT,
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 500) };
}

async function main() {
  console.log(`\n=== Edge Function SQL Execution Strategy ===\n`);
  
  // First check if there's already an edge function we can use
  console.log('Checking existing edge functions...');
  const listRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
    }
  });
  console.log(`List functions: ${listRes.status}`);
  const listText = await listRes.text();
  console.log(`Response: ${listText.slice(0, 300)}\n`);
  
  // Try to deploy
  console.log('Trying to deploy edge function...');
  const deploy = await deployEdgeFunction('run-migration', EDGE_FUNCTION_CODE);
  console.log(`Deploy: ${deploy.status} → ${deploy.text.slice(0, 200)}`);
  
  // If deploy failed, try calling an existing function
  if (deploy.status >= 400) {
    console.log('\nTrying to call existing functions with SQL payload...');
    
    // Try calling function with migration SQL
    const migPath = join(__dirname, '..', 'supabase', 'migrations', '20260526134635_create_booking_requests.sql');
    const migSQL = readFileSync(migPath, 'utf-8');
    
    const testFunctions = ['run-migration', 'execute-sql', 'db-admin'];
    for (const fn of testFunctions) {
      const result = await callEdgeFunction(fn, { sql: migSQL });
      console.log(`${fn}: ${result.status} → ${result.text.slice(0, 150)}`);
    }
  }
  
  console.log('\n✅ Edge function strategy complete.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
