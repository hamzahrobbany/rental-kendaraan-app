// src/components/dashboard/settings/ProfileSettings.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react'; // Tambahkan useCallback
import { User, Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import EditUserForm from '@/components/dashboard/EditUserForm';
import { Button } from '@/components/ui/button';

export default function ProfileSettings() {
  const { data: session, status, update: updateSession } = useSession();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gunakan useCallback untuk fetchUserData agar tidak dibuat ulang setiap render
  const fetchUserData = useCallback(async () => {
    // Pastikan sesi sudah dimuat dan ada ID pengguna
    if (status === 'authenticated' && session?.user?.id) {
      setLoading(true); // Set loading true saat mulai fetching
      setError(null); // Reset error
      try {
        const res = await fetch(`/api/user/current`);
        
        if (!res.ok) {
          const errorData = await res.json(); // Ini bisa jadi sumber error JSON
          throw new Error(errorData.message || 'Gagal mengambil data profil.');
        }
        const data: User = await res.json();
        setUserData(data);
      } catch (err: any) {
        console.error('Error fetching user data for profile:', err);
        setError(err.message || 'Gagal memuat data profil pengguna.');
        toast.error('Gagal Memuat Profil', {
          description: err.message || 'Terjadi kesalahan saat memuat data profil Anda.',
        });
      } finally {
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Anda harus login untuk melihat profil.');
    } else if (status === 'loading') {
      setLoading(true);
    }
  }, [status, session?.user?.id]); // Dependencies untuk useCallback

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); // Panggil fetchUserData dari useEffect

  const handleSuccess = async () => {
    await fetchUserData(); // Ambil data terbaru dari API setelah update
    await updateSession(); // Refresh sesi NextAuth untuk memperbarui nama/email di client
    toast.success('Profil Berhasil Diperbarui', {
      description: 'Informasi profil Anda telah berhasil diperbarui.',
    });
  };

  const handleCancel = () => {
    // Tidak perlu melakukan apa-apa di sini karena EditUserForm akan mereset dirinya sendiri
    // saat props 'user' berubah atau saat dialog ditutup/dibuka kembali.
    // Jika Anda ingin secara eksplisit mereset form, Anda bisa panggil fetchUserData() lagi.
  };

  if (loading || status === 'loading') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pengaturan Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-2">
          <Loader2 className="animate-spin w-5 h-5" />
          <span>Memuat data pengguna...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Gagal Memuat Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  if (!userData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Data Profil Tidak Tersedia</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Tidak dapat memuat data profil Anda. Silakan coba lagi nanti.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pengaturan Profil</CardTitle>
        <CardDescription>Perbarui informasi profil Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <EditUserForm
          user={userData}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          disableRoleAndVerification={true}
        />
      </CardContent>
    </Card>
  );
}
