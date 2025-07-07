// src/app/api/admin/vehicles/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db'; // Pastikan path ini benar
import { Role, TransmissionType, FuelType } from '@prisma/client'; // Import Role, TransmissionType, FuelType

// Helper function untuk memeriksa izin
const checkAdminOwnerPermission = async () => {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return null; // Mengembalikan null jika tidak ada izin
  }
  return session; // Mengembalikan sesi jika ada izin
};

// ===========================================
// GET: Mengambil semua kendaraan
// ===========================================
export async function GET(req: Request) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      // Anda bisa memilih kolom yang ingin diambil untuk keamanan dan efisiensi
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true, // VehicleType enum
        capacity: true,
        transmissionType: true, // TransmissionType enum
        fuelType: true, // FuelType enum
        dailyRate: true,
        lateFeePerDay: true,
        mainImageUrl: true,
        isAvailable: true,
        licensePlate: true,
        city: true,
        owner: { // Include owner details
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Urutkan berdasarkan tanggal pembuatan terbaru
      },
    });

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
      type,
      capacity,
      transmissionType,
      fuelType,
      dailyRate,
      lateFeePerDay,
      mainImageUrl,
      isAvailable,
      licensePlate,
      city,
      ownerId, // Owner ID harus disediakan saat membuat kendaraan
    } = body;

    // 1. Validasi Input Dasar
    if (!name || !slug || !type || !capacity || !transmissionType || !fuelType || !dailyRate || !ownerId || !licensePlate || !city) {
      return NextResponse.json(
        { message: 'Semua bidang wajib diisi: nama, slug, tipe, kapasitas, transmisi, bahan bakar, harga harian, pemilik, plat nomor, kota.' },
        { status: 400 }
      );
    }

    // Validasi enum types
    if (!Object.values(TransmissionType).includes(transmissionType as TransmissionType)) {
      return NextResponse.json({ message: 'Tipe transmisi tidak valid.' }, { status: 400 });
    }
    if (!Object.values(FuelType).includes(fuelType as FuelType)) {
      return NextResponse.json({ message: 'Tipe bahan bakar tidak valid.' }, { status: 400 });
    }
    // Asumsi VehicleType adalah string atau enum, validasi bisa ditambahkan jika itu enum
    // if (!Object.values(VehicleType).includes(type as VehicleType)) { ... }

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
        description: description || null, // Deskripsi bisa opsional
        type,
        capacity: parseInt(capacity), // Pastikan ini integer
        transmissionType,
        fuelType,
        dailyRate: parseFloat(dailyRate), // Pastikan ini float
        lateFeePerDay: parseFloat(lateFeePerDay || '0'), // Opsional, default 0
        mainImageUrl: mainImageUrl || 'https://placehold.co/600x400/gray/white?text=No+Image', // Default image
        isAvailable: isAvailable ?? true, // Default true jika tidak disediakan
        licensePlate,
        city,
        ownerId, // Hubungkan dengan owner
      },
      select: { // Pilih data yang ingin dikembalikan
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

    return NextResponse.json(newVehicle, { status: 201 }); // Status 201 Created

  } catch (error: any) {
    console.error('Error creating vehicle:', error);

    // Tangani error Prisma secara spesifik jika ada (misal: unique constraint)
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Slug atau Plat Nomor sudah terdaftar.' }, { status: 409 });
    }
    // Tangani error terkait JSON parse jika req.json() gagal
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Permintaan body bukan JSON yang valid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
