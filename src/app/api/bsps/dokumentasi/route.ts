import { NextRequest, NextResponse } from "next/server";
import bspsData from "@/data/bsps-data.json";
import photoManifest from "@/data/photo-manifest.json";

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

    const entry = bspsData.find((d) => d.id === id);

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

    // Convert folderPath like "/dokumentasi/aam" to "dokumentasi/aam"
    const manifestKey = entry.folderPath.replace(/^\//, "");

    // Look up existing photos from the manifest
    const existingFiles: string[] = (photoManifest as Record<string, string[]>)[manifestKey] || [];

    // Build photo list with all standard positions
    const photos = PHOTO_ORDER.map((key) => {
      // Find the file that matches this key (could be .jpg or .jpeg)
      const matchingFile = existingFiles.find(
        (f) => f.toLowerCase().startsWith(key + ".")
      );

      if (matchingFile) {
        const rawUrl = `/${manifestKey}/${matchingFile}`;
        return {
          key,
          label: PHOTO_LABELS[key],
          exists: true,
          url: encodeURI(rawUrl),
        };
      }

      return {
        key,
        label: PHOTO_LABELS[key],
        exists: false,
        url: null,
      };
    });

    // Also add any extra photos not in standard order (fotobareng, bersama, etc.)
    const extraPhotos = existingFiles
      .filter((f) => {
        const baseName = f.replace(/\.[^.]+$/, "").toLowerCase();
        return !PHOTO_ORDER.includes(baseName);
      })
      .map((f) => {
        const baseName = f.replace(/\.[^.]+$/, "");
        const rawUrl = `/${manifestKey}/${f}`;
        return {
          key: baseName,
          label: PHOTO_LABELS[baseName] || baseName.charAt(0).toUpperCase() + baseName.slice(1),
          exists: true,
          url: encodeURI(rawUrl),
        };
      });

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
