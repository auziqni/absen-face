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
