/**
 * try_new_key_format.mjs
 * Tests if the new sb_secret_ format key works with any Supabase APIs.
 * Also tries to find SUPABASE_DB_URL or any direct connection info.
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

const localEnv = loadEnv(join(__dirname, '..', '.env.local'));
const migEnv = loadEnv(join(__dirname, '..', '.env.migration'));

const SUPABASE_URL = localEnv['NEXT_PUBLIC_SUPABASE_URL'];
const NEW_KEY = localEnv['SUPABASE_SERVICE_ROLE_KEY']; // sb_secret_ format
const JWT_KEY = migEnv['SUPABASE_SERVICE_ROLE_KEY'];   // JWT format
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log(`URL: ${SUPABASE_URL}`);
console.log(`New key: ${NEW_KEY.slice(0, 25)}...`);
console.log(`JWT key: ${JWT_KEY.slice(0, 25)}...\n`);

async function testKey(key, label, path, body = null) {
  const method = body ? 'POST' : 'GET';
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    }
  };
  if (body) opts.body = JSON.stringify(body);
  
  const url = `${SUPABASE_URL}${path}`;
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(`[${label}] ${method} ${path}: ${res.status} → ${text.slice(0, 200)}`);
    return { status: res.status, text };
  } catch (e) {
    console.log(`[${label}] ${path}: ERROR ${e.message}`);
    return { status: 0, error: e.message };
  }
}

async function testMgmtKey(key, label) {
  const opts = {
    headers: {
      'Authorization': `Bearer ${key}`,
    }
  };
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects`, opts);
    const text = await res.text();
    console.log(`[${label}] mgmt API /v1/projects: ${res.status} → ${text.slice(0, 200)}`);
    return { status: res.status, text };
  } catch (e) {
    console.log(`[${label}] mgmt API: ERROR ${e.message}`);
    return { status: 0 };
  }
}

async function main() {
  console.log('=== Testing both key formats ===\n');
  
  // Test REST API with both keys
  await testKey(NEW_KEY, 'sb_secret', '/rest/v1/profiles?select=role&limit=1');
  await testKey(JWT_KEY, 'JWT', '/rest/v1/profiles?select=role&limit=1');
  
  console.log('');
  
  // Test Management API with both keys
  await testMgmtKey(NEW_KEY, 'sb_secret');
  await testMgmtKey(JWT_KEY, 'JWT');
  
  console.log('\n=== Testing new Supabase API format ===\n');
  
  // The new sb_secret format might work with a different auth pattern
  // Try bearer + new key format with various endpoints
  
  // Check if the new key can be used as personal access token
  const sbpFormatTest = await fetch('https://api.supabase.com/v1/projects', {
    headers: { 'Authorization': `Bearer ${NEW_KEY}` }
  });
  console.log(`/v1/projects with sb_secret key: ${sbpFormatTest.status} → ${(await sbpFormatTest.text()).slice(0, 200)}`);
  
  // Try with apikey header
  const apiKeyTest = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
    headers: {
      'Authorization': `Bearer ${NEW_KEY}`,
      'x-supabase-api-key': NEW_KEY,
    }
  });
  console.log(`/v1/projects/${projectRef} with x-supabase-api-key: ${apiKeyTest.status} → ${(await apiKeyTest.text()).slice(0, 200)}`);
  
  // Try the Supabase Dashboard's internal API  
  const dashboardTest = await fetch(`https://supabase.com/dashboard/api/projects/${projectRef}`, {
    headers: { 'Authorization': `Bearer ${NEW_KEY}` }
  });
  console.log(`dashboard API: ${dashboardTest.status}`);
  
  console.log('\n=== Testing Supabase API with Management API ===');
  // Try the new API base URL
  const newApiTest = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NEW_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'SELECT 1 as ok' })
  });
  console.log(`/v1/projects/.../database/query with sb_secret: ${newApiTest.status} → ${(await newApiTest.text()).slice(0, 300)}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
