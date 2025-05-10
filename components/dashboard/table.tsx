"use client";
import React from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from "material-react-table";
import { Box, Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { mkConfig, generateCsv, download } from "export-to-csv"; //or use your library of choice here
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import KodeKelas from "@/app/(dashboard)/kelas/[kodekelas]/page";

// const StyledButton = ({ text }: { text: string }) => (
//   <button className="bg-green-500"> {text}</button>
// );

function buttonStyle(statusValue: string) {
  let style: string = "";

  switch (statusValue) {
    case "HADIR":
      style = "!bg-green-500 text-white";
      break;
    case "IZIN":
      style = "!bg-blue-500";
      break;
    case "SAKIT":
      style = "!bg-purple-500";
      break;
    case "TELAT":
      style = "!bg-yellow-500";
      break;
    case "ALPHA":
      style = "!bg-red-500";
      break;
    case "NONE":
      style = "!bg-gray-500";
      break;
  }

  return style;
}

function StyledButton({
  row,
  kodeKelas,
}: {
  row: MRT_Row<AbsenPertemuan>;
  kodeKelas: string;
}) {
  const [statusValueHold, setStatusValueHold] = React.useState<string>(
    row.original.statusKehadiran
  );

  const handleStatusChange = (newStatus: string) => {
    setStatusValueHold(newStatus);

    console.log("New status:", newStatus);
    try {
      const response = fetch(`/api/updateabsensi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mahasiswaId: row.original.Mahasiswa.id,
          noPertemuan: row.original.nomorPertemuan,
          kodeKelas: kodeKelas,
          statusKehadiran: newStatus,
        }),
      });
      console.log("Response:", response);
      console.log("Status kehadiran", newStatus);
      console.log("Mahasiswa ID", row.original.Mahasiswa.id);
      console.log("No Pertemuan", row.original.nomorPertemuan);
      console.log("Kode Kelas", kodeKelas);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonStyle(statusValueHold),
          "flex items-center px-2 py-1 rounded text-md text-white cursor-pointer"
        )}
      >
        {statusValueHold}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={statusValueHold}
          onValueChange={handleStatusChange}
        >
          <DropdownMenuRadioItem value="HADIR">HADIR</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IZIN">IZIN</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SAKIT">SAKIT</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TELAT">TELAT</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ALPHA">ALPHA</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NONE">NONE</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TableAbsensi({
  absensi,
  kodeKelas,
}: {
  absensi: AbsenPertemuan[];
  kodeKelas: string;
}) {
  const columnHelper = createMRTColumnHelper<AbsenPertemuan>();

  const column = [
    columnHelper.accessor("Mahasiswa.nama", {
      header: "Nama Mahasiswa",
      size: 150,
    }),
    columnHelper.accessor("Mahasiswa.nim", {
      header: "NIM",
      size: 100,
    }),

    columnHelper.accessor("statusKehadiran", {
      header: "Status Kehadiran",
      size: 150,
      Cell: ({ renderedCellValue, row }) => (
        <StyledButton row={row} kodeKelas={kodeKelas} />
      ),
    }),

    columnHelper.accessor("jamAbsen", {
      header: "Jam Absen",
      size: 150,
      Cell: ({ cell }) => {
        const value = cell.getValue<Date>();
        return value ? new Date(value).toLocaleTimeString("id-ID") : "-";
      },
    }),

    columnHelper.accessor("keterangan", {
      header: "Keterangan",
      size: 150,
    }),
  ];

  const table = useMaterialReactTable({
    columns: column,
    data: absensi,
    initialState: {
      pagination: { pageSize: 50, pageIndex: 0 },
    },
  });

  return <MaterialReactTable table={table} />;
}
