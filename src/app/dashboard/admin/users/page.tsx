// src/app/dashboard/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { User, Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { CheckCircledIcon, CrossCircledIcon, Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import EditUserForm from '@/components/dashboard/EditUserForm';
import AddUserForm from '@/components/dashboard/AddUserForm';

// ===========================================
// Komponen Halaman Kelola Pengguna
// ===========================================
export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  // Fungsi untuk mengambil data pengguna dari API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Anda tidak memiliki izin untuk melihat halaman ini.');
          router.push('/dashboard?error=Forbidden');
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
      fetchUsers();
    }
  }, [status, session, router]);

  // ===========================================
  // Handler Aksi Tabel (Edit & Delete)
  // ===========================================
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (userId: string, userName: string | null) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${userName || userId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
      }

      toast.success('Pengguna Berhasil Dihapus', {
        description: `Pengguna ${userName || userId} telah dihapus dari sistem.`,
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Gagal Menghapus Pengguna', {
        description: err.message || 'Terjadi kesalahan saat menghapus pengguna.',
      });
    }
  };

  // ===========================================
  // Definisi Kolom untuk DataTable (Ditambahkan aksi ke Cell)
  // ===========================================
  const columns: ColumnDef<User>[] = [
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

        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
              <Pencil2Icon className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(String(user.id), user.name)}>
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
          <CardTitle>Memuat Pengguna...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Memuat data pengguna, mohon tunggu...</p>
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
          <Button onClick={fetchUsers} className="mt-4">Coba Lagi</Button>
        </CardContent>
      </Card>
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
          <Button onClick={() => setIsAddUserDialogOpen(true)}>Tambah Pengguna</Button>
        </div>
        {/* PERBAIKAN: Tambahkan filterColumnId dan filterPlaceholder */}
        <DataTable
          columns={columns}
          data={users}
          filterColumnId="email" // Filter berdasarkan kolom 'email'
          filterPlaceholder="Filter email..." // Placeholder untuk input filter
        />
      </CardContent>

      {/* Dialog untuk Edit Pengguna */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah detail pengguna di sini. Klik simpan saat selesai.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSuccess={() => {
                fetchUsers();
                setIsEditDialogOpen(false);
                toast.success('Pengguna Berhasil Diperbarui', {
                  description: `Data pengguna ${selectedUser.name} telah diperbarui.`,
                });
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Tambah Pengguna */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Isi detail untuk membuat akun pengguna baru.
            </DialogDescription>
          </DialogHeader>
          <AddUserForm
            onSuccess={() => {
              fetchUsers();
              setIsAddUserDialogOpen(false);
              toast.success('Pengguna Berhasil Ditambahkan', {
                description: 'Akun pengguna baru telah berhasil dibuat.',
              });
            }}
            onCancel={() => setIsAddUserDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
