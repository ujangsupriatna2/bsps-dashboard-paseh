import { NextRequest, NextResponse } from "next/server";
import bspsData from "@/data/bsps-data.json";
import photoManifest from "@/data/photo-manifest.json";

// BSPS Standard Photo Labels
const BSPS_LABELS: Record<string, string> = {
  depan: "Tampak Depan Rumah",
  "depan-2": "Tampak Depan Rumah (2)",
  "depan-3": "Tampak Depan Rumah (3)",
  "samping-kiri": "Tampak Samping Kiri",
  "samping-kiri-2": "Tampak Samping Kiri (2)",
  "samping-kanan": "Tampak Samping Kanan",
  belakang: "Tampak Belakang Rumah",
  "dalam-ruang-utama": "Dalam Rumah - Ruang Utama",
  "dalam-kamar": "Dalam Rumah - Kamar",
  "dalam-dapur": "Dalam Rumah - Dapur",
  "dalam-dapur-2": "Dalam Rumah - Dapur (2)",
  "dalam-lantai": "Dalam Rumah - Lantai",
  "dalam-atap": "Dalam Rumah - Atap/Plafon",
  "dalam-atap-2": "Dalam Rumah - Atap/Plafon (2)",
  "dalam-atap-3": "Dalam Rumah - Atap/Plafon (3)",
  "dalam-atap-4": "Dalam Rumah - Atap/Plafon (4)",
  "dalam-atap-5": "Dalam Rumah - Atap/Plafon (5)",
  "kerusakan-dinding": "Kerusakan - Dinding Rusak",
  "kerusakan-dinding-2": "Kerusakan - Dinding Rusak (2)",
  "kerusakan-dinding-3": "Kerusakan - Dinding Rusak (3)",
  "kerusakan-atap": "Kerusakan - Atap Bocor",
  "kerusakan-atap-2": "Kerusakan - Atap Bocor (2)",
  "kerusakan-atap-3": "Kerusakan - Atap Bocor (3)",
  "kerusakan-atap-4": "Kerusakan - Atap Bocor (4)",
  "kerusakan-atap-5": "Kerusakan - Atap Bocor (5)",
  "kerusakan-pondasi": "Kerusakan - Pondasi",
  "kerusakan-lantai": "Kerusakan - Lantai Tanah",
  "foto-penerima": "Foto Penerima Bantuan",
  "foto-bersama": "Foto Bersama Papan BSPS",
  "kamar-mandi": "Kamar Mandi / Sanitasi",
  // Legacy labels (for Desa Loa photos)
  atas: "Bagian Atas / Atap",
  dalam: "Dalam Rumah",
  dapur: "Dapur",
  sanitasi: "Kamar Mandi",
  atap: "Atap",
  fotobareng: "Foto Bareng",
  bersama: "Foto Bersama Penerima",
  kamarmandi: "Kamar Mandi / Sanitasi",
  lantai: "Lantai",
  pencahayaan: "Pencahayaan",
  tihang: "Tiang Penyangga",
  pondasi: "Pondasi",
  // Numbered photos (additional angles)
  "1": "Foto Tambahan (1)",
  "2": "Foto Tambahan (2)",
  "3": "Foto Tambahan (3)",
  "4": "Foto Tambahan (4)",
  "kanan-1": "Tampak Samping Kanan (1)",
  kiri: "Tampak Samping Kiri",
  kanan: "Tampak Samping Kanan",
};

// Ordered list for display priority
const PHOTO_ORDER = [
  "depan",
  "depan-2",
  "depan-3",
  "samping-kiri",
  "samping-kiri-2",
  "samping-kanan",
  "belakang",
  "dalam-ruang-utama",
  "dalam-kamar",
  "dalam-dapur",
  "dalam-dapur-2",
  "dalam-lantai",
  "dalam-atap",
  "dalam-atap-2",
  "dalam-atap-3",
  "dalam-atap-4",
  "dalam-atap-5",
  "kerusakan-dinding",
  "kerusakan-dinding-2",
  "kerusakan-dinding-3",
  "kerusakan-atap",
  "kerusakan-atap-2",
  "kerusakan-atap-3",
  "kerusakan-atap-4",
  "kerusakan-atap-5",
  "kerusakan-pondasi",
  "kerusakan-lantai",
  "kamar-mandi",
  "foto-penerima",
  "foto-bersama",
  // Legacy order
  "atas",
  "dalam",
  "dapur",
  "sanitasi",
  "atap",
  "fotobareng",
  "bersama",
  "kamarmandi",
  "lantai",
  "pencahayaan",
  "tihang",
  "pondasi",
  "kiri",
  "kanan",
  "kanan-1",
  "1",
  "2",
  "3",
  "4",
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
        photos: [],
      });
    }

    // Convert folderPath like "/dokumentasi/aam" to "dokumentasi/aam"
    const manifestKey = entry.folderPath.replace(/^\//, "");

    // Look up existing photos from the manifest
    const existingFiles: string[] =
      (photoManifest as Record<string, string[]>)[manifestKey] || [];

    if (existingFiles.length === 0) {
      return NextResponse.json({
        id: entry.id,
        nama: entry.nama,
        photos: [],
      });
    }

    // Build photo list from actual existing files
    const photos = existingFiles
      .map((f) => {
        const baseName = f.replace(/\.[^.]+$/, "");
        const rawUrl = `/${manifestKey}/${f}`;
        return {
          key: baseName,
          label:
            BSPS_LABELS[baseName] ||
            baseName
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          exists: true,
          url: encodeURI(rawUrl),
        };
      })
      .sort((a, b) => {
        const aIdx = PHOTO_ORDER.indexOf(a.key);
        const bIdx = PHOTO_ORDER.indexOf(b.key);
        // Known keys come first in order, unknown keys at the end
        if (aIdx === -1 && bIdx === -1) return a.key.localeCompare(b.key);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });

    return NextResponse.json({
      id: entry.id,
      nama: entry.nama,
      photos,
    });
  } catch (error) {
    console.error("Error fetching dokumentasi:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dokumentasi" },
      { status: 500 }
    );
  }
}
