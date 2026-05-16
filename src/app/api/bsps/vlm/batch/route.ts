import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const VLM_RESULTS_PATH = path.join(DATA_DIR, 'vlm-results.json');
const BSPS_DATA_PATH = path.join(DATA_DIR, 'bsps-data.json');
const MANIFEST_PATH = path.join(DATA_DIR, 'photo-manifest.json');

const DESA_CONFIG: Record<string, { center: [number, number]; folder: string }> = {
  Cibeet: { center: [-7.085, 107.761], folder: 'cibeet' },
  Lampegan: { center: [-7.068, 107.758], folder: 'lampegan' },
};

const DELAY_MS = 10000; // 10-second delay between VLM calls

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface BspsEntry {
  id: string;
  nama: string;
  alamat: string;
  desa: string;
  rt: string | null;
  rw: string | null;
  folderPath: string | null;
  lat: number;
  lng: number;
  kategori: string;
}

interface VlmResultsFile {
  lastUpdated: string | null;
  totalProcessed: number;
  results: Record<
    string,
    {
      id: string;
      nama: string;
      desa: string;
      alamat: string;
      rt: string | null;
      rw: string | null;
      imagePath: string | null;
      analysis: string | null;
      analyzedAt: string;
      error: string | null;
    }
  >;
}

function loadJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function findDepanPhoto(
  manifest: Record<string, string[]>,
  folderPath: string | null
): string | null {
  if (!folderPath) return null;

  // Strip leading slash from folderPath to match manifest keys
  const normalizedPath = folderPath.startsWith('/') ? folderPath.slice(1) : folderPath;

  const photos = manifest[normalizedPath];
  if (!photos || photos.length === 0) return null;

  // First, try to find a photo starting with "depan"
  const depanPhoto = photos.find((p) =>
    /^depan/i.test(p)
  );
  if (depanPhoto) {
    return `${normalizedPath}/${depanPhoto}`;
  }

  // Fallback: first photo that looks like an image
  const imagePhoto = photos.find((p) => /\.(jpg|jpeg|png|webp)$/i.test(p));
  if (imagePhoto) {
    return `${normalizedPath}/${imagePhoto}`;
  }

  return null;
}

/**
 * POST /api/bsps/vlm/batch
 * Batch analyze photos using VLM
 * Body: { desa: "Cibeet" | "Lampegan" | "all" }
 */
export async function POST(request: NextRequest) {
  try {
    const { desa } = (await request.json()) as { desa: string };

    if (!desa || !['Cibeet', 'Lampegan', 'all'].includes(desa)) {
      return NextResponse.json(
        { error: 'Parameter desa harus "Cibeet", "Lampegan", atau "all"' },
        { status: 400 }
      );
    }

    // Load data files
    const bspsData = loadJsonFile<BspsEntry[]>(BSPS_DATA_PATH, []);
    const manifest = loadJsonFile<Record<string, string[]>>(MANIFEST_PATH, {});
    const vlmResults = loadJsonFile<VlmResultsFile>(VLM_RESULTS_PATH, {
      lastUpdated: null,
      totalProcessed: 0,
      results: {},
    });

    // Determine which desa to process
    const desaList = desa === 'all' ? ['Cibeet', 'Lampegan'] : [desa];

    // Filter entries for selected desa(s) that have a folderPath
    const entries = bspsData.filter(
      (e) => desaList.includes(e.desa) && e.folderPath
    );

    if (entries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada entri dengan foto untuk desa yang dipilih',
        totalProcessed: 0,
        results: [],
      });
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    const batchResults: Array<{
      id: string;
      nama: string;
      desa: string;
      status: 'success' | 'skipped' | 'error';
      analysis?: string;
      error?: string;
    }> = [];

    let processedCount = 0;

    for (const entry of entries) {
      // Skip if already analyzed (unless we want to re-analyze)
      const existingResult = vlmResults.results[entry.id];
      if (existingResult && existingResult.analysis && !existingResult.error) {
        batchResults.push({
          id: entry.id,
          nama: entry.nama,
          desa: entry.desa,
          status: 'skipped',
          analysis: existingResult.analysis,
        });
        continue;
      }

      // Find the "depan" photo
      const imageRelativePath = findDepanPhoto(manifest, entry.folderPath);

      if (!imageRelativePath) {
        batchResults.push({
          id: entry.id,
          nama: entry.nama,
          desa: entry.desa,
          status: 'error',
          error: 'Foto depan tidak ditemukan',
        });

        // Save error result
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
          error: 'Foto depan tidak ditemukan',
        };
        continue;
      }

      const fullPath = path.join(PUBLIC_DIR, imageRelativePath);

      // Security check
      if (!fullPath.startsWith(PUBLIC_DIR)) {
        batchResults.push({
          id: entry.id,
          nama: entry.nama,
          desa: entry.desa,
          status: 'error',
          error: 'Path tidak valid',
        });
        continue;
      }

      if (!fs.existsSync(fullPath)) {
        batchResults.push({
          id: entry.id,
          nama: entry.nama,
          desa: entry.desa,
          status: 'error',
          error: 'File foto tidak ditemukan di disk',
        });

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
          error: 'File foto tidak ditemukan di disk',
        };
        continue;
      }

      try {
        // Read image and convert to base64
        const imageBuffer = fs.readFileSync(fullPath);
        const base64Image = imageBuffer.toString('base64');
        const ext = path.extname(fullPath).toLowerCase();
        const mimeType =
          ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

        const desaConfig = DESA_CONFIG[entry.desa];
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

        const response = await zai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          thinking: { type: 'disabled' },
        });

        const analysis = response.choices[0]?.message?.content || 'Tidak ada respons';

        batchResults.push({
          id: entry.id,
          nama: entry.nama,
          desa: entry.desa,
          status: 'success',
          analysis,
        });

        // Save result
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
          error: null,
        };

        processedCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        batchResults.push({
          id: entry.id,
          nama: entry.nama,
          desa: entry.desa,
          status: 'error',
          error: errorMessage,
        });

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
          error: errorMessage,
        };
      }

      // Save intermediate results after each entry
      vlmResults.lastUpdated = new Date().toISOString();
      vlmResults.totalProcessed = Object.keys(vlmResults.results).length;
      fs.writeFileSync(VLM_RESULTS_PATH, JSON.stringify(vlmResults, null, 2));

      // Delay between VLM calls to avoid rate limiting
      if (processedCount < entries.length) {
        await delay(DELAY_MS);
      }
    }

    // Final save
    vlmResults.lastUpdated = new Date().toISOString();
    vlmResults.totalProcessed = Object.keys(vlmResults.results).length;
    fs.writeFileSync(VLM_RESULTS_PATH, JSON.stringify(vlmResults, null, 2));

    const successCount = batchResults.filter((r) => r.status === 'success').length;
    const errorCount = batchResults.filter((r) => r.status === 'error').length;
    const skippedCount = batchResults.filter((r) => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      desa: desaList,
      totalEntries: entries.length,
      successCount,
      errorCount,
      skippedCount,
      results: batchResults,
    });
  } catch (error) {
    console.error('Batch VLM analysis error:', error);
    return NextResponse.json(
      {
        error: `Gagal memproses batch VLM: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bsps/vlm/batch
 * Get the current batch VLM processing status/results
 */
export async function GET() {
  try {
    const vlmResults = loadJsonFile<VlmResultsFile>(VLM_RESULTS_PATH, {
      lastUpdated: null,
      totalProcessed: 0,
      results: {},
    });

    const resultsList = Object.values(vlmResults.results);
    const byDesa = {
      Cibeet: resultsList.filter((r) => r.desa === 'Cibeet'),
      Lampegan: resultsList.filter((r) => r.desa === 'Lampegan'),
    };

    return NextResponse.json({
      lastUpdated: vlmResults.lastUpdated,
      totalProcessed: vlmResults.totalProcessed,
      summary: {
        Cibeet: {
          total: byDesa.Cibeet.length,
          success: byDesa.Cibeet.filter((r) => r.analysis && !r.error).length,
          error: byDesa.Cibeet.filter((r) => r.error).length,
        },
        Lampegan: {
          total: byDesa.Lampegan.length,
          success: byDesa.Lampegan.filter((r) => r.analysis && !r.error).length,
          error: byDesa.Lampegan.filter((r) => r.error).length,
        },
      },
      results: vlmResults.results,
    });
  } catch (error) {
    console.error('Get VLM results error:', error);
    return NextResponse.json(
      {
        error: `Gagal membaca hasil VLM: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
