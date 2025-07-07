// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ===========================================
// GET: Mengambil semua pengguna (dengan filter peran opsional)
// ===========================================
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role'); // Ambil parameter 'role' dari URL

    let whereClause: { role?: Role } = {}; // Objek kondisi untuk Prisma
    if (roleFilter && Object.values(Role).includes(roleFilter as Role)) {
      whereClause.role = roleFilter as Role; // Tambahkan filter peran jika valid
    }

    const users = await prisma.user.findMany({
      where: whereClause, // Terapkan kondisi filter
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// POST: Membuat pengguna baru
// ===========================================
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, isVerifiedByAdmin } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Nama, email, kata sandi, dan peran wajib diisi.' },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ message: 'Format email tidak valid.' }, { status: 400 });
    }

    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ message: 'Peran yang diberikan tidak valid.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        isVerifiedByAdmin: isVerifiedByAdmin,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerifiedByAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);

    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Permintaan body bukan JSON yang valid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
