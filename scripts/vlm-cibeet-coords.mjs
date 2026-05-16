#!/usr/bin/env bun
/**
 * VLM Batch Coordinate Extraction for Desa Cibeet
 * 
 * Extracts GPS coordinates and personal data from BSPS documentation photos
 * using the VLM (Vision Language Model) API.
 * 
 * Usage:
 *   bun run scripts/vlm-cibeet-coords.mjs
 *   bun run scripts/vlm-cibeet-coords.mjs --delay 30
 *   bun run scripts/vlm-cibeet-coords.mjs --force
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(import.meta.dir, '../src/data/bsps-data.json');
const RESULTS_FILE = path.join(import.meta.dir, '../src/data/vlm-cibeet-results.json');
const PHOTO_BASE = path.join(import.meta.dir, '../public');

const DELAY_MS = parseInt(process.argv.find(a => a.startsWith('--delay='))?.split('=')[1] || '20') * 1000;
const FORCE = process.argv.includes('--force');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractFromPhoto(zai, photoPath, nama) {
  const imageBuffer = fs.readFileSync(photoPath);
  const base64Image = imageBuffer.toString('base64');
  
  const prompt = `Analisis foto dokumentasi BSPS ini untuk penerima bernama ${nama} di Desa Cibeet, Kecamatan Ibun, Kabupaten Bandung.

Perhatikan hal-hal berikut:
1. Apakah ada papan/plang BSPS yang terlihat? Baca informasi yang tertulis
2. Apakah ada koordinat GPS (latitude/longitude) yang terlihat di foto?
3. Apakah ada tanda alamat, nomor rumah, atau penanda lokasi?
4. Jelaskan kondisi rumah

Jawab dalam format JSON:
{
  "nama": "",
  "nik": "",
  "kk": "",
  "alamat": "",
  "rt": "",
  "rw": "",
  "latitude": null,
  "longitude": null,
  "houseCondition": "",
  "bspBoard": { "visible": false, "text": "" },
  "addressMarker": { "visible": false, "text": "" },
  "gpsCoords": { "found": false, "lat": null, "lng": null },
  "notes": ""
}`;

  const response = await zai.chat.completions.createVision({
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
      ]
    }],
    thinking: { type: 'disabled' }
  });

  return response.choices[0]?.message?.content;
}

async function main() {
  console.log('🚀 VLM Batch Coordinate Extraction - Desa Cibeet');
  console.log(`   Delay: ${DELAY_MS/1000}s between calls`);
  console.log(`   Force: ${FORCE ? 'Yes' : 'No'}`);
  console.log('');

  // Load data
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const cibeetEntries = data.filter(d => d.desa === 'Cibeet');
  console.log(`📋 Found ${cibeetEntries.length} Cibeet entries`);

  // Load existing results
  let results = {};
  if (fs.existsSync(RESULTS_FILE)) {
    results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    console.log(`📂 Loaded ${Object.keys(results).length} existing results`);
  }

  // Initialize VLM
  const zai = await ZAI.create();
  console.log('✅ VLM SDK initialized\n');

  let processed = 0;
  let failed = 0;

  for (const entry of cibeetEntries) {
    const id = entry.id;
    
    // Skip if already processed and not forcing
    if (!FORCE && results[id]) {
      console.log(`⏭️  Skipping ${entry.nama} (id ${id}) - already processed`);
      continue;
    }

    // Find photo folder
    const folderPath = entry.folderPath;
    if (!folderPath) {
      console.log(`⚠️  Skipping ${entry.nama} (id ${id}) - no folder path`);
      results[id] = { nama: entry.nama, status: 'no_folder', analyzedAt: new Date().toISOString() };
      continue;
    }

    const fullFolderPath = path.join(PHOTO_BASE, folderPath);
    if (!fs.existsSync(fullFolderPath)) {
      console.log(`⚠️  Skipping ${entry.nama} (id ${id}) - folder not found: ${fullFolderPath}`);
      results[id] = { nama: entry.nama, status: 'folder_missing', analyzedAt: new Date().toISOString() };
      continue;
    }

    // Find depan.jpg or first .jpg
    const files = fs.readdirSync(fullFolderPath).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
    const depanFile = files.find(f => f.toLowerCase() === 'depan.jpg' || f.toLowerCase() === 'depan.jpeg');
    const photoFile = depanFile || files[0];

    if (!photoFile) {
      console.log(`⚠️  Skipping ${entry.nama} (id ${id}) - no photos`);
      results[id] = { nama: entry.nama, status: 'no_photos', analyzedAt: new Date().toISOString() };
      continue;
    }

    const photoPath = path.join(fullFolderPath, photoFile);
    console.log(`📸 Processing ${entry.nama} (id ${id}) - ${photoFile}`);

    // Try with exponential backoff
    let attempt = 0;
    let success = false;
    while (attempt < 5 && !success) {
      try {
        const vlmResult = await extractFromPhoto(zai, photoPath, entry.nama);
        
        results[id] = {
          nama: entry.nama,
          status: 'success',
          photo: photoFile,
          vlmAnalysis: vlmResult,
          currentCoords: { lat: entry.lat, lng: entry.lng },
          analyzedAt: new Date().toISOString()
        };

        // Save incremental results
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

        console.log(`   ✅ Success`);
        success = true;
        processed++;
      } catch (error) {
        if (error.message?.includes('429')) {
          const waitTime = 30 * Math.pow(2, attempt);
          console.log(`   ⏳ Rate limited. Waiting ${waitTime}s before retry...`);
          await sleep(waitTime * 1000);
          attempt++;
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          results[id] = { nama: entry.nama, status: 'error', error: error.message, analyzedAt: new Date().toISOString() };
          fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
          failed++;
          break;
        }
      }
    }

    if (!success && attempt >= 5) {
      console.log(`   ❌ Max retries exceeded for ${entry.nama}`);
      results[id] = { nama: entry.nama, status: 'max_retries', analyzedAt: new Date().toISOString() };
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      failed++;
    }

    // Delay between calls
    if (processed < cibeetEntries.length) {
      console.log(`   ⏳ Waiting ${DELAY_MS/1000}s...`);
      await sleep(DELAY_MS);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Summary:`);
  console.log(`   Total Cibeet entries: ${cibeetEntries.length}`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Skipped: ${cibeetEntries.length - processed - failed}`);
  console.log(`   Results saved to: ${RESULTS_FILE}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
