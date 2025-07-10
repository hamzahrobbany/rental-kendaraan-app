// src/components/dashboard/EditUserForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  disableRoleAndVerification?: boolean; // Prop ini mengontrol mode form
}

export default function EditUserForm({ user, onSuccess, onCancel, disableRoleAndVerification = false }: EditUserFormProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState<Role>(user.role);
  const [isVerifiedByAdmin, setIsVerifiedByAdmin] = useState(user.isVerifiedByAdmin);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.role);
    setIsVerifiedByAdmin(user.isVerifiedByAdmin);
    setPassword('');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiEndpoint = disableRoleAndVerification
        ? '/api/user/profile' // Untuk profil pengguna sendiri
        : `/api/admin/users/${user.id}`; // Untuk admin mengedit pengguna lain

      const payload: any = {
        name,
        email,
      };

      if (password) {
        if (password.length < 6) {
          toast.error('Gagal Memperbarui Pengguna', {
            description: 'Kata sandi minimal 6 karakter.',
          });
          setLoading(false);
          return;
        }
        payload.password = password;
      }

      if (!disableRoleAndVerification) {
        payload.role = role;
        payload.isVerifiedByAdmin = isVerifiedByAdmin;
      }

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui pengguna.');
      }

      onSuccess();
      setPassword('');

      // Toast sukses ditangani di parent (ProfileSettings atau ManageUsersPage)
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('Gagal Memperbarui Pengguna', {
        description: err.message || 'Terjadi kesalahan saat memperbarui pengguna.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="sm:text-right">Nama</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:col-span-3"
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="sm:text-right">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:col-span-3"
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="role" className="sm:text-right">Peran</Label>
        <Select
          value={role}
          onValueChange={(value: Role) => setRole(value)}
          disabled={disableRoleAndVerification || loading}
        >
          <SelectTrigger className="sm:col-span-3">
            <SelectValue placeholder="Pilih Peran" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Role).map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="isVerifiedByAdmin" className="sm:text-right">Admin Verifikasi</Label>
        <div className="col-span-full sm:col-span-3 flex items-center space-x-2">
          <Checkbox
            id="isVerifiedByAdmin"
            checked={isVerifiedByAdmin}
            onCheckedChange={(checked: boolean) => setIsVerifiedByAdmin(checked)}
            disabled={disableRoleAndVerification || loading}
          />
          <label
            htmlFor="isVerifiedByAdmin"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Diverifikasi oleh Admin
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="sm:text-right">Kata Sandi Baru</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="sm:col-span-3"
          placeholder="Biarkan kosong jika tidak ingin mengubah"
          disabled={loading}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
