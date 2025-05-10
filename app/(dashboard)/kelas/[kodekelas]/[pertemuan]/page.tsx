// File: app/kelas/[kodekelas]/[pertemuan]/page.tsx

import React from "react";
import { PrismaClient, Kelas } from "@/lib/generated/prisma";
import { currentUser } from "@clerk/nextjs/server";
import TableAbsensi from "@/components/dashboard/table";
const prisma = new PrismaClient();

interface kelasext extends Kelas {
  Dosen_Kelas_dosenUtamaIdToDosen: {
    id: string;
    nama: string;
    email: string;
    nip: string;
  } | null;
  Dosen_Kelas_dosenPendampingIdToDosen: {
    id: string;
    nama: string;
    email: string;
    nip: string;
  } | null;
}

async function getKelas(kodeKelas: string): Promise<kelasext | null> {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: {
        kodeKelas: kodeKelas,
      },
      include: {
        Dosen_Kelas_dosenUtamaIdToDosen: {
          select: {
            id: true,
            nama: true,
            email: true,
            nip: true,
          },
        },
        Dosen_Kelas_dosenPendampingIdToDosen: {
          select: {
            id: true,
            nama: true,
            email: true,
            nip: true,
          },
        },
      },
    });

    return kelas ? kelas : null;
  } catch (error) {
    console.error(`Error getting kelas ID for kodeKelas ${kodeKelas}:`, error);
    throw error;
  }
}

async function getPertemuanKelas(
  kelasId: string,
  pertemuan: string
): Promise<AbsenPertemuan[]> {
  try {
    const data = await prisma.pertemuanAbsensi.findMany({
      where: {
        kelasId: kelasId,
        nomorPertemuan: parseInt(pertemuan),
      },
      include: {
        Mahasiswa: {
          select: {
            id: true,
            nama: true,
            nim: true,
          },
        },
      },
    });

    return data as AbsenPertemuan[];
  } catch (error) {
    console.error(
      `Error fetching pertemuan for kelas ${kelasId}, pertemuan ${pertemuan}:`,
      error
    );
    throw error;
  }
}

// Tipe untuk parameter Next.js App Router
type PageProps = {
  params: Promise<{
    kodekelas: string;
    pertemuan: string;
  }>;
};

//check if user email is admin or dosen
function isAdminOrDosen({
  userEmail,
  dosenUtama,
  dosenPendamping,
}: {
  userEmail: string;
  dosenUtama: string;
  dosenPendamping: string;
}): boolean {
  if (
    userEmail == "admin@face.my.id" ||
    userEmail == dosenUtama ||
    userEmail == dosenPendamping
  )
    return true;

  return false;
}

export default async function PertemuanPage({ params }: PageProps) {
  const user = await currentUser();
  const { kodekelas, pertemuan } = await params;

  // Dapatkan ID kelas
  const kelas = await getKelas(kodekelas);

  if (!kelas) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center text-red-700 rounded-lg bg-red-50">
          Kelas dengan kode &quot;{kodekelas}&quot; tidak ditemukan
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center text-red-700 rounded-lg bg-red-50">
          Anda tidak memiliki akses ke halaman ini
        </div>
      </main>
    );
  }

  const hakEdit = isAdminOrDosen({
    userEmail: user?.primaryEmailAddress?.emailAddress || "",
    dosenUtama: kelas.Dosen_Kelas_dosenUtamaIdToDosen?.email || "",
    dosenPendamping: kelas.Dosen_Kelas_dosenPendampingIdToDosen?.email || "",
  });

  // Dapatkan data absensi pertemuan
  const absenPertemuan = await getPertemuanKelas(kelas.id, pertemuan);

  if (absenPertemuan.length === 0) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center text-red-700 rounded-lg bg-red-50">
          Pertemuan dengan nomor &quot;{pertemuan}&quot; tidak ditemukan atau
          belum ada data absensi
        </div>
      </main>
    );
  }

  // Ambil tanggal pertemuan dari data pertama (semua akan memiliki tanggal yang sama)
  const tanggalPertemuan = absenPertemuan[0]?.tanggalPertemuan
    ? new Date(absenPertemuan[0].tanggalPertemuan).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tanggal tidak tersedia";

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kelas: {kodekelas}</h1>
        <h2 className="text-xl">Pertemuan: {pertemuan}</h2>
        <p className="text-gray-600">Tanggal: {tanggalPertemuan}</p>
      </div>

      <TableAbsensi
        absensi={absenPertemuan}
        kodeKelas={kodekelas}
        hakEdit={hakEdit}
      />
    </div>
  );
}
