// src/app/dashboard/page.tsx (Contoh, bisa juga di page.tsx lainnya)
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // <-- Import komponen Button dari shadcn/ui

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Memuat dashboard...</p>
      </div>
    );
  }

  if (status === 'authenticated' && session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Selamat Datang di Dashboard!</h1>

        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <p className="text-lg text-gray-700 mb-4">
            Anda login sebagai:
            <br />
            <span className="font-semibold">{session.user?.name || session.user?.email}</span>
          </p>

          {session.user?.image && (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-blue-500"
            />
          )}

          <p className="text-sm text-gray-600 mb-6">
            Status Autentikasi: <span className="font-medium text-green-600">Terautentikasi</span>
          </p>

          {/* Ganti button HTML biasa dengan komponen Button dari shadcn/ui */}
          <Button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full" // Anda bisa menambahkan kelas Tailwind di sini
          >
            Logout
          </Button>

          <div className="mt-4 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-500">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-xl text-gray-700">Terjadi kesalahan atau sesi tidak ditemukan.</p>
      <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 ml-2">Login</Link>
    </div>
  );
}