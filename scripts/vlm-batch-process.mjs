/**
 * VLM Batch Process Script
 *
 * Standalone script that processes all Cibeet and Lampegan photos through VLM.
 * Uses 15-second delays between API calls and exponential backoff on rate limit errors.
 *
 * Usage: bun run scripts/vlm-batch-process.mjs
 *
 * Options:
 *   --desa=Cibeet|Lampegan|all   Which desa to process (default: all)
 *   --delay=15000                Delay between calls in ms (default: 15000)
 *   --max-retries=5              Max retries on rate limit errors (default: 5)
 *   --force                      Re-analyze even if already analyzed
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const VLM_RESULTS_PATH = path.join(DATA_DIR, 'vlm-results.json');
const BSPS_DATA_PATH = path.join(DATA_DIR, 'bsps-data.json');
const MANIFEST_PATH = path.join(DATA_DIR, 'photo-manifest.json');

const DESA_CONFIG = {
  Cibeet: { center: [-7.085, 107.761], folder: 'cibeet' },
  Lampegan: { center: [-7.068, 107.758], folder: 'lampegan' },
};

// Parse command line args
const args = process.argv.slice(2);
const desaArg = args.find(a => a.startsWith('--desa='))?.split('=')[1] || 'all';
const delayMs = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '15000', 10);
const maxRetries = parseInt(args.find(a => a.startsWith('--max-retries='))?.split('=')[1] || '5', 10);
const forceReanalyze = args.includes('--force');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.warn(`Warning: Could not load ${filePath}: ${e.message}`);
  }
  return fallback;
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function findDepanPhoto(manifest, folderPath) {
  if (!folderPath) return null;

  const normalizedPath = folderPath.startsWith('/') ? folderPath.slice(1) : folderPath;
  const photos = manifest[normalizedPath];

  if (!photos || photos.length === 0) return null;

  // First try to find "depan" photo
  const depanPhoto = photos.find(p => /^depan/i.test(p));
  if (depanPhoto) {
    return `${normalizedPath}/${depanPhoto}`;
  }

  // Fallback: first image file
  const imagePhoto = photos.find(p => /\.(jpg|jpeg|png|webp)$/i.test(p));
  if (imagePhoto) {
    return `${normalizedPath}/${imagePhoto}`;
  }

  return null;
}

async function analyzePhotoWithRetry(zai, fullPath, entry, maxRetries) {
  const imageBuffer = fs.readFileSync(fullPath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  const prompt = `Analisis foto rumah ini untuk program BSPS (Bantuan Stimulan Perumahan Swadaya) di Desa ${entry.desa}, Kecamatan Ibun, Kabupaten Bandung, Jawa Barat.

Nama penerima: ${entry.nama}
Alamat: ${entry.alamat}
RT/RW: ${entry.rt || '-'}/${entry.rw || '-'}

Perhatikan hal-hal berikut:
1. Apakah ada papan BSPS, tanda alamat, atau landmark yang terlihat? Jika ada, baca informasi yang tertulis.
2. Jelaskan kondisi rumah (atap, dinding, lantai, dll).
3. Ciri-ciri lingkungan sekitar yang bisa membantu identifikasi lokasi.
4. Jika ada teks atau tulisan yang terlihat, tuliskan semuanya.

Jawab dalam bahasa Indonesia secara ringkas dan terstruktur.`;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await zai.chat.completions.createVision({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
          ]
        }],
        thinking: { type: 'disabled' }
      });

      return {
        analysis: response.choices[0]?.message?.content || 'Tidak ada respons',
        error: null
      };
    } catch (e) {
      lastError = e;
      const isRateLimit = e.message?.includes('429') || e.message?.includes('Too many requests');

      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 30s, 60s, 120s, 240s, 480s
        const backoffMs = 30000 * Math.pow(2, attempt);
        console.log(`  ⚠️  Rate limited. Retrying in ${backoffMs / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await delay(backoffMs);
      } else if (!isRateLimit) {
        // Non-rate-limit error, don't retry
        console.log(`  ❌ Non-rate-limit error: ${e.message}`);
        break;
      }
    }
  }

  return {
    analysis: null,
    error: lastError?.message || 'Unknown error after retries'
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  VLM Batch Process - BSPS Coordinate Extraction');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Desa: ${desaArg}`);
  console.log(`  Delay: ${delayMs}ms`);
  console.log(`  Max retries: ${maxRetries}`);
  console.log(`  Force re-analyze: ${forceReanalyze}`);
  console.log('');

  // Load data
  const bspsData = loadJson(BSPS_DATA_PATH, []);
  const manifest = loadJson(MANIFEST_PATH, {});
  const vlmResults = loadJson(VLM_RESULTS_PATH, {
    lastUpdated: null,
    totalProcessed: 0,
    results: {}
  });

  if (bspsData.length === 0) {
    console.error('❌ No BSPS data found!');
    process.exit(1);
  }

  // Filter entries
  const desaList = desaArg === 'all' ? ['Cibeet', 'Lampegan'] : [desaArg];
  const entries = bspsData.filter(e =>
    desaList.includes(e.desa) && e.folderPath
  );

  console.log(`📊 Found ${entries.length} entries with photos for ${desaList.join(', ')}`);

  // Filter out already-analyzed entries unless force
  const entriesToProcess = forceReanalyze
    ? entries
    : entries.filter(e => {
        const existing = vlmResults.results[e.id];
        return !existing || !existing.analysis || existing.error;
      });

  console.log(`📋 Entries to process: ${entriesToProcess.length} (${entries.length - entriesToProcess.length} already analyzed)`);
  console.log('');

  if (entriesToProcess.length === 0) {
    console.log('✅ All entries already analyzed. Use --force to re-analyze.');
    process.exit(0);
  }

  // Initialize ZAI
  console.log('🔧 Initializing ZAI SDK...');
  const zai = await ZAI.create();
  console.log('✅ ZAI SDK initialized');
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = entries.length - entriesToProcess.length;

  for (let i = 0; i < entriesToProcess.length; i++) {
    const entry = entriesToProcess[i];
    const progress = `[${i + 1}/${entriesToProcess.length}]`;

    console.log(`${progress} Processing: ${entry.nama} (${entry.desa})`);

    // Find the depan photo
    const imageRelativePath = findDepanPhoto(manifest, entry.folderPath);

    if (!imageRelativePath) {
      console.log(`  ⚠️  No depan photo found for ${entry.nama}`);
      vlmResults.results[entry.id] = {
        id: entry.id,
        nama: entry.nama,
        desa: entry.desa,
        alamat: entry.alamat,
        rt: entry.rt,
        rw: entry.rw,
        imagePath: null,
        analysis: null,
        analyzedAt: new Date().toISOString(),
        error: 'Foto depan tidak ditemukan'
      };
      errorCount++;

      // Save intermediate results
      vlmResults.lastUpdated = new Date().toISOString();
      vlmResults.totalProcessed = Object.keys(vlmResults.results).length;
      saveJson(VLM_RESULTS_PATH, vlmResults);
      continue;
    }

    const fullPath = path.join(PUBLIC_DIR, imageRelativePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  Photo file not found: ${fullPath}`);
      vlmResults.results[entry.id] = {
        id: entry.id,
        nama: entry.nama,
        desa: entry.desa,
        alamat: entry.alamat,
        rt: entry.rt,
        rw: entry.rw,
        imagePath: imageRelativePath,
        analysis: null,
        analyzedAt: new Date().toISOString(),
        error: 'File foto tidak ditemukan di disk'
      };
      errorCount++;

      vlmResults.lastUpdated = new Date().toISOString();
      vlmResults.totalProcessed = Object.keys(vlmResults.results).length;
      saveJson(VLM_RESULTS_PATH, vlmResults);
      continue;
    }

    console.log(`  📷 Photo: ${imageRelativePath}`);

    const { analysis, error } = await analyzePhotoWithRetry(zai, fullPath, entry, maxRetries);

    if (analysis) {
      console.log(`  ✅ Analysis received (${analysis.length} chars)`);
      console.log(`  📝 Preview: ${analysis.substring(0, 150).replace(/\n/g, ' ')}...`);
      successCount++;

      vlmResults.results[entry.id] = {
        id: entry.id,
        nama: entry.nama,
        desa: entry.desa,
        alamat: entry.alamat,
        rt: entry.rt,
        rw: entry.rw,
        imagePath: imageRelativePath,
        analysis,
        analyzedAt: new Date().toISOString(),
        error: null
      };
    } else {
      console.log(`  ❌ Error: ${error}`);
      errorCount++;

      vlmResults.results[entry.id] = {
        id: entry.id,
        nama: entry.nama,
        desa: entry.desa,
        alamat: entry.alamat,
        rt: entry.rt,
        rw: entry.rw,
        imagePath: imageRelativePath,
        analysis: null,
        analyzedAt: new Date().toISOString(),
        error
      };
    }

    // Save intermediate results after each entry
    vlmResults.lastUpdated = new Date().toISOString();
    vlmResults.totalProcessed = Object.keys(vlmResults.results).length;
    saveJson(VLM_RESULTS_PATH, vlmResults);

    // Delay between VLM calls
    if (i < entriesToProcess.length - 1) {
      const nextEntry = entriesToProcess[i + 1];
      console.log(`  ⏳ Waiting ${delayMs / 1000}s before next call...`);
      console.log(`  ➡️  Next: ${nextEntry.nama} (${nextEntry.desa})`);
      await delay(delayMs);
    }

    console.log('');
  }

  // Final summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BATCH PROCESS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors:  ${errorCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  📊 Total processed: ${successCount + errorCount + skippedCount}`);
  console.log(`  💾 Results saved to: ${VLM_RESULTS_PATH}`);
  console.log('');

  // Summary by desa
  const allResults = Object.values(vlmResults.results);
  for (const desaName of desaList) {
    const desaResults = allResults.filter(r => r.desa === desaName);
    const desaSuccess = desaResults.filter(r => r.analysis && !r.error).length;
    const desaError = desaResults.filter(r => r.error).length;
    console.log(`  📋 Desa ${desaName}: ${desaSuccess} success, ${desaError} errors, ${desaResults.length} total`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
