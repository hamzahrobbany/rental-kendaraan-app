// src/components/dashboard/EditUserForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Role } from '@prisma/client'; // Import User dan Role dari Prisma
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner'; // <-- Perubahan di sini: Menggunakan toast dari sonner

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState<Role>(user.role);
  const [isVerifiedByAdmin, setIsVerifiedByAdmin] = useState(user.isVerifiedByAdmin);
  const [password, setPassword] = useState(''); // Untuk ubah password (opsional)
  const [loading, setLoading] = useState(false);
  // const { toast } = useToast(); // <-- Baris ini dihapus

  // Reset form state jika user berubah (misal: dialog dibuka untuk user lain)
  useEffect(() => {
    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.role);
    setIsVerifiedByAdmin(user.isVerifiedByAdmin);
    setPassword(''); // Reset password field
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          role,
          isVerifiedByAdmin,
          // Hanya kirim password jika tidak kosong (berarti ada perubahan)
          ...(password && { password }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui pengguna.');
      }

      onSuccess(); // Panggil fungsi onSuccess dari parent
      toast.success('Pengguna Berhasil Diperbarui', { // <-- Perubahan di sini: Menggunakan toast.success
        description: `Data pengguna ${user.name} telah diperbarui.`,
      });
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('Gagal Memperbarui Pengguna', { // <-- Perubahan di sini: Menggunakan toast.error
        description: err.message || 'Terjadi kesalahan saat memperbarui pengguna.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Nama
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="role" className="text-right">
          Peran
        </Label>
        <Select value={role} onValueChange={(value: Role) => setRole(value)}>
          <SelectTrigger className="col-span-3">
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
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isVerifiedByAdmin" className="text-right">
          Verifikasi Admin
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Checkbox
            id="isVerifiedByAdmin"
            checked={isVerifiedByAdmin}
            onCheckedChange={(checked: boolean) => setIsVerifiedByAdmin(checked)}
          />
          <label
            htmlFor="isVerifiedByAdmin"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Diverifikasi oleh Admin
          </label>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="text-right">
          Kata Sandi Baru
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="col-span-3"
          placeholder="Biarkan kosong jika tidak ingin mengubah"
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