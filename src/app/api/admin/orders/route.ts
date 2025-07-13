// src/app/api/admin/orders/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { Role, OrderStatus, PaymentMethod } from '@prisma/client';

// Fungsi bantuan untuk memeriksa izin ADMIN/OWNER
const checkAdminOwnerPermission = async () => {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return null; // Mengembalikan null jika tidak ada izin
  }
  return session; // Mengembalikan sesi jika ada izin
};

// ===========================================
// GET: Mengambil semua pesanan
// ===========================================
export async function GET(req: Request) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: { // Sertakan data user dan vehicle terkait
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            licensePlate: true,
            dailyRate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Urutkan berdasarkan tanggal pembuatan terbaru
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// POST: Membuat pesanan baru
// ===========================================
export async function POST(req: Request) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      userId,
      vehicleId,
      startDate,
      endDate,
      totalPrice,
      orderStatus,
      depositAmount,
      remainingAmount,
      paymentMethod,
      adminNotes,
      pickupLocation,
      returnLocation,
    } = body;

    // 1. Validasi Input Dasar
    if (!userId || !vehicleId || !startDate || !endDate || totalPrice === undefined) {
      return NextResponse.json(
        { message: 'Bidang wajib: userId, vehicleId, startDate, endDate, totalPrice.' },
        { status: 400 }
      );
    }

    // Validasi tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ message: 'Tanggal mulai atau akhir tidak valid.' }, { status: 400 });
    }

    // Hitung rentalDays
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Validasi OrderStatus (jika disediakan, harus valid)
    if (orderStatus && !Object.values(OrderStatus).includes(orderStatus as OrderStatus)) {
      return NextResponse.json({ message: 'Status pesanan tidak valid.' }, { status: 400 });
    }

    // Validasi PaymentMethod (jika disediakan, harus valid)
    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json({ message: 'Metode pembayaran tidak valid.' }, { status: 400 });
    }

    // 2. Periksa apakah User dan Vehicle ada
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const vehicleExists = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicleExists) {
      return NextResponse.json({ message: 'Kendaraan tidak ditemukan.' }, { status: 404 });
    }

    // 3. Validasi Ketersediaan Kendaraan (Tidak boleh tumpang tindih)
    const conflictingOrders = await prisma.order.findMany({
      where: {
        vehicleId: vehicleId,
        AND: [
          {
            startDate: { lte: end }, // Pesanan yang sudah ada dimulai sebelum atau pada tanggal akhir pesanan baru
          },
          {
            endDate: { gte: start }, // Pesanan yang sudah ada berakhir setelah atau pada tanggal mulai pesanan baru
          },
        ],
        // Kecualikan status yang tidak memblokir ketersediaan (misal: CANCELED, REJECTED, COMPLETED)
        NOT: {
          orderStatus: {
            in: [OrderStatus.CANCELED, OrderStatus.REJECTED, OrderStatus.COMPLETED],
          },
        },
      },
    });

    if (conflictingOrders.length > 0) {
      return NextResponse.json(
        { message: 'Kendaraan ini sudah dipesan dalam rentang tanggal yang dipilih.' },
        { status: 409 } // Conflict
      );
    }

    // 4. Buat Pesanan Baru
    const newOrder = await prisma.order.create({
      data: {
        userId,
        vehicleId,
        startDate: start,
        endDate: end,
        rentalDays,
        totalPrice: parseFloat(totalPrice),
        orderStatus: orderStatus || OrderStatus.PENDING_REVIEW, // Default PENDING_REVIEW
        ...(depositAmount !== undefined && { depositAmount: parseFloat(depositAmount) }),
        ...(remainingAmount !== undefined && { remainingAmount: parseFloat(remainingAmount) }),
        ...(paymentMethod && { paymentMethod: paymentMethod as PaymentMethod }),
        ...(adminNotes && { adminNotes }),
        ...(pickupLocation && { pickupLocation }),
        ...(returnLocation && { returnLocation }),
      },
      include: {
        user: { select: { name: true } },
        vehicle: { select: { name: true } },
      },
    });

    return NextResponse.json(newOrder, { status: 201 }); // Status 201 Created

  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Permintaan body bukan JSON yang valid.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
