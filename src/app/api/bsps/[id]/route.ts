import { NextRequest, NextResponse } from "next/server";
import bspsData from "@/data/bsps-data.json";

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
    const data = bspsData.find((d) => d.id === id);

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
