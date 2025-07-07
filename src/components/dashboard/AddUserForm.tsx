// src/components/dashboard/AddUserForm.tsx
'use client';

import { useState } from 'react';
import { Role } from '@prisma/client'; // Import Role dari Prisma
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface AddUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.CUSTOMER); // Default role
  const [isVerifiedByAdmin, setIsVerifiedByAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', { // <-- Endpoint untuk membuat user
        method: 'POST', // <-- Method POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          isVerifiedByAdmin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menambahkan pengguna.');
      }

      onSuccess(); // Panggil fungsi onSuccess dari parent
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRole(Role.CUSTOMER);
      setIsVerifiedByAdmin(false);

    } catch (err: any) {
      console.error('Error adding user:', err);
      toast.error('Gagal Menambahkan Pengguna', {
        description: err.message || 'Terjadi kesalahan saat menambahkan pengguna.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-name" className="text-right">
          Nama
        </Label>
        <Input
          id="add-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-email" className="text-right">
          Email
        </Label>
        <Input
          id="add-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-password" className="text-right">
          Kata Sandi
        </Label>
        <Input
          id="add-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="add-role" className="text-right">
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
        <Label htmlFor="add-isVerifiedByAdmin" className="text-right">
          Verifikasi Admin
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Checkbox
            id="add-isVerifiedByAdmin"
            checked={isVerifiedByAdmin}
            onCheckedChange={(checked: boolean) => setIsVerifiedByAdmin(checked)}
          />
          <label
            htmlFor="add-isVerifiedByAdmin"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Diverifikasi oleh Admin
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menambahkan...' : 'Tambah Pengguna'}
        </Button>
      </div>
    </form>
  );
}