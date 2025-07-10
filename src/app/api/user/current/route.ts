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

    if (email !== session.user.email) {
      const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
      if (existingUserWithEmail && existingUserWithEmail.id !== parseInt(session.user.id)) {
        return NextResponse.json({ message: 'Email sudah digunakan oleh pengguna lain.' }, { status: 409 });
      }
    }

    const dataToUpdate: any = {
      name,
      email,
      updatedAt: new Date(),
    };

    if (password && password.length >= 6) {
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

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
