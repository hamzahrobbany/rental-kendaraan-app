// src/app/dashboard/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table'; // Ini adalah komponen DataTable Shadcn/ui
import { ColumnDef } from '@tanstack/react-table'; // Dari TanStack Table
import { User, Role } from '@prisma/client'; // Import User dan Role dari Prisma
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react'; // Ikon untuk sortasi tabel
import { CheckCircledIcon, CrossCircledIcon, Pencil2Icon, TrashIcon } from '@radix-ui/react-icons'; // Ikon status & aksi

// ===========================================
// Definisi Kolom untuk DataTable
// ===========================================
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nama
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          {user.image && (
            <img src={user.image} alt={user.name || 'User'} className="w-8 h-8 rounded-full" />
          )}
          <span>{user.name || 'N/A'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Peran',
    cell: ({ row }) => {
      const role: Role = row.getValue('role');
      const roleColor = {
        ADMIN: 'bg-red-100 text-red-800',
        OWNER: 'bg-purple-100 text-purple-800',
        CUSTOMER: 'bg-blue-100 text-blue-800',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColor[role]}`}>
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: 'isVerifiedByAdmin',
    header: 'Admin Verifikasi',
    cell: ({ row }) => {
      const isVerified: boolean = row.getValue('isVerifiedByAdmin');
      return isVerified ? (
        <CheckCircledIcon className="h-5 w-5 text-green-500" />
      ) : (
        <CrossCircledIcon className="h-5 w-5 text-red-500" />
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal Daftar',
    cell: ({ row }) => {
      const date: Date = row.getValue('createdAt');
      return date ? new Date(date).toLocaleDateString() : 'N/A';
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
      const user = row.original;

      // TODO: Implementasi fungsi edit dan delete
      const handleEdit = () => {
        alert(`Edit pengguna: ${user.name} (ID: ${user.id})`);
        // Navigasi ke halaman edit atau buka dialog edit
      };

      const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.name}?`)) {
          alert(`Hapus pengguna: ${user.name} (ID: ${user.id})`);
          // Kirim permintaan DELETE ke API
        }
      };

      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <Pencil2Icon className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      );
    },
  },
];

// ===========================================
// Komponen Halaman Kelola Pengguna
// ===========================================
export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect jika tidak terautentikasi atau tidak memiliki peran yang sesuai
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    // Perhatikan: Karena ini Client Component, kita perlu cek role lagi di sini,
    // meskipun getServerSession di Layout/API sudah memproteksi.
    // Ini untuk mencegah komponen me-render sebelum redirect di sisi server.
    if (status === 'authenticated' && session &&
       (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
      router.push('/dashboard?error=Forbidden');
      return;
    }

    // Ambil data pengguna
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          if (response.status === 403) {
            setError('Anda tidak memiliki izin untuk melihat halaman ini.');
            router.push('/dashboard?error=Forbidden'); // Redirect jika tidak diizinkan
          } else {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
          }
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Gagal memuat data pengguna.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && (session.user?.role === Role.ADMIN || session.user?.role === Role.OWNER)) {
      fetchUsers();
    }
  }, [status, session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-gray-700">Memuat data pengguna...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Kelola Pengguna</CardTitle>
        <CardDescription>Daftar semua pengguna terdaftar dalam sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          {/* Tombol "Tambah Pengguna" (akan kita buat nanti) */}
          <Button>Tambah Pengguna</Button>
        </div>
        <DataTable columns={columns} data={users} />
      </CardContent>
    </Card>
  );
}