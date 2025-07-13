// src/app/dashboard/admin/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Order, User, Vehicle, OrderStatus, Role } from '@prisma/client';
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
import AddOrderForm from '@/components/dashboard/orders/AddOrderForm';
import EditOrderForm from '@/components/dashboard/orders/EditOrderForm';

// Definisi Tipe Data untuk Order dengan relasi yang disertakan
type OrderWithRelations = Order & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  vehicle: Pick<Vehicle, 'id' | 'name' | 'licensePlate' | 'dailyRate'>;
};

// ===========================================
// Komponen Halaman Kelola Pesanan
// ===========================================
export default function ManageOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fungsi untuk mengambil data pesanan dari API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Anda tidak memiliki izin untuk melihat halaman ini.');
          router.push('/dashboard?error=Forbidden');
        } else {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
      }
      const data: OrderWithRelations[] = await response.json();
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Gagal memuat data pesanan.');
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
      fetchOrders();
    }
  }, [status, session, router]);

  // ===========================================
  // Handler Aksi Tabel (Edit & Delete)
  // ===========================================
  const handleEdit = (order: OrderWithRelations) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pesanan ID: ${orderId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete order: ${response.statusText}`);
      }

      toast.success('Pesanan Berhasil Dihapus', {
        description: `Pesanan ID: ${orderId} telah dihapus dari sistem.`,
      });
      fetchOrders(); // Refresh data setelah penghapusan
    } catch (err: any) {
      console.error('Error deleting order:', err);
      toast.error('Gagal Menghapus Pesanan', {
        description: err.message || 'Terjadi kesalahan saat menghapus pesanan.',
      });
    }
  };

  // ===========================================
  // Definisi Kolom untuk DataTable Pesanan
  // ===========================================
  const columns: ColumnDef<OrderWithRelations>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          ID Pesanan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'user.name',
      header: 'Pelanggan',
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex flex-col">
            <span>{user?.name || 'N/A'}</span>
            <span className="text-sm text-muted-foreground">{user?.email || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'vehicle.name',
      header: 'Kendaraan',
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        return (
          <div className="flex flex-col">
            <span>{vehicle?.name || 'N/A'}</span>
            <span className="text-sm text-muted-foreground">{vehicle?.licensePlate || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Mulai Sewa',
      cell: ({ row }) => {
        const dateValue: Date | string | null | undefined = row.getValue('startDate');
        const date = dateValue ? new Date(dateValue) : null;
        return date && !isNaN(date.getTime())
          ? date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'N/A';
      },
    },
    {
      accessorKey: 'endDate',
      header: 'Akhir Sewa',
      cell: ({ row }) => {
        const dateValue: Date | string | null | undefined = row.getValue('endDate');
        const date = dateValue ? new Date(dateValue) : null;
        return date && !isNaN(date.getTime())
          ? date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'N/A';
      },
    },
    {
      accessorKey: 'rentalDays',
      header: 'Hari Sewa',
      cell: ({ row }) => {
        const rentalDaysValue: number | null | undefined = row.getValue('rentalDays');
        return rentalDaysValue !== null && rentalDaysValue !== undefined ? rentalDaysValue : 'N/A';
      },
    },
    {
      accessorKey: 'totalPrice',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Total Harga
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amountValue: number | string | null | undefined = row.getValue('totalPrice');
        let amount: number;

        if (amountValue === null || amountValue === undefined || isNaN(parseFloat(amountValue.toString()))) {
          amount = 0;
        } else {
          amount = parseFloat(amountValue.toString());
        }
        
        const formatted = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'orderStatus',
      header: 'Status',
      cell: ({ row }) => {
        const statusValue: OrderStatus | undefined = row.getValue('orderStatus');
        
        if (!statusValue) {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              Tidak Diketahui
            </span>
          );
        }

        let statusColor = '';
        switch (statusValue) {
          case OrderStatus.PENDING_REVIEW:
            statusColor = 'bg-yellow-100 text-yellow-800';
            break;
          case OrderStatus.APPROVED:
            statusColor = 'bg-blue-100 text-blue-800';
            break;
          case OrderStatus.PAID:
            statusColor = 'bg-green-100 text-green-800';
            break;
          case OrderStatus.ACTIVE:
            statusColor = 'bg-purple-100 text-purple-800';
            break;
          case OrderStatus.COMPLETED:
            statusColor = 'bg-gray-100 text-gray-800';
            break;
          case OrderStatus.CANCELED:
          case OrderStatus.REJECTED:
            statusColor = 'bg-red-100 text-red-800';
            break;
          default:
            statusColor = 'bg-gray-100 text-gray-800';
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {statusValue.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Pesan',
      cell: ({ row }) => {
        const dateValue: Date | string | null | undefined = row.getValue('createdAt');
        const date = dateValue ? new Date(dateValue) : null;
        return date && !isNaN(date.getTime())
          ? date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(order)}>
              <Pencil2Icon className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
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
          <CardTitle>Memuat Pesanan...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Memuat data pesanan, mohon tunggu...</p>
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
          <Button onClick={fetchOrders} className="mt-4">Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Kelola Pesanan</CardTitle>
        <CardDescription>Daftar semua pesanan kendaraan dalam sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setIsAddDialogOpen(true)}>Tambah Pesanan</Button>
        </div>
        <DataTable
          columns={columns}
          data={orders}
          filterColumnId="id"
          filterPlaceholder="Filter ID pesanan..."
        />
      </CardContent>

      {/* Dialog untuk Tambah Pesanan */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Pesanan Baru</DialogTitle>
            <DialogDescription>Isi detail untuk membuat pesanan baru.</DialogDescription>
          </DialogHeader>
          <AddOrderForm
            onSuccess={() => {
              fetchOrders();
              setIsAddDialogOpen(false);
              toast.success('Pesanan Berhasil Ditambahkan', { description: 'Pesanan baru telah berhasil dibuat.' });
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Edit Pesanan */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pesanan</DialogTitle>
            <DialogDescription>Ubah detail pesanan di sini. Klik simpan saat selesai.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <EditOrderForm
              order={selectedOrder}
              onSuccess={() => {
                fetchOrders();
                setIsEditDialogOpen(false);
                toast.success('Pesanan Berhasil Diperbarui', { description: `Pesanan ID: ${selectedOrder.id} telah diperbarui.` });
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
