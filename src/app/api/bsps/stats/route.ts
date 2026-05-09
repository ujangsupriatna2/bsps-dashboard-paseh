import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/bsps/stats
 * Return stats summary (count by kategori, count by desa, etc.)
 */
export async function GET() {
  try {
    // Total count
    const total = await db.bspsData.count();

    // Count by kategori
    const countByKategoriRaw = await db.bspsData.groupBy({
      by: ["kategori"],
      _count: {
        kategori: true,
      },
    });

    const countByKategori: Record<string, number> = {};
    for (const item of countByKategoriRaw) {
      countByKategori[item.kategori] = item._count.kategori;
    }

    // Count by desa
    const countByDesaRaw = await db.bspsData.groupBy({
      by: ["desa"],
      _count: {
        desa: true,
      },
    });

    const countByDesa: Record<string, number> = {};
    for (const item of countByDesaRaw) {
      countByDesa[item.desa] = item._count.desa;
    }

    // Count by kecamatan
    const countByKecamatanRaw = await db.bspsData.groupBy({
      by: ["kecamatan"],
      _count: {
        kecamatan: true,
      },
    });

    const countByKecamatan: Record<string, number> = {};
    for (const item of countByKecamatanRaw) {
      countByKecamatan[item.kecamatan] = item._count.kecamatan;
    }

    // Count by kategori per desa (cross tabulation)
    const allData = await db.bspsData.findMany({
      select: {
        desa: true,
        kategori: true,
      },
    });

    const kategoriPerDesa: Record<string, Record<string, number>> = {};
    for (const item of allData) {
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
