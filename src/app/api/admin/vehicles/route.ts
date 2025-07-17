// src/app/api/admin/vehicles/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { Role, TransmissionType, FuelType, VehicleType, OrderStatus } from '@prisma/client'; // Import VehicleType dan OrderStatus

// Helper function untuk memeriksa izin ADMIN/OWNER
const checkAdminOwnerPermission = async () => {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return null; // Mengembalikan null jika tidak ada izin
  }
  return session; // Mengembalikan sesi jika ada izin
};

// ===========================================
// GET: Mengambil semua kendaraan, opsional difilter berdasarkan ketersediaan tanggal
// ===========================================
export async function GET(req: Request) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const excludeOrderId = searchParams.get('excludeOrderId'); // Untuk EditOrderForm

  try {
    let vehicles;

    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);

      // Validasi tanggal
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return NextResponse.json({ message: 'Tanggal mulai atau akhir tidak valid untuk filter kendaraan.' }, { status: 400 });
      }

      // 1. Temukan semua pesanan yang tumpang tindih dalam rentang tanggal yang diberikan
      //    dan yang statusnya memblokir ketersediaan.
      const conflictingOrders = await prisma.order.findMany({
        where: {
          AND: [
            { startDate: { lte: end } }, // Pesanan yang sudah ada dimulai sebelum atau pada tanggal akhir pesanan baru
            { endDate: { gte: start } }, // Pesanan yang sudah ada berakhir setelah atau pada tanggal mulai pesanan baru
          ],
          NOT: {
            orderStatus: {
              in: [OrderStatus.CANCELED, OrderStatus.REJECTED, OrderStatus.COMPLETED], // Pesanan yang sudah selesai/dibatalkan tidak memblokir
            },
          },
          ...(excludeOrderId && { id: { not: parseInt(excludeOrderId) } }), // Kecualikan pesanan yang sedang diedit
        },
        select: {
          vehicleId: true,
        },
      });

      // 2. Ekstrak ID kendaraan yang tidak tersedia
      const unavailableVehicleIds = conflictingOrders.map(order => order.vehicleId);

      // 3. Ambil kendaraan yang tersedia dan tidak termasuk dalam daftar yang tidak tersedia
      vehicles = await prisma.vehicle.findMany({
        where: {
          isAvailable: true, // Hanya tampilkan yang tersedia secara umum
          id: {
            notIn: unavailableVehicleIds, // Filter kendaraan yang tidak tersedia
          },
        },
        orderBy: {
          name: 'asc',
        },
        select: { // Pilih data yang ingin diambil
          id: true,
          ownerId: true,
          name: true,
          slug: true,
          description: true,
          type: true,
          capacity: true,
          transmissionType: true,
          fuelType: true,
          dailyRate: true,
          lateFeePerDay: true,
          mainImageUrl: true,
          isAvailable: true,
          licensePlate: true,
          city: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          owner: { // Include owner details
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    } else {
      // Jika tidak ada parameter tanggal, ambil semua kendaraan yang tersedia secara umum
      vehicles = await prisma.vehicle.findMany({
        where: {
          isAvailable: true,
        },
        orderBy: {
          name: 'asc',
        },
        select: { // Pilih data yang ingin diambil
          id: true,
          ownerId: true,
          name: true,
          slug: true,
          description: true,
          type: true,
          capacity: true,
          transmissionType: true,
          fuelType: true,
          dailyRate: true,
          lateFeePerDay: true,
          mainImageUrl: true,
          isAvailable: true,
          licensePlate: true,
          city: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          owner: { // Include owner details
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// POST: Membuat kendaraan baru
// ===========================================
export async function POST(req: Request) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      type, // Ini adalah VehicleType
      capacity,
      transmissionType,
      fuelType,
      dailyRate,
      lateFeePerDay,
      mainImageUrl,
      isAvailable,
      licensePlate,
      city,
      ownerId,
    } = body;

    // 1. Validasi Input Dasar
    if (!name || !slug || !type || !capacity || !transmissionType || !fuelType || !dailyRate || !ownerId || !licensePlate || !city) {
      return NextResponse.json(
        { message: 'Semua bidang wajib diisi: nama, slug, tipe, kapasitas, transmisi, bahan bakar, harga harian, pemilik, plat nomor, kota.' },
        { status: 400 }
      );
    }

    // Validasi enum types
    if (!Object.values(VehicleType).includes(type as VehicleType)) { // PERBAIKAN: Validasi VehicleType
      return NextResponse.json({ message: 'Tipe kendaraan tidak valid.' }, { status: 400 });
    }
    if (!Object.values(TransmissionType).includes(transmissionType as TransmissionType)) {
      return NextResponse.json({ message: 'Tipe transmisi tidak valid.' }, { status: 400 });
    }
    if (!Object.values(FuelType).includes(fuelType as FuelType)) {
      return NextResponse.json({ message: 'Tipe bahan bakar tidak valid.' }, { status: 400 });
    }

    // 2. Periksa apakah slug atau licensePlate sudah ada
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        OR: [
          { slug: slug },
          { licensePlate: licensePlate }
        ]
      },
    });

    if (existingVehicle) {
      return NextResponse.json({ message: 'Slug atau Plat Nomor sudah terdaftar.' }, { status: 409 });
    }

    // 3. Pastikan ownerId valid dan ada
    const ownerExists = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true }
    });
    if (!ownerExists) {
        return NextResponse.json({ message: 'Owner ID tidak ditemukan.' }, { status: 400 });
    }

    // 4. Buat Kendaraan Baru
    const newVehicle = await prisma.vehicle.create({
      data: {
        name,
        slug,
        description: description || null,
        type: type as VehicleType, // Pastikan tipe enum
        capacity: parseInt(capacity),
        transmissionType: transmissionType as TransmissionType, // Pastikan tipe enum
        fuelType: fuelType as FuelType, // Pastikan tipe enum
        dailyRate: parseFloat(dailyRate),
        lateFeePerDay: parseFloat(lateFeePerDay || '0'),
        mainImageUrl: mainImageUrl || 'https://placehold.co/600x400/gray/white?text=No+Image',
        isAvailable: isAvailable ?? true,
        licensePlate,
        city,
        ownerId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        dailyRate: true,
        isAvailable: true,
        owner: { select: { name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });

  } catch (error: any) {
    console.error('Error creating vehicle:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Slug atau Plat Nomor sudah terdaftar.' }, { status: 409 });
    }
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Permintaan body bukan JSON yang valid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
