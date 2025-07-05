// src/app/page.tsx (Contoh sederhana)
'use client'; // Pastikan ini ada jika Anda menggunakan hooks

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession(); // Menggunakan useSession hook

  if (status === 'loading') {
    return <div className="text-center mt-8">Memuat sesi...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Selamat Datang di Rental Kendaraan App!</h1>

      {session ? (
        // Jika pengguna sudah login
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">
            Anda login sebagai: **{session.user?.name || session.user?.email}**
          </p>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
          )}
          <button
            onClick={() => signOut()} // Tombol untuk logout
            className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      ) : (
        // Jika pengguna belum login
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">Silakan login untuk melanjutkan.</p>
          <Link href="/auth/login">
            <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">
              Login
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}