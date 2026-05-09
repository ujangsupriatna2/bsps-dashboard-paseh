import { NextRequest, NextResponse } from "next/server";
import bspsData from "@/data/bsps-data.json";

/**
 * GET /api/bsps
 * Fetch all BSPS data with optional filtering by kategori, kecamatan, desa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const kategori = searchParams.get("kategori");
    const kecamatan = searchParams.get("kecamatan");
    const desa = searchParams.get("desa");
    const search = searchParams.get("search");

    let filtered = [...bspsData];

    if (kategori) {
      filtered = filtered.filter((d) => d.kategori === kategori);
    }
    if (kecamatan) {
      filtered = filtered.filter((d) => d.kecamatan === kecamatan);
    }
    if (desa) {
      filtered = filtered.filter((d) => d.desa === desa);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.nama.toLowerCase().includes(q) ||
          (d.nik && d.nik.toLowerCase().includes(q)) ||
          (d.kk && d.kk.toLowerCase().includes(q)) ||
          (d.alamat && d.alamat.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      data: filtered,
      pagination: {
        page: 1,
        limit: filtered.length,
        total: filtered.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching BSPS data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data BSPS" },
      { status: 500 }
    );
  }
}
