// src/app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Role } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      // Pastikan div ini mengisi sisa ruang yang tersedia dari layout
      // `h-full` atau `min-h-[calc(100vh-theme(spacing.16))]` bisa membantu
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]"> {/* Tinggi disesuaikan dengan header (16 = 4rem) */}
        <p className="text-xl text-gray-700">Memuat dashboard...</p>
      </div>
    );
  }

  if (status === 'authenticated' && session) {
    const userRole = session.user?.role;

    // --- Tampilan untuk ADMIN atau OWNER ---
    if (userRole === Role.ADMIN || userRole === Role.OWNER) {
      return (
        // Container ini akan mengambil lebar penuh dari `main` di layout
        // `max-w-full` memastikan tidak ada overflow horizontal
        // `space-y-6` atau `gap-6` untuk jarak vertikal antar elemen
        <div className="w-full max-w-full mx-auto space-y-6"> {/* Perubahan di sini */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Dashboard Admin</CardTitle>
              <CardDescription>
                Selamat datang, {session.user?.name} ({userRole}). Ini adalah panel administrasi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">
                Di sini Anda dapat mengelola data pengguna, kendaraan, pesanan, dan lainnya.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/dashboard/admin/users" passHref>
                  <Button className="w-full h-24 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                    Kelola Pengguna
                  </Button>
                </Link>
                <Link href="/dashboard/admin/vehicles" passHref>
                  <Button className="w-full h-24 text-lg font-semibold bg-green-600 hover:bg-green-700">
                    Kelola Kendaraan
                  </Button>
                </Link>
                <Link href="/dashboard/admin/orders" passHref>
                  <Button className="w-full h-24 text-lg font-semibold bg-purple-600 hover:bg-purple-700">
                    Kelola Pesanan
                  </Button>
                </Link>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3">Ringkasan Statistik (Segera Hadir)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Total Pengguna</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-gray-800">...</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Total Pesanan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-gray-800">...</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // --- Tampilan untuk CUSTOMER (default) ---
    return (
      // Container ini akan mengambil lebar penuh dari `main` di layout
      // `max-w-md` masih bisa dipertahankan jika Anda ingin content customer lebih terpusat
      <div className="w-full max-w-md mx-auto text-center space-y-6"> {/* Perubahan di sini */}
        <h1 className="text-4xl font-bold text-gray-800">Selamat Datang di Dashboard!</h1> {/* Hapus mb-6 dari sini */}

        <Card> {/* Membungkus konten utama customer di dalam Card */}
          <CardHeader>
            <CardTitle className="text-2xl">Ringkasan Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4"> {/* Menggunakan space-y untuk jarak vertikal */}
            <p className="text-lg text-gray-700">
              Anda login sebagai:
              <br />
              <span className="font-semibold">{session.user?.name || session.user?.email}</span>
            </p>

            {session.user?.image && (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto border-2 border-blue-500"
              />
            )}

            <p className="text-sm text-gray-600">
              Status Autentikasi: <span className="font-medium text-green-600">Terautentikasi</span>
              <br/>
              Peran Anda: <span className="font-medium text-purple-600">{userRole}</span>
            </p>

            {/* Bagian khusus untuk CUSTOMER */}
            <div className="space-y-3"> {/* Menggunakan space-y untuk jarak antar tombol/info */}
              <p className="text-md text-gray-700">Ini adalah dashboard pengguna biasa Anda.</p>
              <Link href="/browse-vehicles" passHref>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Lihat Kendaraan Tersedia</Button>
              </Link>
              <Link href="/my-orders" passHref>
                  <Button variant="outline" className="w-full">Pesanan Saya</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tampilan jika ada masalah atau sesi tidak ditemukan setelah loading
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]"> {/* Tinggi disesuaikan dengan header */}
      <p className="text-xl text-gray-700">Terjadi kesalahan atau sesi tidak ditemukan.</p>
      <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 ml-2">Login</Link>
    </div>
  );
}