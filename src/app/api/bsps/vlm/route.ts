import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/bsps/vlm
 * Analyze a photo using VLM to extract location information
 * Body: { imagePath: string, prompt?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { imagePath, prompt } = await request.json();

    if (!imagePath) {
      return NextResponse.json({ error: 'imagePath diperlukan' }, { status: 400 });
    }

    // Resolve the image path relative to public directory
    const publicDir = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicDir, imagePath);

    // Security check - ensure path is within public directory
    if (!fullPath.startsWith(publicDir)) {
      return NextResponse.json({ error: 'Path tidak valid' }, { status: 400 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    // Create VLM request
    const zai = await ZAI.create();

    const defaultPrompt = `Analisis foto rumah ini untuk program BSPS (Bantuan Stimulan Perumahan Swadaya) di Desa Cibeet, Kecamatan Ibun, Kabupaten Bandung, Jawa Barat.

Perhatikan hal-hal berikut:
1. Apakah ada papan identitas BSPS yang terlihat? Jika ada, baca informasi yang tertulis (nama, alamat, RT/RW, dll)
2. Apakah ada tanda alamat, nomor rumah, atau penanda lokasi lainnya?
3. Apakah ada bangunan atau landmark yang bisa mengidentifikasi lokasi?
4. Jelaskan kondisi rumah secara singkat (atap, dinding, lantai, dll)

Jawab dalam format JSON:
{
  "bspBoard": { "visible": false, "text": "" },
  "addressMarker": { "visible": false, "text": "" },
  "landmarks": "",
  "houseCondition": "",
  "estimatedLocation": ""
}`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || defaultPrompt },
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

    const analysis = response.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      imagePath,
      analysis,
    });
  } catch (error) {
    console.error('VLM analysis error:', error);
    return NextResponse.json(
      { error: `Gagal menganalisis foto: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
