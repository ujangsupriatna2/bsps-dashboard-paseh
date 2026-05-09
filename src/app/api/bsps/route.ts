import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/bsps
 * Fetch all BSPS data with optional filtering by kategori, kecamatan, desa
 * Query params: kategori, kecamatan, desa, search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const kategori = searchParams.get("kategori");
    const kecamatan = searchParams.get("kecamatan");
    const desa = searchParams.get("desa");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (kategori) {
      where.kategori = kategori;
    }
    if (kecamatan) {
      where.kecamatan = kecamatan;
    }
    if (desa) {
      where.desa = desa;
    }
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nik: { contains: search } },
        { kk: { contains: search } },
        { alamat: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      db.bspsData.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.bspsData.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

/**
 * POST /api/bsps
 * Create a new BSPS data entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nama, nik, kk, alamat, kecamatan, desa, rt, rw, lat, lng, kategori, keterangan } = body;

    // Validate required fields
    if (!nama || lat === undefined || lng === undefined || !kategori) {
      return NextResponse.json(
        { error: "Field nama, lat, lng, dan kategori wajib diisi" },
        { status: 400 }
      );
    }

    // Validate kategori value
    const validKategori = ["data_awal", "data_susulan", "layak_huni", "data_cadangan"];
    if (!validKategori.includes(kategori)) {
      return NextResponse.json(
        { error: `Kategori harus salah satu dari: ${validKategori.join(", ")}` },
        { status: 400 }
      );
    }

    const newData = await db.bspsData.create({
      data: {
        nama,
        nik: nik || null,
        kk: kk || null,
        alamat: alamat || null,
        kecamatan: kecamatan || "Paseh",
        desa: desa || "Loa",
        rt: rt || null,
        rw: rw || null,
        lat: parseFloat(String(lat)),
        lng: parseFloat(String(lng)),
        kategori,
        keterangan: keterangan || null,
      },
    });

    return NextResponse.json({ data: newData }, { status: 201 });
  } catch (error) {
    console.error("Error creating BSPS data:", error);
    return NextResponse.json(
      { error: "Gagal membuat data BSPS" },
      { status: 500 }
    );
  }
}
