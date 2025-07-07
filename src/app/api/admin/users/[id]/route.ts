// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Helper function untuk memeriksa izin
const checkAdminOwnerPermission = async () => {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return null; // Mengembalikan null jika tidak ada izin
  }
  return session; // Mengembalikan sesi jika ada izin
};

// ===========================================
// GET: Ambil detail satu pengguna berdasarkan ID
// ===========================================
export async function GET(
  req: Request,
  { params }: { params: { id: string } } // params.id akan selalu string
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  // Konversi userId ke integer
  const userId = parseInt(params.id); // <-- PERUBAHAN PENTING DI SINI
  if (isNaN(userId)) { // Tambahkan validasi jika ID tidak valid
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }, // Sekarang userId adalah Int
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        isVerifiedByAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error); // Gunakan params.id untuk logging awal
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// PUT: Perbarui pengguna berdasarkan ID
// ===========================================
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  // Konversi userId ke integer
  const userId = parseInt(params.id); // <-- PERUBAHAN PENTING DI SINI
  if (isNaN(userId)) { // Tambahkan validasi jika ID tidak valid
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  const body = await req.json();
  const { name, email, role, isVerifiedByAdmin, password } = body;

  try {
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId }, // Sekarang userId adalah Int
      data: {
        name: name,
        email: email,
        role: role as Role,
        isVerifiedByAdmin: isVerifiedByAdmin,
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerifiedByAdmin: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error(`Error updating user ${params.id}:`, error); // Gunakan params.id untuk logging awal
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    // Jika P2025, berarti id tidak ditemukan, tangani sebagai 404
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// DELETE: Hapus pengguna berdasarkan ID
// ===========================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  // Konversi userId ke integer
  const userId = parseInt(params.id); // <-- PERUBAHAN PENTING DI SINI
  if (isNaN(userId)) { // Tambahkan validasi jika ID tidak valid
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id: userId }, // Sekarang userId adalah Int
    });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting user ${params.id}:`, error); // Gunakan params.id untuk logging awal
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}