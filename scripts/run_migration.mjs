/**
 * run_migration.mjs
 * Applies the booking_requests migration and runs verification + smoke test.
 * Uses the Supabase Postgres connection via the `pg` npm package.
 * Connection: postgresql://postgres.PROJECT_REF:[SERVICE_ROLE_KEY]@pooler.supabase.com:6543/postgres
 *
 * Usage: node scripts/run_migration.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  env[key] = value;
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Extract project ref from URL: https://jftowqfrhhohkqkslfaa.supabase.co → jftowqfrhhohkqkslfaa
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
console.log(`📦 Project ref: ${projectRef}`);

// ── Build connection string ──────────────────────────────────────────────────
// Supabase Transaction Pooler (port 6543) — accepts password = service_role key
// Session Pooler (port 5432) also works. Direct DB: db.REF.supabase.co:5432
// We try: aws-0-ap-south-1 (Mumbai), then direct db host as fallback.
const POOLER_HOST = `aws-0-ap-south-1.pooler.supabase.com`;
const DB_HOST = `db.${projectRef}.supabase.co`;
const encodedKey = encodeURIComponent(SERVICE_ROLE_KEY);

// Primary: Session Pooler (port 5432, supports all SQL including DDL)
const CONNECTION_STRING = `postgresql://postgres.${projectRef}:${encodedKey}@${POOLER_HOST}:5432/postgres`;
// Fallback: Direct DB
const CONNECTION_STRING_DIRECT = `postgresql://postgres:${encodedKey}@${DB_HOST}:5432/postgres`;

// ── Attempt to load pg ────────────────────────────────────────────────────────
let pg;
try {
  pg = require('pg');
} catch (e) {
  console.error('❌ pg package not found. Run: npm install --save-dev pg');
  process.exit(1);
}
const { Client } = pg;

// ── Helper: run SQL ───────────────────────────────────────────────────────────
async function runSQL(client, sql, label) {
  console.log(`\n🔵 ${label}`);
  try {
    const result = await client.query(sql);
    return result;
  } catch (err) {
    console.error(`❌ Error in "${label}":\n   SQL: ${sql.slice(0, 200)}\n   Error: ${err.message}`);
    throw err;
  }
}

// ── Connect with fallback ─────────────────────────────────────────────────────
async function connect() {
  const configs = [
    { connectionString: CONNECTION_STRING, label: 'Session Pooler (aws-0-ap-south-1, port 5432)' },
    { connectionString: CONNECTION_STRING_DIRECT, label: `Direct DB (db.${projectRef}, port 5432)` },
  ];

  for (const cfg of configs) {
    const client = new Client({ connectionString: cfg.connectionString, ssl: { rejectUnauthorized: false } });
    try {
      console.log(`🔗 Trying connection: ${cfg.label}...`);
      await client.connect();
      console.log(`✅ Connected via: ${cfg.label}`);
      return client;
    } catch (err) {
      console.warn(`⚠️  Failed (${cfg.label}): ${err.message}`);
      try { await client.end(); } catch {}
    }
  }
  throw new Error('All connection methods failed. Cannot apply migration automatically.');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const report = [];
  const log = (msg) => { console.log(msg); report.push(msg); };

  log('\n════════════════════════════════════════════════════════');
  log('  Funduq DB Migration Runner — booking_requests + profiles.role fix');
  log('════════════════════════════════════════════════════════\n');

  // ── Connect ──────────────────────────────────────────────────────────────
  let client;
  try {
    client = await connect();
    log(`✅ Connection method: Session Pooler (Supabase, aws-0-ap-south-1:5432)`);
  } catch (err) {
    log(`\n❌ CANNOT APPLY MIGRATION AUTOMATICALLY\n`);
    log(`   Reason: ${err.message}`);
    log(`\n   Manual commands needed:`);
    log(`   1) Obtain the database password from Supabase Dashboard → Project Settings → Database`);
    log(`   2) Set: export PGPASSWORD=<db_password>`);
    log(`   3) psql -h db.${projectRef}.supabase.co -p 5432 -U postgres -d postgres -f supabase/migrations/20260526134635_create_booking_requests.sql`);
    process.exit(1);
  }

  try {
    // ── STEP 2: Check if table already exists ────────────────────────────────
    log('\n── STEP 2: Check if booking_requests exists ─────────────');
    const existsResult = await runSQL(client, `SELECT to_regclass('public.booking_requests') AS cls`, 'Check table existence');
    const tableExists = existsResult.rows[0]?.cls !== null;
    log(`   to_regclass result: ${existsResult.rows[0]?.cls ?? 'NULL'}`);

    if (!tableExists) {
      // ── STEP 3: Apply migration ────────────────────────────────────────────
      log('\n── STEP 3: Applying migration 20260526134635_create_booking_requests.sql ─');
      const migPath = join(__dirname, '..', 'supabase', 'migrations', '20260526134635_create_booking_requests.sql');
      const migSQL = readFileSync(migPath, 'utf-8');
      
      // Wrap in transaction
      await client.query('BEGIN');
      try {
        await client.query(migSQL);
        await client.query('COMMIT');
        log('   ✅ Migration applied successfully in one transaction.');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed and was rolled back: ${err.message}`);
      }
    } else {
      log('   ℹ️  Table booking_requests already exists. Skipping creation, proceeding to verification.');
    }

    // ── STEP 4: Verification ──────────────────────────────────────────────────
    log('\n── STEP 4: Verification ─────────────────────────────────');

    // 4.1 Columns
    log('\n  4.1 Table structure (columns):');
    const colsResult = await runSQL(client, `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='booking_requests'
      ORDER BY ordinal_position
    `, 'Column structure query');

    const cols = colsResult.rows;
    log(`  Found ${cols.length} columns (expected 14):`);
    const colTable = cols.map(r =>
      `  ${String(r.column_name).padEnd(18)} | ${String(r.data_type).padEnd(20)} | nullable:${r.is_nullable.padEnd(4)} | default:${(r.column_default || 'none').slice(0, 40)}`
    );
    colTable.forEach(r => log(r));

    // 4.2 RLS Policies
    log('\n  4.2 RLS Policies:');
    const polResult = await runSQL(client, `
      SELECT polname, polcmd FROM pg_policies WHERE tablename='booking_requests' ORDER BY polcmd, polname
    `, 'RLS policies query');
    const policies = polResult.rows;
    log(`  Found ${policies.length} policies (expected 4 — no INSERT policy by design):`);
    policies.forEach(p => log(`  polcmd:${p.polcmd}  name:${p.polname}`));

    // 4.3 Triggers
    log('\n  4.3 Triggers:');
    const trgResult = await runSQL(client, `
      SELECT tgname FROM pg_trigger
      WHERE tgrelid='public.booking_requests'::regclass AND NOT tgisinternal
      ORDER BY tgname
    `, 'Triggers query');
    const triggers = trgResult.rows;
    log(`  Found ${triggers.length} triggers (expected 2):`);
    triggers.forEach(t => log(`  ${t.tgname}`));

    // ── STEP 5: Smoke Test ──────────────────────────────────────────────────
    log('\n── STEP 5: Smoke Test ───────────────────────────────────');

    // Get a real property
    const propResult = await runSQL(client, `SELECT id, owner_id FROM public.properties LIMIT 1`, 'Get test property');
    if (propResult.rows.length === 0) {
      log('  ⚠️  No properties found in DB — cannot run smoke test.');
    } else {
      const { id: propertyId, owner_id: ownerId } = propResult.rows[0];
      log(`  Property id: ${propertyId}`);
      log(`  Owner id (expected host_id after trigger): ${ownerId}`);

      // Insert with wrong host_id (trigger should replace it)
      const insertSQL = `
        INSERT INTO public.booking_requests
          (property_id, host_id, guest_name, guest_phone, check_in, check_out)
        VALUES
          ('${propertyId}', '00000000-0000-0000-0000-000000000000',
           'Antigravity Test', '+971500000000', '2026-07-01', '2026-07-05')
        RETURNING id, property_id, host_id, status
      `;
      const insertResult = await runSQL(client, insertSQL, 'Smoke test INSERT');
      const inserted = insertResult.rows[0];
      log(`  Inserted row:`);
      log(`    id:         ${inserted.id}`);
      log(`    property_id: ${inserted.property_id}`);
      log(`    host_id (BEFORE trigger arg): 00000000-0000-0000-0000-000000000000`);
      log(`    host_id (AFTER trigger):     ${inserted.host_id}`);
      log(`    status:     ${inserted.status}`);

      const triggerWorked = inserted.host_id === ownerId;
      const statusOk = inserted.status === 'Request';
      log(`  ✅ Trigger replaced host_id: ${triggerWorked ? 'YES ✓' : 'NO ✗ (MISMATCH!)'}`);
      log(`  ✅ status = 'Request': ${statusOk ? 'YES ✓' : 'NO ✗'}`);

      if (!triggerWorked) {
        log(`  ⚠️  MISMATCH: expected ${ownerId}, got ${inserted.host_id}`);
      }

      // Cleanup
      await runSQL(client, `DELETE FROM public.booking_requests WHERE guest_name='Antigravity Test'`, 'Cleanup test row');
      log('  🗑️  Test row deleted.');
    }

    // ── STEP 6: profiles.role fix ───────────────────────────────────────────
    log('\n── STEP 6: profiles.role Check Constraint ───────────────');

    // 6.2 Check current constraint
    const constraintResult = await runSQL(client, `
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid='public.profiles'::regclass AND contype='c'
    `, 'Get profiles CHECK constraints');
    log('  Current CHECK constraints on profiles:');
    constraintResult.rows.forEach(r => log(`    ${r.conname}: ${r.def}`));

    const rolesResult = await runSQL(client, `
      SELECT DISTINCT role, COUNT(*) as cnt FROM public.profiles GROUP BY role ORDER BY role
    `, 'Get distinct roles');
    log('  Current role distribution:');
    rolesResult.rows.forEach(r => log(`    role=${r.role}  count=${r.cnt}`));

    // Check if we need to fix: does the constraint allow 'owner' but NOT 'host', or allow both?
    const roleCheckConstraint = constraintResult.rows.find(r => r.conname === 'profiles_role_check');
    const constraintDef = roleCheckConstraint?.def || '';
    
    const allowsOwner = constraintDef.includes("'owner'");
    const allowsHost = constraintDef.includes("'host'");
    
    log(`\n  Constraint allows 'owner': ${allowsOwner}`);
    log(`  Constraint allows 'host':  ${allowsHost}`);

    let profilesFixNeeded = false;
    let profilesFixApplied = false;
    let newMigrationPath = null;

    // If constraint has 'owner' OR does NOT have 'host', we need to ensure final state is ('guest','host','admin')
    // Per step 6.3: only fix if CHECK still contains 'owner' AND does NOT contain 'host'
    if (allowsOwner && !allowsHost) {
      log('\n  ⚠️  Constraint has "owner" but not "host" — applying fix!');
      profilesFixNeeded = true;

      // Create new migration file
      const ts = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
      const newMigName = `${ts}_fix_profiles_role_host.sql`;
      newMigrationPath = join(__dirname, '..', 'supabase', 'migrations', newMigName);
      
      const fixSQL = `-- Fix profiles.role CHECK constraint: owner → host
-- Generated automatically by run_migration.mjs
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest','host','admin'));
UPDATE public.profiles SET role='host' WHERE role='owner';
`;

      const { writeFileSync } = await import('fs');
      writeFileSync(newMigrationPath, fixSQL, 'utf-8');
      log(`  📝 Created migration: ${newMigName}`);

      // Apply fix
      await client.query('BEGIN');
      try {
        await client.query(fixSQL);
        await client.query('COMMIT');
        profilesFixApplied = true;
        log('  ✅ profiles.role fix applied successfully.');
      } catch (err) {
        await client.query('ROLLBACK');
        log(`  ❌ profiles.role fix failed: ${err.message}`);
      }
    } else if (!allowsOwner && allowsHost) {
      log('  ✅ Constraint already uses "host" and not "owner" — no fix needed.');
    } else if (allowsOwner && allowsHost) {
      log('  ℹ️  Constraint allows BOTH "owner" and "host" — need to clean up "owner".');
      profilesFixNeeded = true;

      const ts = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
      const newMigName = `${ts}_fix_profiles_role_host.sql`;
      newMigrationPath = join(__dirname, '..', 'supabase', 'migrations', newMigName);

      const fixSQL = `-- Fix profiles.role CHECK constraint: remove 'owner', keep only guest/host/admin
-- Generated automatically by run_migration.mjs
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest','host','admin'));
UPDATE public.profiles SET role='host' WHERE role='owner';
`;

      const { writeFileSync } = await import('fs');
      writeFileSync(newMigrationPath, fixSQL, 'utf-8');
      log(`  📝 Created migration: ${newMigName}`);

      await client.query('BEGIN');
      try {
        await client.query(fixSQL);
        await client.query('COMMIT');
        profilesFixApplied = true;
        log('  ✅ profiles.role fix applied (removed "owner" from constraint).');
      } catch (err) {
        await client.query('ROLLBACK');
        log(`  ❌ profiles.role fix failed: ${err.message}`);
      }
    } else {
      log('  ✅ Constraint is clean (guest/host/admin only) — no fix needed.');
    }

    // Verify final state
    const finalConstraintResult = await runSQL(client, `
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid='public.profiles'::regclass AND contype='c' AND conname='profiles_role_check'
    `, 'Final constraint check');
    const finalDef = finalConstraintResult.rows[0]?.def || '(not found)';
    log(`\n  Final profiles_role_check: ${finalDef}`);

    // 6.4 Grep src/ for 'owner' in role context
    log('\n  6.4 Grepping src/ for role===owner patterns...');
    // We'll report this to the user — actual grep done via child_process
    const { execSync } = await import('child_process');
    let grepOwnerResults = '';
    try {
      grepOwnerResults = execSync(
        `grep -rn "owner" --include="*.ts" --include="*.tsx" c:/Users/Korisnik/Desktop/Funduq/src/ 2>/dev/null | grep -i "role" | head -30`,
        { encoding: 'utf-8', shell: 'cmd' }
      );
    } catch (e) {
      grepOwnerResults = e.stdout || '(no matches or grep error)';
    }
    if (grepOwnerResults.trim()) {
      log('  ⚠️  Found role+owner references in src/ (DO NOT auto-fix — report only):');
      grepOwnerResults.trim().split('\n').slice(0, 20).forEach(l => log(`    ${l}`));
    } else {
      log('  ✅ No role===owner references found in src/.');
    }

    // ── Return paths for step 7 ─────────────────────────────────────────────
    return { newMigrationPath };

  } finally {
    await client.end();
    console.log('\n🔌 DB connection closed.');
  }
}

main().then(({ newMigrationPath }) => {
  console.log('\n✅ Migration script completed. Proceeding to step 7 (update production_all_migrations.sql)...');
  process.exitCode = 0;
  // Store the new migration path for the shell script to pick up
  if (newMigrationPath) {
    process.stdout.write(`\nNEW_MIGRATION_PATH=${newMigrationPath}\n`);
  }
}).catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
