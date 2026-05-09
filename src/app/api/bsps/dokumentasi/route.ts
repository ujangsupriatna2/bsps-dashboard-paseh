import { NextRequest, NextResponse } from "next/server";
import bspsData from "@/data/bsps-data.json";

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

    // For Vercel/JSON mode, we just return placeholders
    // In production with real file hosting, this would check actual files
    const photos = PHOTO_ORDER.map((key) => ({
      key,
      label: PHOTO_LABELS[key],
      exists: false,
      url: null,
    }));

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
