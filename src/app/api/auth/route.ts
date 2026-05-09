import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    const validCode = process.env.ACCESS_CODE || "bsps2024";

    if (!code) {
      return NextResponse.json(
        { error: "Kode akses wajib diisi" },
        { status: 400 }
      );
    }

    if (code === validCode) {
      return NextResponse.json({ success: true, message: "Akses diterima" });
    }

    return NextResponse.json(
      { error: "Kode akses salah" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
