import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

// Photo labels mapping
const PHOTO_LABELS: Record<string, string> = {
  depan: "Depan",
  belakang: "Belakang",
  kiri: "Samping Kiri",
  kanan: "Samping Kanan",
  atas: "Bagian Atas",
  dalam: "Dalam Rumah",
  dapur: "Dapur",
  sanitasi: "Kamar Mandi",
  atap: "Atap",
  fotobareng: "Foto Bareng",
  bersama: "Foto Bersama",
};

// Ordered list for display
const PHOTO_ORDER = [
  "depan",
  "belakang",
  "kiri",
  "kanan",
  "atas",
  "dalam",
  "dapur",
  "sanitasi",
];

/**
 * GET /api/bsps/dokumentasi?id=xxx
 * Returns available documentation photos for a BSPS entry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter wajib diisi" },
        { status: 400 }
      );
    }

    const entry = await db.bspsData.findUnique({ where: { id } });

    if (!entry) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!entry.folderPath) {
      return NextResponse.json({
        id: entry.id,
        nama: entry.nama,
        photos: PHOTO_ORDER.map((key) => ({
          key,
          label: PHOTO_LABELS[key],
          exists: false,
          url: null,
        })),
      });
    }

    // Check which photos exist
    const publicDir = path.join(process.cwd(), "public", entry.folderPath.replace(/^\//, ""));

    const photos = PHOTO_ORDER.map((key) => {
      // Check both .jpg and .jpeg
      const jpgPath = path.join(publicDir, `${key}.jpg`);
      const jpegPath = path.join(publicDir, `${key}.jpeg`);

      let exists = false;
      let ext = "";

      if (fs.existsSync(jpgPath)) {
        exists = true;
        ext = ".jpg";
      } else if (fs.existsSync(jpegPath)) {
        exists = true;
        ext = ".jpeg";
      }

      return {
        key,
        label: PHOTO_LABELS[key],
        exists,
        url: exists ? `${entry.folderPath}/${key}${ext}` : null,
      };
    });

    // Also find any extra photos not in the standard list
    let extraPhotos: { key: string; label: string; exists: boolean; url: string }[] = [];
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      for (const file of files) {
        const baseName = file.replace(/\.(jpg|jpeg)$/i, "").toLowerCase();
        if (!PHOTO_ORDER.includes(baseName) && PHOTO_LABELS[baseName]) {
          extraPhotos.push({
            key: baseName,
            label: PHOTO_LABELS[baseName],
            exists: true,
            url: `${entry.folderPath}/${file}`,
          });
        }
      }
    }

    return NextResponse.json({
      id: entry.id,
      nama: entry.nama,
      photos: [...photos, ...extraPhotos],
    });
  } catch (error) {
    console.error("Error fetching dokumentasi:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dokumentasi" },
      { status: 500 }
    );
  }
}
