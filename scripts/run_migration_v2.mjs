/**
 * run_migration_v2.mjs
 * Uses the real JWT service_role key from .env.migration for pg connection.
 * Tries multiple Supabase pooler connection strings.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// ── Load .env files ──────────────────────────────────────────────────────────
function loadEnv(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    let key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const localEnv = loadEnv(join(__dirname, '..', '.env.local'));
const migEnv = loadEnv(join(__dirname, '..', '.env.migration'));

const SUPABASE_URL = localEnv['NEXT_PUBLIC_SUPABASE_URL'] || migEnv['NEXT_PUBLIC_SUPABASE_URL'];
// Use the JWT from .env.migration (full JWT format, not sb_secret_)
const SERVICE_ROLE_JWT = migEnv['SUPABASE_SERVICE_ROLE_KEY'] || localEnv['SUPABASE_SERVICE_ROLE_KEY'];

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
console.log(`📦 Project ref: ${projectRef}`);
console.log(`🔑 Service role key type: ${SERVICE_ROLE_JWT.startsWith('eyJ') ? 'JWT ✓' : 'non-JWT (' + SERVICE_ROLE_JWT.slice(0, 15) + '...)'}`);

// ── Load pg ──────────────────────────────────────────────────────────────────
const pg = require('pg');
const { Client } = pg;

// ── Connection configs to try ─────────────────────────────────────────────────
const encodedJWT = encodeURIComponent(SERVICE_ROLE_JWT);

// Supabase pooler regions (Mumbai = ap-south-1, also try others)
const poolerRegions = ['aws-0-ap-south-1', 'aws-0-eu-central-1', 'aws-0-us-east-1', 'aws-0-us-west-1'];

const connectionConfigs = [
  // Session pooler (port 5432) - supports DDL, SET, multiple statements
  ...poolerRegions.map(region => ({
    label: `Session Pooler ${region}:5432`,
    connectionString: `postgresql://postgres.${projectRef}:${encodedJWT}@${region}.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  })),
  // Transaction pooler (port 6543) - doesn't support multi-statement DDL well
  ...poolerRegions.map(region => ({
    label: `Transaction Pooler ${region}:6543`,
    connectionString: `postgresql://postgres.${projectRef}:${encodedJWT}@${region}.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  })),
  // Direct DB connection
  {
    label: `Direct DB:5432`,
    connectionString: `postgresql://postgres:${encodedJWT}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  },
];

async function connect() {
  for (const cfg of connectionConfigs) {
    const client = new Client({
      connectionString: cfg.connectionString,
      ssl: cfg.ssl,
      connectionTimeoutMillis: 8000,
    });
    try {
      console.log(`🔗 Trying: ${cfg.label}...`);
      await client.connect();
      const testResult = await client.query('SELECT 1 as ok');
      if (testResult.rows[0]?.ok == 1) {
        console.log(`✅ Connected via: ${cfg.label}`);
        return { client, label: cfg.label };
      }
    } catch (err) {
      console.warn(`   ⚠️  Failed: ${err.message.split('\n')[0]}`);
      try { await client.end(); } catch {}
    }
  }
  return null;
}

// ── Helper: run SQL ──────────────────────────────────────────────────────────
async function runSQL(client, sql, label) {
  console.log(`\n🔵 ${label}`);
  const result = await client.query(sql);
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const report = [];
  const log = (msg) => { console.log(msg); report.push(msg); };

  log('\n════════════════════════════════════════════════════════');
  log('  Funduq Migration Runner v2 — booking_requests + profiles.role');
  log('════════════════════════════════════════════════════════\n');

  const conn = await connect();
  if (!conn) {
    log('\n❌ CANNOT APPLY MIGRATION AUTOMATICALLY');
    log('   All TCP connection methods failed (likely network/firewall restriction).');
    log('\n   To apply manually, use Supabase Dashboard SQL Editor:');
    log('   → https://supabase.com/dashboard/project/jftowqfrhhohkqkslfaa/sql');
    log('   → Paste contents of: supabase/migrations/20260526134635_create_booking_requests.sql');
    process.exit(2); // exit code 2 = needs manual fallback
  }

  const { client, label: connectionLabel } = conn;
  log(`✅ Connection: ${connectionLabel}`);

  try {
    // ── STEP 2: Check table existence ─────────────────────────────────────────
    log('\n── STEP 2: Check if booking_requests exists ─────────────');
    const existsResult = await client.query(`SELECT to_regclass('public.booking_requests') AS cls`);
    const tableExists = existsResult.rows[0]?.cls !== null;
    log(`   to_regclass: ${existsResult.rows[0]?.cls ?? 'NULL (table not found)'}`);

    if (!tableExists) {
      // ── STEP 3: Apply migration ──────────────────────────────────────────────
      log('\n── STEP 3: Applying migration 20260526134635_create_booking_requests.sql ─');
      const migPath = join(__dirname, '..', 'supabase', 'migrations', '20260526134635_create_booking_requests.sql');
      const migSQL = readFileSync(migPath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(migSQL);
        await client.query('COMMIT');
        log('   ✅ Migration applied in one transaction.');
      } catch (err) {
        await client.query('ROLLBACK');
        log(`   ❌ Migration FAILED and rolled back: ${err.message}`);
        log(`   SQL context: ${err.position ? `position ${err.position}` : ''}`);
        throw err;
      }
    } else {
      log('   ℹ️  Table already exists — skipping creation, proceeding to verify.');
    }

    // ── STEP 4: Verification ──────────────────────────────────────────────────
    log('\n── STEP 4.1: Column structure ───────────────────────────');
    const colsResult = await runSQL(client, `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='booking_requests'
      ORDER BY ordinal_position
    `, 'Column structure');
    const cols = colsResult.rows;
    log(`Found ${cols.length} columns (expected 14):`);
    log('column_name        | data_type            | nullable | default');
    log('-------------------+----------------------+----------+------------------');
    cols.forEach(r => {
      const def = (r.column_default || 'none').slice(0, 30);
      log(`${String(r.column_name).padEnd(18)} | ${String(r.data_type).padEnd(20)} | ${r.is_nullable.padEnd(8)} | ${def}`);
    });

    log('\n── STEP 4.2: RLS Policies ────────────────────────────────');
    const polResult = await runSQL(client, `
      SELECT polname, polcmd FROM pg_policies WHERE tablename='booking_requests' ORDER BY polcmd, polname
    `, 'RLS policies');
    const policies = polResult.rows;
    log(`Found ${policies.length} policies (no INSERT by design):`);
    policies.forEach(p => log(`  cmd=${p.polcmd}  name=${p.polname}`));

    log('\n── STEP 4.3: Triggers ────────────────────────────────────');
    const trgResult = await runSQL(client, `
      SELECT tgname FROM pg_trigger
      WHERE tgrelid='public.booking_requests'::regclass AND NOT tgisinternal
      ORDER BY tgname
    `, 'Triggers');
    log(`Found ${trgResult.rows.length} triggers (expected 2):`);
    trgResult.rows.forEach(t => log(`  ${t.tgname}`));

    // ── STEP 5: Smoke Test ──────────────────────────────────────────────────
    log('\n── STEP 5: Smoke Test ───────────────────────────────────');
    const propResult = await runSQL(client, `SELECT id, owner_id FROM public.properties LIMIT 1`, 'Get test property');

    if (propResult.rows.length === 0) {
      log('  ⚠️  No properties in DB — skipping smoke test.');
    } else {
      const { id: propertyId, owner_id: ownerId } = propResult.rows[0];
      log(`  property_id: ${propertyId}`);
      log(`  expected host_id (owner_id): ${ownerId}`);
      log(`  host_id BEFORE trigger: 00000000-0000-0000-0000-000000000000`);

      const insertResult = await runSQL(client, `
        INSERT INTO public.booking_requests
          (property_id, host_id, guest_name, guest_phone, check_in, check_out)
        VALUES
          ('${propertyId}', '00000000-0000-0000-0000-000000000000',
           'Antigravity Test', '+971500000000', '2026-07-01', '2026-07-05')
        RETURNING id, property_id, host_id, status
      `, 'Smoke test INSERT');

      const row = insertResult.rows[0];
      log(`  host_id AFTER trigger:  ${row.host_id}`);
      log(`  status:                 ${row.status}`);

      const triggerOk = row.host_id === ownerId;
      const statusOk = row.status === 'Request';
      log(`  ✅ Trigger replaced host_id: ${triggerOk ? 'YES ✓' : `NO ✗ (got: ${row.host_id}, expected: ${ownerId})`}`);
      log(`  ✅ status='Request': ${statusOk ? 'YES ✓' : `NO ✗ (got: ${row.status})`}`);

      await client.query(`DELETE FROM public.booking_requests WHERE guest_name='Antigravity Test'`);
      log('  🗑️  Test row cleaned up.');
    }

    // ── STEP 6: profiles.role ────────────────────────────────────────────────
    log('\n── STEP 6: profiles.role Constraint ────────────────────');
    const constraintResult = await runSQL(client, `
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid='public.profiles'::regclass AND contype='c'
    `, 'Get CHECK constraints');

    log('Current CHECK constraints on profiles:');
    constraintResult.rows.forEach(r => log(`  ${r.conname}: ${r.def}`));

    const rolesResult = await runSQL(client, `
      SELECT DISTINCT role, COUNT(*) as cnt FROM public.profiles GROUP BY role ORDER BY role
    `, 'Role distribution');
    log('Role distribution:');
    rolesResult.rows.forEach(r => log(`  role='${r.role}'  count=${r.cnt}`));

    const roleRow = constraintResult.rows.find(r => r.conname === 'profiles_role_check');
    const constraintDef = roleRow?.def || '';
    const allowsOwner = constraintDef.includes("'owner'");
    const allowsHost = constraintDef.includes("'host'");
    log(`\n  Constraint allows 'owner': ${allowsOwner}`);
    log(`  Constraint allows 'host':  ${allowsHost}`);

    let newMigrationPath = null;

    if (allowsOwner || !allowsHost) {
      // Need to fix
      log('\n  → Fixing profiles.role constraint...');
      const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
      const newMigName = `${ts}_fix_profiles_role_host.sql`;
      newMigrationPath = join(__dirname, '..', 'supabase', 'migrations', newMigName);

      const fixSQL = `-- Fix profiles.role CHECK constraint: 'owner' → 'host', remove 'owner' from CHECK
-- Generated automatically by run_migration_v2.mjs on ${new Date().toISOString()}
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest','host','admin'));
UPDATE public.profiles SET role='host' WHERE role='owner';
`;
      writeFileSync(newMigrationPath, fixSQL, 'utf-8');
      log(`  📝 Created: supabase/migrations/${newMigName}`);

      await client.query('BEGIN');
      try {
        await client.query(fixSQL);
        await client.query('COMMIT');
        log('  ✅ profiles.role fix applied.');
      } catch (err) {
        await client.query('ROLLBACK');
        log(`  ❌ profiles.role fix failed: ${err.message}`);
      }

      // Verify
      const finalCheck = await client.query(`
        SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE conrelid='public.profiles'::regclass AND conname='profiles_role_check'
      `);
      log(`  Final constraint: ${finalCheck.rows[0]?.def || '(not found)'}`);
    } else {
      log('  ✅ Constraint already correct (guest/host/admin only) — no fix needed.');
    }

    // 6.4 Grep for owner in role context
    log('\n  6.4 Searching src/ for role=owner patterns...');
    try {
      const grepResult = execSync(
        'findstr /s /n /i "owner" "c:\\Users\\Korisnik\\Desktop\\Funduq\\src\\*.ts" "c:\\Users\\Korisnik\\Desktop\\Funduq\\src\\*.tsx" 2>nul | findstr /i "role"',
        { encoding: 'utf-8', shell: 'cmd.exe', timeout: 15000 }
      );
      if (grepResult.trim()) {
        log('  ⚠️  Found role+owner references (report only, not auto-fixed):');
        grepResult.trim().split('\n').slice(0, 25).forEach(l => log(`    ${l.trim()}`));
      } else {
        log('  ✅ No role=owner references found in src/.');
      }
    } catch (e) {
      // findstr returns exit 1 when no matches found
      const out = e.stdout || '';
      if (out.trim()) {
        log('  ⚠️  Matches found:');
        out.trim().split('\n').slice(0, 25).forEach(l => log(`    ${l.trim()}`));
      } else {
        log('  ✅ No role=owner references found in src/.');
      }
    }

    return { newMigrationPath, connectionLabel, cols, policies, triggers: trgResult.rows, constraintDef };

  } finally {
    await client.end();
    log('\n🔌 DB connection closed.');
  }
}

// ── Execute and handle step 7 ─────────────────────────────────────────────────
const result = await main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});

// ── STEP 7: Update production_all_migrations.sql ──────────────────────────────
console.log('\n── STEP 7: Updating production_all_migrations.sql ──────');
const prodFile = join(__dirname, '..', 'supabase', 'production_all_migrations.sql');
const migPath = join(__dirname, '..', 'supabase', 'migrations', '20260526134635_create_booking_requests.sql');

let prodContent = readFileSync(prodFile, 'utf-8');
const migContent = readFileSync(migPath, 'utf-8');

// Check if already appended
if (!prodContent.includes('20260526134635_create_booking_requests')) {
  const separator = `\n-- ═══════════════════════════════════════════════════════════════\n-- Migration: 20260526134635_create_booking_requests\n-- ═══════════════════════════════════════════════════════════════\n`;
  prodContent += separator + migContent + '\n';
  console.log('  ✅ Appended booking_requests migration.');
} else {
  console.log('  ℹ️  booking_requests already in production_all_migrations.sql');
}

if (result.newMigrationPath) {
  const newMigContent = readFileSync(result.newMigrationPath, 'utf-8');
  const newMigName = result.newMigrationPath.split(/[/\\]/).pop();
  if (!prodContent.includes(newMigName)) {
    const separator2 = `\n-- ═══════════════════════════════════════════════════════════════\n-- Migration: ${newMigName}\n-- ═══════════════════════════════════════════════════════════════\n`;
    prodContent += separator2 + newMigContent + '\n';
    console.log(`  ✅ Appended ${newMigName} migration.`);
  } else {
    console.log(`  ℹ️  ${newMigName} already in production_all_migrations.sql`);
  }
}

writeFileSync(prodFile, prodContent, 'utf-8');
console.log('  ✅ production_all_migrations.sql updated.');

// ── STEP 8: git commit + push ─────────────────────────────────────────────────
console.log('\n── STEP 8: Git commit + push ────────────────────────────');
try {
  execSync('git add supabase/', { cwd: join(__dirname, '..'), encoding: 'utf-8' });
  console.log('  ✅ git add supabase/');

  const commitOut = execSync(
    'git commit -m "feat(db): add booking_requests table with RLS and triggers; fix profiles.role check"',
    { cwd: join(__dirname, '..'), encoding: 'utf-8' }
  );
  console.log(`  ✅ git commit: ${commitOut.trim()}`);

  const pushOut = execSync('git push origin main', { cwd: join(__dirname, '..'), encoding: 'utf-8' });
  console.log(`  ✅ git push: ${pushOut.trim()}`);
} catch (err) {
  console.error(`  ⚠️  Git step error: ${err.message}`);
}

console.log('\n════ MIGRATION COMPLETE ════');
process.exit(0);
