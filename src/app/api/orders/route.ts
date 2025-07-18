// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { OrderStatus, PaymentMethod } from '@prisma/client';

// ===========================================
// POST: Membuat pesanan baru oleh pengguna yang login
// ===========================================
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Pastikan pengguna sudah login
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized: Harap login untuk memesan.' }, { status: 401 });
  }

  const userId = parseInt(session.user.id); // ID pengguna dari sesi

  try {
    const body = await req.json();
    const {
      vehicleId,
      startDate,
      endDate,
      totalPrice,
      rentalDays,
      depositAmount,
      remainingAmount,
      paymentMethod,
      pickupLocation,
      returnLocation,
    } = body;

    // 1. Validasi Input Dasar
    if (!vehicleId || !startDate || !endDate || totalPrice === undefined || rentalDays === undefined ||
        !paymentMethod || !pickupLocation || !returnLocation) {
      return NextResponse.json(
        { message: 'Semua bidang wajib diisi: kendaraan, tanggal sewa, total harga, hari sewa, metode pembayaran, lokasi penjemputan, lokasi pengembalian.' },
        { status: 400 }
      );
    }

    // Validasi tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ message: 'Tanggal mulai atau akhir tidak valid.' }, { status: 400 });
    }

    // Validasi PaymentMethod
    if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json({ message: 'Metode pembayaran tidak valid.' }, { status: 400 });
    }

    // 2. Periksa Ketersediaan Kendaraan pada Tanggal yang Dipilih
    // Ini adalah pemeriksaan kritis untuk mencegah double-booking.
    const conflictingOrders = await prisma.order.findMany({
      where: {
        vehicleId: vehicleId,
        AND: [
          { startDate: { lte: end } },
          { endDate: { gte: start } },
        ],
        NOT: {
          orderStatus: {
            in: [OrderStatus.CANCELED, OrderStatus.REJECTED, OrderStatus.COMPLETED],
          },
        },
      },
    });

    if (conflictingOrders.length > 0) {
      return NextResponse.json({ message: 'Kendaraan tidak tersedia untuk rentang tanggal yang dipilih.' }, { status: 409 });
    }

    // Tentukan status pesanan berdasarkan deposit
    const finalOrderStatus = (parseFloat(depositAmount) === totalPrice && totalPrice > 0) ? OrderStatus.PAID : OrderStatus.PENDING_REVIEW;

    // 3. Buat Pesanan Baru
    const newOrder = await prisma.order.create({
      data: {
        userId: userId,
        vehicleId: vehicleId,
        startDate: start,
        endDate: end,
        totalPrice: totalPrice,
        rentalDays: rentalDays,
        depositAmount: depositAmount,
        remainingAmount: remainingAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        orderStatus: finalOrderStatus,
        pickupLocation: pickupLocation,
        returnLocation: returnLocation,
        // adminNotes akan null secara default atau bisa ditambahkan nanti oleh admin
      },
      select: {
        id: true,
        orderStatus: true,
        vehicle: { select: { name: true } },
      },
    });

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user order:', error);

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Permintaan body bukan JSON yang valid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
