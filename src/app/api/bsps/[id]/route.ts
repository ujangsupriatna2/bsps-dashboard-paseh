import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bsps/[id]
 * Fetch single BSPS data by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const data = await db.bspsData.findUnique({
      where: { id },
    });

    if (!data) {
      return NextResponse.json(
        { error: "Data BSPS tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching BSPS data by ID:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data BSPS" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bsps/[id]
 * Update BSPS data by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if data exists
    const existing = await db.bspsData.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data BSPS tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate kategori if provided
    if (body.kategori) {
      const validKategori = ["data_awal", "data_susulan", "layak_huni", "data_cadangan"];
      if (!validKategori.includes(body.kategori)) {
        return NextResponse.json(
          { error: `Kategori harus salah satu dari: ${validKategori.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.nik !== undefined) updateData.nik = body.nik || null;
    if (body.kk !== undefined) updateData.kk = body.kk || null;
    if (body.alamat !== undefined) updateData.alamat = body.alamat || null;
    if (body.kecamatan !== undefined) updateData.kecamatan = body.kecamatan;
    if (body.desa !== undefined) updateData.desa = body.desa;
    if (body.rt !== undefined) updateData.rt = body.rt || null;
    if (body.rw !== undefined) updateData.rw = body.rw || null;
    if (body.lat !== undefined) updateData.lat = parseFloat(String(body.lat));
    if (body.lng !== undefined) updateData.lng = parseFloat(String(body.lng));
    if (body.kategori !== undefined) updateData.kategori = body.kategori;
    if (body.keterangan !== undefined) updateData.keterangan = body.keterangan || null;

    const updatedData = await db.bspsData.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updatedData });
  } catch (error) {
    console.error("Error updating BSPS data:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data BSPS" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bsps/[id]
 * Delete BSPS data by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if data exists
    const existing = await db.bspsData.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data BSPS tidak ditemukan" },
        { status: 404 }
      );
    }

    await db.bspsData.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Data BSPS berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting BSPS data:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data BSPS" },
      { status: 500 }
    );
  }
}
