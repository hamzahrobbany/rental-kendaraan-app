// src/app/api/user/profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json({ message: 'Nama dan email tidak boleh kosong.' }, { status: 400 });
    }

    // Cek jika email sudah digunakan oleh user lain
    if (email !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== parseInt(session.user.id)) {
        return NextResponse.json({ message: 'Email sudah digunakan oleh pengguna lain.' }, { status: 409 });
      }
    }

    const dataToUpdate: any = { name, email };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ message: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
      }
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isVerifiedByAdmin: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (err) {
    console.error('Update error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
