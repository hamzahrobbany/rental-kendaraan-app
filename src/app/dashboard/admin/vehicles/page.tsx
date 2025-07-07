// src/app/dashboard/admin/vehicles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Vehicle, Role, TransmissionType, FuelType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import AddVehicleForm from '@/components/dashboard/AddVehicleForm';
import EditVehicleForm from '@/components/dashboard/EditVehicleForm';

// ===========================================
// Komponen Halaman Kelola Kendaraan
// ===========================================
export default function ManageVehiclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false);
  const [isEditVehicleDialogOpen, setIsEditVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fungsi untuk mengambil data kendaraan dari API
  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/vehicles');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Anda tidak memiliki izin untuk melihat halaman ini.');
          router.push('/dashboard?error=Forbidden');
        } else {
          throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
        }
      }
      const data: Vehicle[] = await response.json();
      setVehicles(data);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Gagal memuat data kendaraan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session &&
       (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
      router.push('/dashboard?error=Forbidden');
      return;
    }

    if (status === 'authenticated' && (session.user?.role === Role.ADMIN || session.user?.role === Role.OWNER)) {
      fetchVehicles();
    }
  }, [status, session, router]);

  // ===========================================
  // Handler Aksi Tabel (Edit & Delete)
  // ===========================================
  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditVehicleDialogOpen(true);
  };

  const handleDelete = async (vehicleId: number, vehicleName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kendaraan ${vehicleName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete vehicle: ${response.statusText}`);
      }

      toast.success('Kendaraan Berhasil Dihapus', {
        description: `Kendaraan ${vehicleName} telah dihapus dari sistem.`,
      });
      fetchVehicles(); // Refresh data setelah penghapusan
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      toast.error('Gagal Menghapus Kendaraan', {
        description: err.message || 'Terjadi kesalahan saat menghapus kendaraan.',
      });
    }
  };

  // ===========================================
  // Definisi Kolom untuk DataTable Kendaraan
  // ===========================================
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Nama Kendaraan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center gap-2">
            {vehicle.mainImageUrl && (
              <img src={vehicle.mainImageUrl} alt={vehicle.name} className="w-10 h-10 object-cover rounded-md" />
            )}
            <span>{vehicle.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'licensePlate',
      header: 'Plat Nomor',
    },
    {
      accessorKey: 'type',
      header: 'Tipe',
    },
    {
      accessorKey: 'capacity',
      header: 'Kapasitas',
    },
    {
      accessorKey: 'dailyRate',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Harga Harian
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('dailyRate'));
        const formatted = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'isAvailable',
      header: 'Tersedia',
      cell: ({ row }) => {
        const isAvailable: boolean = row.getValue('isAvailable');
        return isAvailable ? (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Ya</span>
        ) : (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Tidak</span>
        );
      },
    },
    {
      accessorKey: 'city',
      header: 'Kota',
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
              <Pencil2Icon className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id, vehicle.name)}>
              <TrashIcon className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Memuat Kendaraan...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Memuat data kendaraan, mohon tunggu...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={fetchVehicles} className="mt-4">Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Kelola Kendaraan</CardTitle>
        <CardDescription>Daftar semua kendaraan yang tersedia dalam sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setIsAddVehicleDialogOpen(true)}>Tambah Kendaraan</Button>
        </div>
        {/* PERBAIKAN: Tambahkan filterColumnId dan filterPlaceholder */}
        <DataTable
          columns={columns}
          data={vehicles}
          filterColumnId="name" // Filter berdasarkan kolom 'name'
          filterPlaceholder="Filter nama kendaraan..." // Placeholder untuk input filter
        />
      </CardContent>

      {/* Dialog untuk Tambah Kendaraan */}
      <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Tambah Kendaraan Baru</DialogTitle>
            <DialogDescription>
              Isi detail untuk menambahkan kendaraan baru ke sistem.
            </DialogDescription>
          </DialogHeader>
          <AddVehicleForm
            onSuccess={() => {
              fetchVehicles();
              setIsAddVehicleDialogOpen(false);
              toast.success('Kendaraan Berhasil Ditambahkan', {
                description: 'Kendaraan baru telah berhasil ditambahkan.',
              });
            }}
            onCancel={() => setIsAddVehicleDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Edit Kendaraan */}
      <Dialog open={isEditVehicleDialogOpen} onOpenChange={setIsEditVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Kendaraan</DialogTitle>
            <DialogDescription>
              Ubah detail kendaraan di sini. Klik simpan saat selesai.
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <EditVehicleForm
              vehicle={selectedVehicle}
              onSuccess={() => {
                fetchVehicles();
                setIsEditVehicleDialogOpen(false);
                toast.success('Kendaraan Berhasil Diperbarui', {
                  description: `Data kendaraan ${selectedVehicle.name} telah diperbarui.`,
                });
              }}
              onCancel={() => setIsEditVehicleDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
