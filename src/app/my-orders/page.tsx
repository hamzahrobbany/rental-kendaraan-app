// src/app/my-orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Order, User, Vehicle, OrderStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Definisi Tipe Data untuk Order dengan relasi yang disertakan
type OrderWithRelations = Order & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  vehicle: Pick<Vehicle, 'id' | 'name' | 'licensePlate' | 'dailyRate' | 'mainImageUrl'>;
};

// ===========================================
// Komponen Halaman Pesanan Saya
// ===========================================
export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data pesanan dari API
  const fetchMyOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Gagal memuat pesanan: ${response.statusText}`);
      }
      const data: OrderWithRelations[] = await response.json();
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching my orders:', err);
      setError(err.message || 'Gagal memuat data pesanan Anda.');
      toast.error('Gagal Memuat Pesanan', {
        description: err.message || 'Terjadi kesalahan saat memuat daftar pesanan Anda.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect jika belum login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    // Jika sudah login, ambil data pesanan
    if (status === 'authenticated' && session?.user?.id) {
      fetchMyOrders();
    }
  }, [status, session, router]);

  // ===========================================
  // Definisi Kolom untuk DataTable Pesanan Saya
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
      accessorKey: 'vehicle.name',
      header: 'Kendaraan',
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        return (
          <div className="flex items-center gap-2">
            <img
              src={vehicle?.mainImageUrl || `https://placehold.co/50x30/4F46E5/FFFFFF/png?text=Kendaraan`}
              alt={vehicle?.name || 'Kendaraan'}
              className="w-12 h-8 object-cover rounded-md"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/50x30/4F46E5/FFFFFF/png?text=Kendaraan`; }}
            />
            <div className="flex flex-col">
              <span>{vehicle?.name || 'N/A'}</span>
              <span className="text-sm text-muted-foreground">{vehicle?.licensePlate || 'N/A'}</span>
            </div>
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
      accessorKey: 'depositAmount',
      header: 'Deposit',
      cell: ({ row }) => {
        const amountValue: number | string | null | undefined = row.getValue('depositAmount');
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
      accessorKey: 'remainingAmount',
      header: 'Sisa Pembayaran',
      cell: ({ row }) => {
        const amountValue: number | string | null | undefined = row.getValue('remainingAmount');
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
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Memuat Pesanan Anda...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Memuat data pesanan Anda, mohon tunggu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Anda perlu login untuk melihat pesanan Anda.</p>
            <Link href="/auth/login">
              <Button className="mt-4">Login Sekarang</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchMyOrders} className="mt-4">Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      {/* Navbar (Simple, can be expanded) */}
      <header className="bg-white shadow-sm py-4 px-6 fixed w-full z-20 top-0">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-500 hover:text-primary-600 transition-colors">
            SewaCepat
          </Link>
          <div className="space-x-4">
            <Link href="/" className="text-gray-600 hover:text-primary-500 transition-colors">Beranda</Link>
            <Link href="/dashboard" className="bg-primary-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-600 transition-colors">Dashboard</Link>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pesanan Saya</CardTitle>
            <CardDescription>Daftar semua pesanan kendaraan Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-lg text-gray-600 py-8">Anda belum memiliki pesanan.</p>
            ) : (
              <DataTable
                columns={columns}
                data={orders}
                filterColumnId="id"
                filterPlaceholder="Filter ID pesanan..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
