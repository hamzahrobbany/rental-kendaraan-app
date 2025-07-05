// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db'; // Gunakan alias @/lib/db

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Nama, email, dan password wajib diisi.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER', // Default role saat registrasi adalah CUSTOMER
        isVerifiedByAdmin: false,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser; // Hapus password dari respons

    return NextResponse.json({ message: 'Pendaftaran berhasil!', user: userWithoutPassword }, { status: 201 });

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server saat pendaftaran.' }, { status: 500 });
  }
}