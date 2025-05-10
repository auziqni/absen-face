// app/api/updateabsensi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, StatusKehadiran } from "@/lib/generated/prisma";

// Gunakan prisma client dengan benar - sesuaikan path jika perlu
const prisma = new PrismaClient();

type reqData = {
  mahasiswaId: string;
  noPertemuan: number;
  kodeKelas: string;
  statusKehadiran: StatusKehadiran;
  keterangan?: string;
  lokasi?: string;
};

export async function POST(req: NextRequest) {
  try {
    // Mendapatkan data dari body request
    const body = (await req.json()) as reqData;
    const {
      mahasiswaId,
      noPertemuan,
      kodeKelas,
      statusKehadiran,
      keterangan,
      lokasi,
    } = body;

    // Validasi input
    if (!mahasiswaId || !noPertemuan || !kodeKelas || !statusKehadiran) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Validasi status kehadiran
    if (!Object.values(StatusKehadiran).includes(statusKehadiran)) {
      return NextResponse.json(
        { success: false, message: "Status kehadiran tidak valid" },
        { status: 400 }
      );
    }

    // Cari kelas berdasarkan kodeKelas
    const kelas = await prisma.kelas.findUnique({
      where: { kodeKelas },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah mahasiswa terdaftar di kelas ini
    const mahasiswaKelas = await prisma.mahasiswaKelas.findUnique({
      where: {
        mahasiswaId_kelasId: {
          mahasiswaId,
          kelasId: kelas.id,
        },
      },
    });

    if (!mahasiswaKelas) {
      return NextResponse.json(
        { success: false, message: "Mahasiswa tidak terdaftar di kelas ini" },
        { status: 400 }
      );
    }

    // Cari pertemuan absensi yang sudah ada
    const existingAbsensi = await prisma.pertemuanAbsensi.findUnique({
      where: {
        kelasId_nomorPertemuan_mahasiswaId: {
          kelasId: kelas.id,
          nomorPertemuan: noPertemuan,
          mahasiswaId,
        },
      },
    });

    let absensi;

    if (existingAbsensi) {
      // Update jika sudah ada
      absensi = await prisma.pertemuanAbsensi.update({
        where: {
          id: existingAbsensi.id,
        },
        data: {
          statusKehadiran,
          jamAbsen: new Date(),
          lokasi: lokasi || null,
          keterangan: keterangan || null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Ini kasus yang seharusnya tidak terjadi karena data absensi seharusnya sudah diseed
      // Tetapi kita tetap menanganinya untuk keamanan
      return NextResponse.json(
        {
          success: false,
          message: "Data absensi tidak ditemukan untuk pertemuan ini",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kehadiran berhasil diperbarui menjadi " + statusKehadiran,
      //   data: absensi,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
