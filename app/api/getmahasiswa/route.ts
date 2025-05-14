//get mahasiswa
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const mahasiswa = await prisma.mahasiswa.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
      },
      orderBy: {
        nama: "asc",
      },
    });
    return NextResponse.json(mahasiswa);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
