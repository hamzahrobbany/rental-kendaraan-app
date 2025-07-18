// src/app/api/user/orders/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { Order, User, Vehicle } from '@prisma/client';

// ===========================================
// GET: Mengambil pesanan untuk pengguna yang sedang login
// ===========================================
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // Pastikan pengguna sudah login
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized: Harap login untuk melihat pesanan Anda.' }, { status: 401 });
  }

  const userId = session.user.id; // Ambil ID pengguna dari sesi

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: parseInt(userId), // Filter pesanan berdasarkan ID pengguna yang login
      },
      include: {
        user: { // Sertakan detail pengguna (opsional, karena kita sudah tahu pengguna ini)
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vehicle: { // Sertakan detail kendaraan yang dipesan
          select: {
            id: true,
            name: true,
            licensePlate: true,
            dailyRate: true,
            mainImageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Urutkan pesanan terbaru di atas
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
