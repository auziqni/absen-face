// File: app/kelas/[kodekelas]/[pertemuan]/page.tsx

import React from "react";
import { PrismaClient, StatusKehadiran } from "@/lib/generated/prisma";
const prisma = new PrismaClient();

async function isKelasExists(kodeKelas: string): Promise<boolean> {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: {
        kodeKelas: kodeKelas,
      },
      select: {
        id: true,
      },
    });

    return kelas !== null;
  } catch (error) {
    console.error(`Error checking kelas ${kodeKelas}:`, error);
    throw error;
  }
}

// Interface yang disesuaikan dengan struktur hasil query
interface AbsenPertemuan {
  id: string;
  nomorPertemuan: number;
  tanggalPertemuan: Date;
  statusKehadiran: StatusKehadiran;
  jamAbsen: Date | null;
  lokasi: string | null;
  keterangan: string | null;
  Mahasiswa: {
    id: string;
    nama: string;
    nim: string;
  };
}

async function getKelasId(kodeKelas: string): Promise<string | null> {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: {
        kodeKelas: kodeKelas,
      },
      select: {
        id: true,
      },
    });

    return kelas ? kelas.id : null;
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

export default async function PertemuanPage({ params }: PageProps) {
  const { kodekelas, pertemuan } = await params;

  // Verifikasi apakah kelas ada
  const kelasExists = await isKelasExists(kodekelas);

  if (!kelasExists) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center text-red-700 rounded-lg bg-red-50">
          Kelas dengan kode &quot;{kodekelas}&quot; tidak ditemukan
        </div>
      </main>
    );
  }

  // Dapatkan ID kelas
  const kelasId = await getKelasId(kodekelas);

  if (!kelasId) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center text-red-700 rounded-lg bg-red-50">
          ID Kelas tidak ditemukan untuk kode &quot;{kodekelas}&quot;
        </div>
      </main>
    );
  }

  // Dapatkan data absensi pertemuan
  const absenPertemuan = await getPertemuanKelas(kelasId, pertemuan);

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

      <div>
        <h3 className="text-lg font-semibold mb-3">Data Absensi Mahasiswa</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-collapse border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border border-gray-300">No</th>
                <th className="p-2 border border-gray-300">NIM</th>
                <th className="p-2 border border-gray-300">Nama</th>
                <th className="p-2 border border-gray-300">Status</th>
                <th className="p-2 border border-gray-300">Waktu Absen</th>
                <th className="p-2 border border-gray-300">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {absenPertemuan.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-2 border border-gray-300 text-center">
                    {index + 1}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {item.Mahasiswa.nim}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {item.Mahasiswa.nama}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    <StatusBadge status={item.statusKehadiran} />
                  </td>
                  <td className="p-2 border border-gray-300">
                    {item.jamAbsen
                      ? new Date(item.jamAbsen).toLocaleTimeString("id-ID")
                      : "-"}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {item.keterangan || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Komponen tambahan untuk menampilkan status dengan warna
function StatusBadge({ status }: { status: StatusKehadiran }) {
  let badgeClass = "px-2 py-1 rounded text-xs font-medium";

  switch (status) {
    case "HADIR":
      badgeClass += " bg-green-100 text-green-800";
      break;
    case "TELAT":
      badgeClass += " bg-yellow-100 text-yellow-800";
      break;
    case "IZIN":
      badgeClass += " bg-blue-100 text-blue-800";
      break;
    case "SAKIT":
      badgeClass += " bg-purple-100 text-purple-800";
      break;
    case "ALPHA":
      badgeClass += " bg-red-100 text-red-800";
      break;
    default:
      badgeClass += " bg-gray-100 text-gray-800";
  }

  return <span className={badgeClass}>{status}</span>;
}
