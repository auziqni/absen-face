import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const dosen = await prisma.dosen.findMany({
      select: {
        id: true,
        nama: true,
        nip: true,
        email: true,
      },
      orderBy: {
        nama: "asc",
      },
    });
    return NextResponse.json(dosen, { status: 200 });
  } catch (error) {
    console.error("Error fetching dosen:", error);
    return NextResponse.json(
      { error: "Failed to fetch dosen" },
      { status: 500 }
    );
  }
}
