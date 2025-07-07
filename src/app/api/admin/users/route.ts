// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db'; // Pastikan ini mengarah ke instance Prisma Anda
import { Role } from '@prisma/client';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // 1. Proteksi: Hanya ADMIN atau OWNER yang bisa mengakses API ini
  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    // 2. Ambil semua pengguna dari database
    const users = await prisma.user.findMany({
      // Anda bisa memilih kolom yang ingin diambil untuk keamanan dan efisiensi
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true, // Tanggal verifikasi email
        image: true,
        role: true,          // Peran pengguna
        isVerifiedByAdmin: true, // Status verifikasi oleh admin
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Urutkan berdasarkan tanggal pembuatan terbaru
      },
    });

    // 3. Kembalikan data pengguna sebagai JSON
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Anda bisa menambahkan method lain seperti POST, PUT, DELETE di file ini nanti
// export async function POST(req: Request) { /* ... */ }
// export async function PUT(req: Request) { /* ... */ }
// export async function DELETE(req: Request) { /* ... */ }