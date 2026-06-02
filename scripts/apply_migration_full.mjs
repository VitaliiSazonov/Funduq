/**
 * apply_migration_full.mjs
 * Comprehensive migration runner with ALL possible connection strategies:
 *
 * Priority order:
 * 1. npx supabase db query --linked (Management API, needs sbp_ token)
 * 2. npx supabase db query --db-url with session pooler
 * 3. Direct pg TCP connections (multiple regions/formats)
 * 4. REST API workaround via existing RPC functions
 *
 * Handles all post-migration tasks (profiles.role fix, production SQL update, git).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync, spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const ROOT = join(__dirname, '..');

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

const localEnv = loadEnv(join(ROOT, '.env.local'));
const migEnv = loadEnv(join(ROOT, '.env.migration'));

const SUPABASE_URL = localEnv['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_JWT = migEnv['SUPABASE_SERVICE_ROLE_KEY'];  // full JWT
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

// ── Read migration SQL ───────────────────────────────────────────────────────
const MIGRATION_PATH = join(ROOT, 'supabase', 'migrations', '20260526134635_create_booking_requests.sql');
const MIGRATION_SQL = readFileSync(MIGRATION_PATH, 'utf-8');

// ── REST helper (works for SELECT-like operations only) ──────────────────────
async function restRPC(func, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${func}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'apikey': SERVICE_ROLE_JWT,
    },
    body: JSON.stringify(params),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function restSelect(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'apikey': SERVICE_ROLE_JWT,
    }
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// ── Strategy 1: npx supabase db query --db-url ───────────────────────────────
async function trySupabaseCLI(sql, label) {
  const jwtEncoded = encodeURIComponent(SERVICE_ROLE_JWT);

  const connectionStrings = [
    `postgresql://postgres.${projectRef}:${jwtEncoded}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${projectRef}:${jwtEncoded}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${projectRef}:${jwtEncoded}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  ];

  // Write SQL to temp file for --file flag
  const tmpSql = join(ROOT, 'scripts', '_tmp_migration.sql');
  writeFileSync(tmpSql, sql, 'utf-8');

  for (const connStr of connectionStrings) {
    try {
      const host = connStr.match(/@([^:]+):/)?.[1] || 'unknown';
      console.log(`  CLI: trying ${host}...`);
      const result = spawnSync('npx', ['supabase', 'db', 'query', '--db-url', connStr, '--file', tmpSql], {
        cwd: ROOT,
        encoding: 'utf-8',
        timeout: 30000,
        shell: true,
      });
      if (result.status === 0) {
        console.log(`  ✅ CLI succeeded via ${host}`);
        return { ok: true, output: result.stdout };
      } else {
        const err = (result.stderr || result.stdout || '').slice(0, 200);
        console.log(`  ⚠️  CLI failed: ${err}`);
      }
    } catch (e) {
      console.log(`  ⚠️  CLI exception: ${e.message.slice(0, 100)}`);
    }
  }
  return { ok: false };
}

// ── Strategy 2: Direct pg connection ─────────────────────────────────────────
async function tryPGConnection(sql) {
  let pg;
  try { pg = require('pg'); } catch { return { ok: false, error: 'pg not installed' }; }
  const { Client } = pg;

  const jwtEncoded = encodeURIComponent(SERVICE_ROLE_JWT);
  const configs = [
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: SERVICE_ROLE_JWT, database: 'postgres', label: 'Session Pooler ap-south-1:5432' },
    { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: SERVICE_ROLE_JWT, database: 'postgres', label: 'Session Pooler eu-central-1:5432' },
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: SERVICE_ROLE_JWT, database: 'postgres', label: 'Session Pooler us-east-1:5432' },
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}`, password: SERVICE_ROLE_JWT, database: 'postgres', label: 'Txn Pooler ap-south-1:6543' },
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres', password: SERVICE_ROLE_JWT, database: 'postgres', label: 'Direct DB' },
  ];

  for (const cfg of configs) {
    const client = new Client({ ...cfg, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    try {
      console.log(`  pg: trying ${cfg.label}...`);
      await client.connect();
      await client.query('SELECT 1');
      console.log(`  ✅ pg connected via ${cfg.label}`);
      return { ok: true, client, label: cfg.label };
    } catch (err) {
      console.log(`  ⚠️  ${cfg.label}: ${err.message.split('\n')[0].slice(0, 80)}`);
      try { await client.end(); } catch {}
    }
  }
  return { ok: false, error: 'All TCP connections failed' };
}

// ── Strategy 3: Check table via REST and verify post-migration ────────────────
async function verifyViaREST() {
  console.log('\n── REST Verification ──────────────────────────────────');

  // Check booking_requests
  const bookRes = await restSelect('booking_requests');
  const tableExists = bookRes.status !== 404;
  console.log(`  booking_requests exists: ${tableExists} (HTTP ${bookRes.status})`);

  // Check profiles roles
  const profRes = await restSelect('profiles', '?select=role');
  const roles = profRes.body || [];
  const roleSet = [...new Set(roles.map(r => r.role))].sort();
  console.log(`  profiles roles: [${roleSet.join(', ')}]`);

  // Check property for smoke test
  const propRes = await restSelect('properties', '?select=id,owner_id&limit=1');
  const property = propRes.body?.[0];
  console.log(`  sample property: ${property ? JSON.stringify(property) : 'none'}`);

  return { tableExists, roleSet, property };
}

// ── Run SQL via pg client (if connected) ─────────────────────────────────────
async function applyMigrationViaClient(client, sql) {
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    return { ok: false, error: err.message };
  }
}

async function runQueryViaClient(client, sql) {
  const result = await client.query(sql);
  return result;
}

// ── Fix migration file for profiles.role ─────────────────────────────────────
function createProfilesRoleFix() {
  const ts = '20260530000001';
  const migName = `${ts}_fix_profiles_role_host.sql`;
  const migPath = join(ROOT, 'supabase', 'migrations', migName);

  if (existsSync(migPath)) {
    console.log(`  ℹ️  Migration ${migName} already exists.`);
    return { path: migPath, name: migName };
  }

  const sql = `-- Fix profiles.role CHECK constraint: remove 'owner', enforce guest/host/admin only.
-- Migration 008 added 'host' but kept 'owner' — this removes 'owner' from the constraint.
-- Generated: ${new Date().toISOString()}
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest','host','admin'));
UPDATE public.profiles SET role='host' WHERE role='owner';
`;
  writeFileSync(migPath, sql, 'utf-8');
  console.log(`  ✅ Created: supabase/migrations/${migName}`);
  return { path: migPath, name: migName, sql };
}

// ── Grep src/ for role='owner' ────────────────────────────────────────────────
function grepOwnerInSrc() {
  const srcDir = join(ROOT, 'src');
  const results = [];

  function scanDir(dir) {
    try {
      const entries = require('fs').readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
          const content = readFileSync(full, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('owner') && (line.includes('role') || line.includes('Role'))) {
              results.push({ file: full.replace(ROOT + '\\', ''), line: idx + 1, content: line.trim() });
            }
          });
        }
      }
    } catch {}
  }

  scanDir(srcDir);
  return results;
}

// ── Update production_all_migrations.sql ─────────────────────────────────────
function updateProductionSQL(newMigPaths) {
  const prodFile = join(ROOT, 'supabase', 'production_all_migrations.sql');
  let content = readFileSync(prodFile, 'utf-8');
  let changed = false;

  for (const { name, sql } of newMigPaths) {
    if (!content.includes(name)) {
      const migSql = sql || readFileSync(join(ROOT, 'supabase', 'migrations', name), 'utf-8');
      const separator = `\n-- ═══════════════════════════════════════════════════════════════\n-- Migration: ${name}\n-- ═══════════════════════════════════════════════════════════════\n`;
      content += separator + migSql + '\n';
      changed = true;
      console.log(`  ✅ Appended: ${name}`);
    } else {
      console.log(`  ℹ️  Already in production SQL: ${name}`);
    }
  }

  if (changed) {
    writeFileSync(prodFile, content, 'utf-8');
  }
  return changed;
}

// ── Git operations ────────────────────────────────────────────────────────────
function gitCommitPush() {
  try {
    execSync('git add supabase/', { cwd: ROOT, encoding: 'utf-8' });
    console.log('  ✅ git add supabase/');

    const status = execSync('git status --short supabase/', { cwd: ROOT, encoding: 'utf-8' });
    if (!status.trim()) {
      console.log('  ℹ️  Nothing to commit in supabase/');
      const sha = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
      return sha;
    }

    const commitOut = execSync(
      'git commit -m "feat(db): add booking_requests table with RLS and triggers; fix profiles.role check"',
      { cwd: ROOT, encoding: 'utf-8' }
    );
    console.log(`  ✅ git commit: ${commitOut.trim().split('\n')[0]}`);

    const sha = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();

    const pushOut = execSync('git push origin main', { cwd: ROOT, encoding: 'utf-8' });
    console.log(`  ✅ git push: ${pushOut.trim() || 'OK'}`);

    return sha;
  } catch (err) {
    console.error(`  ❌ Git error: ${err.message.slice(0, 300)}`);
    try {
      return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
    } catch { return 'unknown'; }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  const REPORT = [];
  const log = (msg) => { console.log(msg); REPORT.push(msg); };

  log('══════════════════════════════════════════════════════');
  log('  Funduq Migration Runner — Full Pipeline');
  log(`  Started: ${new Date().toISOString()}`);
  log('══════════════════════════════════════════════════════\n');

  // ── Pre-check via REST ─────────────────────────────────────────────────────
  log('── Pre-check via REST ─────────────────────────────────');
  const preCheck = await verifyViaREST();
  const tableAlreadyExists = preCheck.tableExists;

  let pgClient = null;
  let connectionMethod = 'NONE';
  let migrationApplied = false;
  let dbOpsFailed = false;

  // ── Step 2-3: Try to apply migration if table doesn't exist ───────────────
  if (!tableAlreadyExists) {
    log('\n── STEP 2-3: Applying migration ───────────────────────');

    // Try CLI first
    log('  Strategy 1: npx supabase CLI...');
    const cliResult = await trySupabaseCLI(MIGRATION_SQL, 'booking_requests migration');
    if (cliResult.ok) {
      connectionMethod = 'Supabase CLI (db query --db-url)';
      migrationApplied = true;
    } else {
      // Try pg direct
      log('  Strategy 2: Direct pg connection...');
      const pgResult = await tryPGConnection(MIGRATION_SQL);
      if (pgResult.ok) {
        pgClient = pgResult.client;
        connectionMethod = `pg direct (${pgResult.label})`;
        const applyResult = await applyMigrationViaClient(pgClient, MIGRATION_SQL);
        if (applyResult.ok) {
          migrationApplied = true;
          log(`  ✅ Migration applied via ${connectionMethod}`);
        } else {
          log(`  ❌ Migration apply failed: ${applyResult.error}`);
          dbOpsFailed = true;
        }
      } else {
        log('\n  ❌ НЕ СМОГ ПРИМЕНИТЬ АВТОМАТИЧЕСКИ');
        log('     Причина: все TCP-соединения к Supabase Pooler отклонены.');
        log('     Требуется: database password или sbp_ personal access token.');
        log('\n  📋 Для ручного применения — SQL Editor в Supabase Dashboard:');
        log(`     https://supabase.com/dashboard/project/${projectRef}/sql`);
        log('     Вставить содержимое файла:');
        log('     supabase/migrations/20260526134635_create_booking_requests.sql');
        dbOpsFailed = true;
        connectionMethod = 'FAILED — нет доступа к БД';
      }
    }
  } else {
    log('  ℹ️  Таблица booking_requests уже существует — пропускаем создание.');
    migrationApplied = true;
    connectionMethod = 'не нужно (таблица уже есть)';
  }

  // ── Step 4: Verification (REST where possible) ─────────────────────────────
  log('\n── STEP 4: Verification ───────────────────────────────');

  if (pgClient) {
    // Full verification via pg
    const cols = await runQueryViaClient(pgClient, `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='booking_requests'
      ORDER BY ordinal_position
    `);
    log(`\n4.1 Columns (${cols.rows.length}):`);
    cols.rows.forEach(r =>
      log(`  ${String(r.column_name).padEnd(18)} | ${String(r.data_type).padEnd(20)} | ${r.is_nullable} | ${(r.column_default||'').slice(0,35)}`)
    );

    const pols = await runQueryViaClient(pgClient, `
      SELECT polname, polcmd FROM pg_policies WHERE tablename='booking_requests' ORDER BY polcmd, polname
    `);
    log(`\n4.2 RLS Policies (${pols.rows.length}):`);
    pols.rows.forEach(p => log(`  cmd=${p.polcmd}  name=${p.polname}`));

    const trgs = await runQueryViaClient(pgClient, `
      SELECT tgname FROM pg_trigger
      WHERE tgrelid='public.booking_requests'::regclass AND NOT tgisinternal ORDER BY tgname
    `);
    log(`\n4.3 Triggers (${trgs.rows.length}):`);
    trgs.rows.forEach(t => log(`  ${t.tgname}`));
  } else if (migrationApplied) {
    // Table exists but no pg client — verify via REST
    const check = await verifyViaREST();
    if (check.tableExists) {
      log('  ✅ booking_requests доступна через REST API (таблица существует).');
      log('  ℹ️  Подробная проверка (4.1-4.3) требует прямого подключения к БД.');
    } else {
      log('  ⚠️  booking_requests всё ещё не видна через REST — возможно таблица не была создана.');
    }
  } else {
    log('  ⏭️  Пропуск: таблица не была создана (нет подключения к БД).');
  }

  // ── Step 5: Smoke test (only via pg client) ────────────────────────────────
  log('\n── STEP 5: Smoke Test ─────────────────────────────────');
  if (pgClient && preCheck.property) {
    const { id: propertyId, owner_id: ownerId } = preCheck.property;
    log(`  property_id: ${propertyId}`);
    log(`  expected host_id: ${ownerId}`);
    log(`  host_id BEFORE trigger: 00000000-0000-0000-0000-000000000000`);

    try {
      const ins = await runQueryViaClient(pgClient, `
        INSERT INTO public.booking_requests
          (property_id, host_id, guest_name, guest_phone, check_in, check_out)
        VALUES ('${propertyId}', '00000000-0000-0000-0000-000000000000',
          'Antigravity Test', '+971500000000', '2026-07-01', '2026-07-05')
        RETURNING id, property_id, host_id, status
      `);
      const row = ins.rows[0];
      log(`  host_id AFTER trigger: ${row.host_id}`);
      log(`  status: ${row.status}`);
      log(`  Trigger replaced host_id: ${row.host_id === ownerId ? 'YES ✓' : 'NO ✗'}`);
      log(`  status='Request': ${row.status === 'Request' ? 'YES ✓' : 'NO ✗'}`);
      await pgClient.query(`DELETE FROM public.booking_requests WHERE guest_name='Antigravity Test'`);
      log('  🗑️  Test row deleted.');
    } catch (err) {
      log(`  ❌ Smoke test error: ${err.message}`);
    }
  } else if (migrationApplied && preCheck.property) {
    log('  ⚠️  Smoke test через REST невозможен (нужен INSERT → trigger → RETURNING).');
    log('  ℹ️  После применения SQL вручную используйте SQL Editor для проверки.');
  } else {
    log('  ⏭️  Пропуск: нет свойств или нет подключения к БД.');
  }

  // ── Step 6: profiles.role fix ──────────────────────────────────────────────
  log('\n── STEP 6: profiles.role CHECK Constraint ─────────────');

  // 6.1 Check migration 008
  const m008 = readFileSync(join(ROOT, 'supabase', 'migrations', '008_fix_profile_roles.sql'), 'utf-8');
  const m008AllowsOwner = m008.includes("'owner'");
  const m008AllowsHost = m008.includes("'host'");
  log(`  008_fix_profile_roles.sql: allows 'owner'=${m008AllowsOwner}, 'host'=${m008AllowsHost}`);

  // 6.2 Current roles in DB (via REST)
  const rolesRes = await restSelect('profiles', '?select=role');
  const roles = rolesRes.body || [];
  const roleCounts = {};
  roles.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
  log(`  Current roles in DB: ${JSON.stringify(roleCounts)}`);
  const hasOwnerRows = Boolean(roleCounts['owner']);
  const hasHostRows = Boolean(roleCounts['host']);

  let profilesMigPath = null;
  let profilesMigName = null;
  let profilesMigSQL = null;

  // 6.3 Create fix migration if needed
  if (m008AllowsOwner) {
    log('  → Constraint in 008 still has "owner" — создаём fix migration...');
    const fix = createProfilesRoleFix();
    profilesMigPath = fix.path;
    profilesMigName = fix.name;
    profilesMigSQL = fix.sql;

    // Apply via pg if connected
    if (pgClient) {
      const r = await applyMigrationViaClient(pgClient, fix.sql || readFileSync(fix.path, 'utf-8'));
      if (r.ok) {
        log('  ✅ profiles.role fix applied via pg.');
      } else {
        log(`  ❌ profiles.role fix failed: ${r.error}`);
      }
    } else {
      log('  ⚠️  Нет pg-соединения — применить вручную:');
      log(`     supabase/migrations/${fix.name}`);
    }
  } else {
    log('  ✅ Constraint не содержит "owner" — fix не нужен.');
  }

  // Check final state via pg or REST
  if (pgClient) {
    const finalConstr = await runQueryViaClient(pgClient, `
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid='public.profiles'::regclass AND conname='profiles_role_check'
    `);
    log(`  Final profiles_role_check: ${finalConstr.rows[0]?.def || '(not found)'}`);
  } else {
    log(`  Было (в коде 008): CHECK (role IN ('guest', 'host', 'owner', 'admin'))`);
    log(`  Станет (после fix): CHECK (role IN ('guest','host','admin'))`);
  }

  // 6.4 Grep src/ for role=owner
  log('\n  6.4 Поиск role=owner в src/:');
  const ownerRefs = grepOwnerInSrc();
  if (ownerRefs.length === 0) {
    log('  ✅ Нет упоминаний role+owner в src/ — код уже чист.');
  } else {
    log(`  ⚠️  Найдено ${ownerRefs.length} мест (НЕ правим — для следующего промта):`);
    ownerRefs.slice(0, 20).forEach(r => log(`    ${r.file}:${r.line}  →  ${r.content.slice(0, 90)}`));
  }

  // ── Step 7: Update production_all_migrations.sql ───────────────────────────
  log('\n── STEP 7: production_all_migrations.sql ──────────────');
  const toAppend = [
    { name: '20260526134635_create_booking_requests.sql' },
  ];
  if (profilesMigName) {
    toAppend.push({ name: profilesMigName, sql: profilesMigSQL });
  }
  updateProductionSQL(toAppend);

  // ── Step 8: Git ────────────────────────────────────────────────────────────
  log('\n── STEP 8: Git commit + push ──────────────────────────');
  const sha = gitCommitPush();
  log(`  SHA: ${sha}`);

  // ── Cleanup: close pg client ───────────────────────────────────────────────
  if (pgClient) {
    try { await pgClient.end(); } catch {}
    log('\n🔌 DB connection closed.');
  }

  // ── Final report ───────────────────────────────────────────────────────────
  log('\n══════════════════════════════════════════════════════');
  log('  ИТОГОВЫЙ ОТЧЁТ');
  log('══════════════════════════════════════════════════════');
  log(`  Способ применения: ${connectionMethod}`);
  log(`  booking_requests таблица: ${tableAlreadyExists ? 'уже существовала' : migrationApplied ? 'создана' : 'НЕ СОЗДАНА — нужны ручные действия'}`);
  log(`  profiles.role fix: ${profilesMigName || 'не нужен'}`);
  log(`  Git SHA: ${sha}`);
  log('\n');

  if (dbOpsFailed) {
    log('══════════════════════════════════════════════════════');
    log('  ⚠️  ТРЕБУЮТСЯ РУЧНЫЕ ДЕЙСТВИЯ');
    log('══════════════════════════════════════════════════════');
    log('  1. Открыть SQL Editor:');
    log(`     https://supabase.com/dashboard/project/${projectRef}/sql`);
    log('');
    log('  2. Выполнить migration booking_requests:');
    log('     → скопировать: supabase/migrations/20260526134635_create_booking_requests.sql');
    log('');
    if (profilesMigName) {
      log('  3. Выполнить fix profiles.role:');
      log(`     → скопировать: supabase/migrations/${profilesMigName}`);
    }
    log('');
    log('  4. После выполнения SQL — запустить verify-шаги 4.1-4.3 в том же SQL Editor.');
  }
}

main().catch(err => {
  console.error('\n💥 Fatal:', err.message);
  process.exit(1);
});
