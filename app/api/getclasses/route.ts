import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const classes = await prisma.kelas.findMany({
      select: {
        id: true,
        kodeKelas: true,
        namaKelas: true,
        pinKelas: true,
        dosenUtamaId: true,
        dosenPendampingId: true,
        jumlahPertemuan: true,
        deskripsi: true,
      },
      orderBy: {
        kodeKelas: "asc",
      },
    });
    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
