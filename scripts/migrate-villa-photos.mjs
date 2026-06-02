/**
 * migrate-villa-photos.mjs
 *
 * Migrates all villa gallery photos from muscache.com (Airbnb CDN)
 * to Supabase Storage bucket `properties-images`.
 *
 * Idempotent: re-running skips already-uploaded files (deterministic filename via SHA-256 hash of URL).
 * Safe: DB is only updated after ALL images for a property are successfully uploaded.
 *
 * Usage:
 *   node scripts/migrate-villa-photos.mjs --dry-run   # plan only, no uploads
 *   node scripts/migrate-villa-photos.mjs             # real migration
 *
 * Requires .env.migration in project root (created via: vercel env pull .env.migration --environment=production)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Load env ───────────────────────────────────────────────────────────────
function loadEnv(file) {
  const envPath = join(ROOT, file);
  if (!existsSync(envPath)) throw new Error(`Env file not found: ${envPath}`);
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = value;
    }
  });
  return env;
}

const env = loadEnv('.env.migration');
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.migration');
  process.exit(1);
}

// ─── Config ─────────────────────────────────────────────────────────────────
const BUCKET = 'properties-images';
const CONCURRENCY = 3;        // max parallel uploads
const PAUSE_MS = 100;         // pause between uploads
const FETCH_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 9000];  // exponential backoff

const isDryRun = process.argv.includes('--dry-run');

// Parse --limit=N
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

// Parse --only-id=UUID (targeted single-property retry)
const onlyIdArg = process.argv.find(a => a.startsWith('--only-id='));
const ONLY_ID = onlyIdArg ? onlyIdArg.split('=')[1].trim() : null;

// ─── Supabase Client ─────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function urlToFilename(url) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  // Try to detect extension from URL
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  let ext = '.jpg'; // default
  if (pathname.match(/\.(webp|png|gif|avif)$/i)) {
    ext = pathname.match(/\.(webp|png|gif|avif)$/i)[0].toLowerCase();
  } else if (pathname.match(/\.jpe?g$/i)) {
    ext = '.jpg';
  }
  return `${hash}${ext}`;
}

function contentTypeToExt(ct) {
  if (!ct) return '.jpg';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('png')) return '.png';
  if (ct.includes('gif')) return '.gif';
  if (ct.includes('avif')) return '.avif';
  return '.jpg';
}

async function fetchWithRetry(url, options = {}, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    // 4xx: no retry
    if (res.status >= 400 && res.status < 500) {
      return { ok: false, status: res.status, response: null, error: `HTTP ${res.status}` };
    }
    // 5xx: retry
    if (res.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAYS[attempt]);
      return fetchWithRetry(url, options, attempt + 1);
    }
    return { ok: res.ok, status: res.status, response: res, error: null };
  } catch (err) {
    clearTimeout(timer);
    // Network error: retry
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAYS[attempt]);
      return fetchWithRetry(url, options, attempt + 1);
    }
    return { ok: false, status: 0, response: null, error: err.message };
  }
}

// ─── p-limit replacement (simple concurrency queue) ──────────────────────────
function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  function run() {
    if (queue.length === 0 || active >= concurrency) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(() => fn()).then(result => {
      active--;
      resolve(result);
      run();
    }).catch(err => {
      active--;
      reject(err);
      run();
    });
  }
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      run();
    });
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Villa Photo Migration Script`);
  console.log(`   Mode: ${isDryRun ? '🔍 DRY-RUN (no uploads, no DB changes)' : '🔥 LIVE'}`);
  console.log(`   Bucket: ${BUCKET}`);
  if (LIMIT) console.log(`   Limit: first ${LIMIT} properties (canary run)`);
  if (ONLY_ID) console.log(`   Target: single property ${ONLY_ID}`);
  console.log(`${'='.repeat(60)}\n`);

  // 1. Fetch all properties
  const { data: properties, error: fetchErr } = await supabase
    .from('properties')
    .select('id, title, main_image_url, gallery_urls');

  if (fetchErr) {
    console.error('❌ Failed to fetch properties:', fetchErr.message);
    process.exit(1);
  }

  console.log(`📦 Found ${properties.length} properties total.\n`);

  // 2. For each property, build list of unique URLs to migrate
  const migrationPlan = properties.map(p => {
    const urls = [];
    const seen = new Set();
    const allUrls = [p.main_image_url, ...(p.gallery_urls || [])].filter(Boolean);
    for (const url of allUrls) {
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
    return { ...p, urls };
  });

  // Apply --only-id=UUID, --limit=N filters
  let plan = migrationPlan;
  if (ONLY_ID) {
    plan = migrationPlan.filter(p => p.id === ONLY_ID);
    if (plan.length === 0) {
      console.error(`❌ No property found with id=${ONLY_ID}`);
      process.exit(1);
    }
  } else if (LIMIT) {
    plan = migrationPlan.slice(0, LIMIT);
  }

  const totalImages = plan.reduce((sum, p) => sum + p.urls.length, 0);
  console.log(`🖼️  Total unique image URLs to process: ${totalImages}${LIMIT ? ` (limited to first ${LIMIT} properties)` : ONLY_ID ? ` (only ${ONLY_ID})` : ''}`);
  if (LIMIT && migrationPlan.length > LIMIT) {
    console.log(`   (${migrationPlan.length - LIMIT} properties will be skipped in this run)`);
  }

  // ── DRY-RUN: estimate size via HEAD requests on first 10 URLs ──────────────
  if (isDryRun) {
    console.log('\n📊 DRY-RUN: Sampling first 10 unique URLs to estimate file sizes...\n');
    const sample = plan.flatMap(p => p.urls).slice(0, 10);
    let totalSampleBytes = 0;
    let successCount = 0;
    for (const url of sample) {
      const result = await fetchWithRetry(url, { method: 'HEAD' });
      if (result.ok && result.response) {
        const cl = result.response.headers.get('content-length');
        if (cl) {
          totalSampleBytes += parseInt(cl, 10);
          successCount++;
          console.log(`  HEAD ${url.substring(0, 80)}...`);
          console.log(`       → ${Math.round(parseInt(cl, 10) / 1024)} KB`);
        }
      } else {
        console.log(`  HEAD ${url.substring(0, 80)}... → FAILED (${result.error || result.status})`);
      }
    }

    if (successCount > 0) {
      const avgBytes = totalSampleBytes / successCount;
      const estimatedTotalMB = Math.round((avgBytes * totalImages) / 1024 / 1024);
      console.log(`\n📐 Estimated average file size: ${Math.round(avgBytes / 1024)} KB`);
      console.log(`📦 Estimated total storage needed: ~${estimatedTotalMB} MB for ${totalImages} files`);
    }

    // Check how many are already in bucket for each property
    console.log('\n🗂️  Checking existing files in bucket (first 5 properties)...\n');
    let alreadyInBucket = 0;
    for (const prop of plan.slice(0, 5)) {
      const { data: existing } = await supabase.storage.from(BUCKET).list(prop.id, { limit: 200 });
      const existingNames = new Set((existing || []).map(f => f.name));
      const toUpload = prop.urls.filter(url => !existingNames.has(urlToFilename(url)));
      const toSkip = prop.urls.length - toUpload.length;
      alreadyInBucket += toSkip;
      console.log(`  ${prop.title.substring(0, 50)}: ${prop.urls.length} URLs → ${toUpload.length} to upload, ${toSkip} already in bucket`);
    }

    console.log(`\n✅ DRY-RUN summary:`);
    console.log(`   Properties: ${properties.length}`);
    console.log(`   Total image URLs: ${totalImages}`);
    console.log(`   Already in bucket (sample 5): ${alreadyInBucket}`);
    console.log(`\n⚠️  Run without --dry-run to start the real migration.`);
    return;
  }

  // ── LIVE RUN ───────────────────────────────────────────────────────────────
  const limit = createLimiter(CONCURRENCY);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = join(ROOT, 'scripts', `migration-log-${timestamp}.json`);

  const globalMapping = {};       // oldUrl → newPublicUrl
  const globalErrors = [];        // { propertyId, title, urls: [{ url, error }] }

  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let propertiesMigrated = 0;
  let propertiesWithErrors = 0;

  for (let pi = 0; pi < plan.length; pi++) {
    const prop = plan[pi];
    console.log(`\n[${pi + 1}/${plan.length}] 🏡 "${prop.title}" (${prop.id})`);
    console.log(`      URLs: ${prop.urls.length}`);

    // Fetch existing files in bucket for this property
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET)
      .list(prop.id, { limit: 500 });
    const existingNames = new Set((existingFiles || []).map(f => f.name));

    const propertyMapping = {};   // oldUrl → newPublicUrl for this property
    const propertyErrors = [];    // { url, error }

    // Process URLs sequentially (to respect rate limits)
    for (let ji = 0; ji < prop.urls.length; ji++) {
      const url = prop.urls[ji];
      const filename = urlToFilename(url);
      const storagePath = `${prop.id}/${filename}`;

      // Skip if already uploaded
      if (existingNames.has(filename)) {
        const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        propertyMapping[url] = pubData.publicUrl;
        globalMapping[url] = pubData.publicUrl;
        totalSkipped++;
        console.log(`  [${ji + 1}/${prop.urls.length}] ⏭️  SKIP  ${filename}`);
        continue;
      }

      // Fetch image
      const fetchResult = await fetchWithRetry(url);
      if (!fetchResult.ok || !fetchResult.response) {
        const errMsg = fetchResult.error || `HTTP ${fetchResult.status}`;
        propertyErrors.push({ url, error: errMsg });
        totalFailed++;
        console.log(`  [${ji + 1}/${prop.urls.length}] ❌ FAIL  ${url.substring(0, 70)}`);
        console.log(`       Error: ${errMsg}`);
        continue;
      }

      const contentType = fetchResult.response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        propertyErrors.push({ url, error: `Non-image content-type: ${contentType}` });
        totalFailed++;
        console.log(`  [${ji + 1}/${prop.urls.length}] ❌ FAIL  not an image (${contentType})`);
        continue;
      }

      const buffer = await fetchResult.response.arrayBuffer();

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType, upsert: false });

      if (uploadErr && uploadErr.message !== 'The resource already exists') {
        propertyErrors.push({ url, error: uploadErr.message });
        totalFailed++;
        console.log(`  [${ji + 1}/${prop.urls.length}] ❌ FAIL  upload error: ${uploadErr.message}`);
        continue;
      }

      // Get public URL
      const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      propertyMapping[url] = pubData.publicUrl;
      globalMapping[url] = pubData.publicUrl;
      totalUploaded++;
      console.log(`  [${ji + 1}/${prop.urls.length}] ✅ DONE  ${filename}`);

      // Throttle
      await sleep(PAUSE_MS);
    }

    // Only update DB if ALL urls succeeded
    if (propertyErrors.length > 0) {
      propertiesWithErrors++;
      globalErrors.push({
        propertyId: prop.id,
        title: prop.title,
        urls: propertyErrors,
      });
      console.log(`  ⚠️  Skipping DB update for "${prop.title}" — ${propertyErrors.length} failed URL(s)`);
      continue;
    }

    // Build new values
    const newMainImageUrl = prop.main_image_url
      ? (propertyMapping[prop.main_image_url] || prop.main_image_url)
      : prop.main_image_url;

    const newGalleryUrls = (prop.gallery_urls || []).map(u => propertyMapping[u] || u);

    // Update DB
    const { error: updateErr } = await supabase
      .from('properties')
      .update({
        main_image_url: newMainImageUrl,
        gallery_urls: newGalleryUrls,
      })
      .eq('id', prop.id);

    if (updateErr) {
      propertiesWithErrors++;
      globalErrors.push({
        propertyId: prop.id,
        title: prop.title,
        urls: [{ url: 'DB_UPDATE', error: updateErr.message }],
      });
      console.log(`  ❌ DB update failed: ${updateErr.message}`);
    } else {
      propertiesMigrated++;
      console.log(`  💾 DB updated successfully.`);
    }
  }

  // ── Save log ───────────────────────────────────────────────────────────────
  const logData = {
    timestamp: new Date().toISOString(),
    mode: 'live',
    summary: {
      totalProperties: properties.length,
      propertiesMigrated,
      propertiesWithErrors,
      totalUploaded,
      totalSkipped,
      totalFailed,
    },
    errors: globalErrors,
    mapping: globalMapping,
  };

  try {
    const scriptsDir = join(ROOT, 'scripts');
    if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf-8');
    console.log(`\n📄 Full log saved to: ${logPath}`);
  } catch (e) {
    console.error('⚠️  Could not save log file:', e.message);
  }

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 MIGRATION SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total properties (DB):         ${properties.length}`);
  console.log(`  Properties processed:          ${plan.length}${LIMIT ? ` (--limit=${LIMIT})` : ''}`);
  console.log(`  Properties fully migrated:     ${propertiesMigrated}`);
  console.log(`  Properties with errors:        ${propertiesWithErrors}`);
  console.log(`  Total images uploaded:         ${totalUploaded}`);
  console.log(`  Total images skipped (exists): ${totalSkipped}`);
  console.log(`  Total images failed:           ${totalFailed}`);

  if (globalErrors.length > 0) {
    console.log(`\n❌ First ${Math.min(5, globalErrors.length)} error(s):`);
    globalErrors.slice(0, 5).forEach(e => {
      console.log(`  • ${e.title} (${e.propertyId})`);
      e.urls.slice(0, 2).forEach(u => console.log(`    - ${u.error}`));
    });
  }
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
