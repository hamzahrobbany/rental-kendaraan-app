// src/app/api/admin/orders/[id]/route.ts
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

// Fungsi bantuan untuk parsing ID dan validasi
const parseAndValidateId = (id: string) => {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        return null; // ID tidak valid
    }
    return parsedId;
};

// ===========================================
// GET: Ambil detail satu pesanan berdasarkan ID
// ===========================================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const orderId = parseAndValidateId(params.id);
  if (orderId === null) {
    return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, name: true, licensePlate: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error(`Error fetching order ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// PUT: Perbarui pesanan berdasarkan ID
// ===========================================
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const orderId = parseAndValidateId(params.id);
  if (orderId === null) {
    return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
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

    // Validasi Input
    if (!userId || !vehicleId || !startDate || !endDate || totalPrice === undefined || !orderStatus) {
      return NextResponse.json(
        { message: 'Bidang wajib: userId, vehicleId, startDate, endDate, totalPrice, orderStatus.' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ message: 'Tanggal mulai atau akhir tidak valid.' }, { status: 400 });
    }

    // Hitung rentalDays
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (!Object.values(OrderStatus).includes(orderStatus as OrderStatus)) {
      return NextResponse.json({ message: 'Status pesanan tidak valid.' }, { status: 400 });
    }

    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json({ message: 'Metode pembayaran tidak valid.' }, { status: 400 });
    }

    // Periksa apakah User dan Vehicle ada
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const vehicleExists = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicleExists) {
      return NextResponse.json({ message: 'Kendaraan tidak ditemukan.' }, { status: 404 });
    }

    // Validasi Ketersediaan Kendaraan untuk PUT (Kecualikan pesanan saat ini)
    const conflictingOrders = await prisma.order.findMany({
      where: {
        vehicleId: vehicleId,
        id: { not: orderId }, // PENTING: Kecualikan pesanan yang sedang diedit
        AND: [
          {
            startDate: { lte: end },
          },
          {
            endDate: { gte: start },
          },
        ],
        NOT: {
          orderStatus: {
            in: [OrderStatus.CANCELED, OrderStatus.REJECTED, OrderStatus.COMPLETED],
          },
        },
      },
    });

    if (conflictingOrders.length > 0) {
      return NextResponse.json(
        { message: 'Kendaraan ini sudah dipesan dalam rentang tanggal yang dipilih oleh pesanan lain.' },
        { status: 409 } // Conflict
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        userId,
        vehicleId,
        startDate: start,
        endDate: end,
        rentalDays,
        totalPrice: parseFloat(totalPrice),
        orderStatus,
        ...(depositAmount !== undefined && { depositAmount: parseFloat(depositAmount) }),
        ...(remainingAmount !== undefined && { remainingAmount: parseFloat(remainingAmount) }),
        ...(paymentMethod && { paymentMethod: paymentMethod as PaymentMethod }),
        ...(adminNotes && { adminNotes }),
        ...(pickupLocation && { pickupLocation }),
        ...(returnLocation && { returnLocation }),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { name: true } },
        vehicle: { select: { name: true } },
      },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating order ${params.id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// DELETE: Hapus pesanan berdasarkan ID
// ===========================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const orderId = parseAndValidateId(params.id);
  if (orderId === null) {
    return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
  }

  try {
    await prisma.order.delete({
      where: { id: orderId },
    });
    return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting order ${params.id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
