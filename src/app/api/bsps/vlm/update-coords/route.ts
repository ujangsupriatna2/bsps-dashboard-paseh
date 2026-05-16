import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const VLM_RESULTS_PATH = path.join(DATA_DIR, 'vlm-results.json');
const BSPS_DATA_PATH = path.join(DATA_DIR, 'bsps-data.json');

const DESA_CENTERS: Record<string, { lat: number; lng: number }> = {
  Cibeet: { lat: -7.085, lng: 107.761 },
  Lampegan: { lat: -7.068, lng: 107.758 },
};

const DELAY_MS = 5000; // 5-second delay between LLM calls

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface VlmResultEntry {
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

interface BspsEntry {
  id: string;
  nama: string;
  alamat: string;
  desa: string;
  rt: string | null;
  rw: string | null;
  lat: number;
  lng: number;
  [key: string]: unknown;
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

/**
 * POST /api/bsps/vlm/update-coords
 * Uses LLM to interpret VLM descriptions and suggest improved coordinates
 * Body: { desa?: "Cibeet" | "Lampegan" | "all", forceUpdate?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      desa?: string;
      forceUpdate?: boolean;
    };
    const desa = body.desa || 'all';
    const forceUpdate = body.forceUpdate || false;

    if (desa !== 'all' && !['Cibeet', 'Lampegan'].includes(desa)) {
      return NextResponse.json(
        { error: 'Parameter desa harus "Cibeet", "Lampegan", atau "all"' },
        { status: 400 }
      );
    }

    // Load data
    const vlmResults = loadJsonFile<{
      lastUpdated: string | null;
      totalProcessed: number;
      results: Record<string, VlmResultEntry>;
    }>(VLM_RESULTS_PATH, { lastUpdated: null, totalProcessed: 0, results: {} });

    const bspsData = loadJsonFile<BspsEntry[]>(BSPS_DATA_PATH, []);

    if (Object.keys(vlmResults.results).length === 0) {
      return NextResponse.json(
        {
          error:
            'Belum ada hasil VLM. Jalankan batch VLM analysis terlebih dahulu.',
        },
        { status: 400 }
      );
    }

    // Filter VLM results that have analysis
    const desaList = desa === 'all' ? ['Cibeet', 'Lampegan'] : [desa];
    const entriesWithAnalysis = Object.values(vlmResults.results).filter(
      (r) =>
        desaList.includes(r.desa) &&
        r.analysis &&
        !r.error &&
        r.analysis !== 'Tidak ada respons'
    );

    if (entriesWithAnalysis.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada entri dengan analisis VLM yang valid untuk desa yang dipilih',
        totalUpdated: 0,
        results: [],
      });
    }

    // Initialize ZAI SDK for LLM
    const zai = await ZAI.create();

    const updateResults: Array<{
      id: string;
      nama: string;
      desa: string;
      oldLat: number;
      oldLng: number;
      newLat: number | null;
      newLng: number | null;
      reasoning: string | null;
      status: 'updated' | 'skipped' | 'error';
      error?: string;
    }> = [];

    let updatedCount = 0;

    for (const vlmEntry of entriesWithAnalysis) {
      // Find corresponding BSPS data entry
      const bspsEntry = bspsData.find((e) => e.id === vlmEntry.id);

      if (!bspsEntry) {
        updateResults.push({
          id: vlmEntry.id,
          nama: vlmEntry.nama,
          desa: vlmEntry.desa,
          oldLat: 0,
          oldLng: 0,
          newLat: null,
          newLng: null,
          reasoning: null,
          status: 'error',
          error: 'Entri BSPS tidak ditemukan',
        });
        continue;
      }

      // Skip if already has precise coordinates and not forcing update
      if (!forceUpdate && bspsEntry.lat !== 0 && bspsEntry.lng !== 0) {
        // Check if coordinates are already precise (not just the desa center)
        const center = DESA_CENTERS[bspsEntry.desa];
        if (
          center &&
          Math.abs(bspsEntry.lat - center.lat) > 0.001 &&
          Math.abs(bspsEntry.lng - center.lng) > 0.001
        ) {
          updateResults.push({
            id: vlmEntry.id,
            nama: vlmEntry.nama,
            desa: vlmEntry.desa,
            oldLat: bspsEntry.lat,
            oldLng: bspsEntry.lng,
            newLat: null,
            newLng: null,
            reasoning: 'Koordinat sudah cukup presisi',
            status: 'skipped',
          });
          continue;
        }
      }

      const desaCenter = DESA_CENTERS[vlmEntry.desa];

      try {
        const llmPrompt = `Kamu adalah asisten GIS untuk program BSPS di Kecamatan Ibun, Kabupaten Bandung, Jawa Barat, Indonesia.

Berikut adalah informasi tentang sebuah rumah penerima bantuan BSPS:

- Nama: ${vlmEntry.nama}
- Alamat: ${vlmEntry.alamat}
- RT/RW: ${vlmEntry.rt || '-'}/${vlmEntry.rw || '-'}
- Desa: ${vlmEntry.desa}
- Koordinat saat ini: ${bspsEntry.lat}, ${bspsEntry.lng}
- Pusat Desa ${vlmEntry.desa}: lat ${desaCenter?.lat}, lng ${desaCenter?.lng}

Analisis VLM dari foto depan rumah:
${vlmEntry.analysis}

Berdasarkan informasi di atas, berikan estimasi koordinat yang lebih akurat untuk rumah ini. Pertimbangkan:
1. Informasi alamat dan RT/RW - RT yang lebih tinggi biasanya lebih jauh dari pusat desa
2. Nama kampung/kp yang disebutkan dalam alamat
3. Ciri-ciri lingkungan dari analisis VLM
4. Koordinat pusat desa sebagai referensi
5. Offset tipikal antar RT dalam desa di daerah pedesaan Jawa Barat (sekitar 0.001-0.005 derajat)

Jawab HANYA dalam format JSON berikut (tanpa markdown code block):
{
  "estimatedLat": <number>,
  "estimatedLng": <number>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<penjelasan singkat mengapa koordinat ini dipilih>"
}`;

        const response = await zai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah asisten GIS yang ahli dalam estimasi koordinat berdasarkan informasi alamat dan deskripsi visual di daerah pedesaan Jawa Barat, Indonesia. Selalu jawab dalam format JSON yang diminta.',
            },
            {
              role: 'user',
              content: llmPrompt,
            },
          ],
          temperature: 0.3,
        });

        const llmResponse = response.choices[0]?.message?.content || '';

        // Parse the LLM response - try to extract JSON
        let parsed: {
          estimatedLat?: number;
          estimatedLng?: number;
          confidence?: string;
          reasoning?: string;
        } = {};

        try {
          // Try direct JSON parse first
          parsed = JSON.parse(llmResponse);
        } catch {
          // Try to extract JSON from markdown code block
          const jsonMatch = llmResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[1].trim());
            } catch {
              // If still can't parse, try to find any JSON object
              const objectMatch = llmResponse.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                parsed = JSON.parse(objectMatch[0]);
              }
            }
          } else {
            // Try to find any JSON object in the response
            const objectMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (objectMatch) {
              parsed = JSON.parse(objectMatch[0]);
            }
          }
        }

        const newLat = parsed.estimatedLat ?? null;
        const newLng = parsed.estimatedLng ?? null;
        const reasoning =
          parsed.reasoning ||
          `Confidence: ${parsed.confidence || 'unknown'}`;

        if (
          newLat !== null &&
          newLng !== null &&
          !isNaN(newLat) &&
          !isNaN(newLng) &&
          newLat >= -7.2 &&
          newLat <= -6.9 &&
          newLng >= 107.6 &&
          newLng <= 107.9
        ) {
          // Update the BSPS data entry
          const entryIndex = bspsData.findIndex((e) => e.id === vlmEntry.id);
          if (entryIndex !== -1) {
            bspsData[entryIndex].lat = newLat;
            bspsData[entryIndex].lng = newLng;

            // Add VLM metadata
            bspsData[entryIndex].vlmAnalysis = vlmEntry.analysis;
            bspsData[entryIndex].vlmCoordConfidence = parsed.confidence || 'unknown';
            bspsData[entryIndex].vlmCoordReasoning = reasoning;
            bspsData[entryIndex].vlmUpdatedAt = new Date().toISOString();
          }

          updateResults.push({
            id: vlmEntry.id,
            nama: vlmEntry.nama,
            desa: vlmEntry.desa,
            oldLat: bspsEntry.lat,
            oldLng: bspsEntry.lng,
            newLat,
            newLng,
            reasoning,
            status: 'updated',
          });

          updatedCount++;
        } else {
          updateResults.push({
            id: vlmEntry.id,
            nama: vlmEntry.nama,
            desa: vlmEntry.desa,
            oldLat: bspsEntry.lat,
            oldLng: bspsEntry.lng,
            newLat,
            newLng,
            reasoning: `Koordinat tidak valid atau di luar jangkauan: ${newLat}, ${newLng}`,
            status: 'error',
            error: 'Koordinat tidak valid',
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        updateResults.push({
          id: vlmEntry.id,
          nama: vlmEntry.nama,
          desa: vlmEntry.desa,
          oldLat: bspsEntry.lat,
          oldLng: bspsEntry.lng,
          newLat: null,
          newLng: null,
          reasoning: null,
          status: 'error',
          error: errorMessage,
        });
      }

      // Save intermediate results
      fs.writeFileSync(BSPS_DATA_PATH, JSON.stringify(bspsData, null, 2));

      // Delay between LLM calls
      if (updatedCount < entriesWithAnalysis.length) {
        await delay(DELAY_MS);
      }
    }

    // Final save
    fs.writeFileSync(BSPS_DATA_PATH, JSON.stringify(bspsData, null, 2));

    const skippedCount = updateResults.filter(
      (r) => r.status === 'skipped'
    ).length;
    const errorCount = updateResults.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      desa: desaList,
      totalAnalyzed: entriesWithAnalysis.length,
      totalUpdated: updatedCount,
      skippedCount,
      errorCount,
      results: updateResults,
    });
  } catch (error) {
    console.error('Coordinate update error:', error);
    return NextResponse.json(
      {
        error: `Gagal memperbarui koordinat: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bsps/vlm/update-coords
 * Preview what would be updated without actually updating
 */
export async function GET() {
  try {
    const vlmResults = loadJsonFile<{
      lastUpdated: string | null;
      totalProcessed: number;
      results: Record<string, VlmResultEntry>;
    }>(VLM_RESULTS_PATH, { lastUpdated: null, totalProcessed: 0, results: {} });

    const bspsData = loadJsonFile<BspsEntry[]>(BSPS_DATA_PATH, []);

    const entriesWithAnalysis = Object.values(vlmResults.results).filter(
      (r) => r.analysis && !r.error && r.analysis !== 'Tidak ada respons'
    );

    const preview = entriesWithAnalysis.map((vlmEntry) => {
      const bspsEntry = bspsData.find((e) => e.id === vlmEntry.id);
      const center = DESA_CENTERS[vlmEntry.desa];
      const isAtCenter =
        center &&
        bspsEntry &&
        Math.abs(bspsEntry.lat - center.lat) < 0.001 &&
        Math.abs(bspsEntry.lng - center.lng) < 0.001;

      return {
        id: vlmEntry.id,
        nama: vlmEntry.nama,
        desa: vlmEntry.desa,
        currentLat: bspsEntry?.lat,
        currentLng: bspsEntry?.lng,
        isAtCenter: isAtCenter || false,
        hasVlmAnalysis: true,
        analysisSnippet: vlmEntry.analysis?.substring(0, 200),
      };
    });

    return NextResponse.json({
      totalWithAnalysis: entriesWithAnalysis.length,
      totalAtCenter: preview.filter((p) => p.isAtCenter).length,
      totalCanBeUpdated: preview.filter((p) => p.isAtCenter || !p.currentLat).length,
      preview,
    });
  } catch (error) {
    console.error('Preview coordinate update error:', error);
    return NextResponse.json(
      {
        error: `Gagal memuat preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
