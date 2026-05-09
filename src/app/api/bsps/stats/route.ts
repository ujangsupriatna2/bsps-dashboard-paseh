import { NextResponse } from "next/server";
import bspsData from "@/data/bsps-data.json";

/**
 * GET /api/bsps/stats
 * Return stats summary (count by kategori, count by desa, etc.)
 */
export async function GET() {
  try {
    const total = bspsData.length;

    // Count by kategori
    const countByKategori: Record<string, number> = {};
    for (const item of bspsData) {
      countByKategori[item.kategori] = (countByKategori[item.kategori] || 0) + 1;
    }

    // Count by desa
    const countByDesa: Record<string, number> = {};
    for (const item of bspsData) {
      countByDesa[item.desa] = (countByDesa[item.desa] || 0) + 1;
    }

    // Count by kecamatan
    const countByKecamatan: Record<string, number> = {};
    for (const item of bspsData) {
      countByKecamatan[item.kecamatan] = (countByKecamatan[item.kecamatan] || 0) + 1;
    }

    // Count by kategori per desa
    const kategoriPerDesa: Record<string, Record<string, number>> = {};
    for (const item of bspsData) {
      if (!kategoriPerDesa[item.desa]) {
        kategoriPerDesa[item.desa] = {};
      }
      if (!kategoriPerDesa[item.desa][item.kategori]) {
        kategoriPerDesa[item.desa][item.kategori] = 0;
      }
      kategoriPerDesa[item.desa][item.kategori] += 1;
    }

    return NextResponse.json({
      total,
      countByKategori,
      countByDesa,
      countByKecamatan,
      kategoriPerDesa,
    });
  } catch (error) {
    console.error("Error fetching BSPS stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik BSPS" },
      { status: 500 }
    );
  }
}
