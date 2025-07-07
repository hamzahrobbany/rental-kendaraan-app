// src/app/api/admin/vehicles/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { Role, TransmissionType, FuelType } from '@prisma/client'; // Import enums

// Helper function untuk memeriksa izin
const checkAdminOwnerPermission = async () => {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.OWNER)) {
    return null; // Mengembalikan null jika tidak ada izin
  }
  return session; // Mengembalikan sesi jika ada izin
};

// Helper function untuk parsing ID dan validasi
const parseAndValidateId = (id: string) => {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        return null; // ID tidak valid
    }
    return parsedId;
};

// ===========================================
// GET: Ambil detail satu kendaraan berdasarkan ID
// ===========================================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const vehicleId = parseAndValidateId(params.id);
  if (vehicleId === null) {
    return NextResponse.json({ message: 'Invalid Vehicle ID' }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
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
        ownerId: true, // Sertakan ownerId untuk form edit
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    console.error(`Error fetching vehicle ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// PUT: Perbarui kendaraan berdasarkan ID
// ===========================================
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const vehicleId = parseAndValidateId(params.id);
  if (vehicleId === null) {
    return NextResponse.json({ message: 'Invalid Vehicle ID' }, { status: 400 });
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
      ownerId,
    } = body;

    // Validasi Input Dasar (sesuaikan dengan kebutuhan update)
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

    // Periksa apakah slug atau licensePlate sudah ada untuk kendaraan lain
    const existingVehicle = await prisma.vehicle.findFirst({
        where: {
            id: { not: vehicleId }, // Kecuali kendaraan yang sedang diedit
            OR: [
                { slug: slug },
                { licensePlate: licensePlate }
            ]
        },
    });

    if (existingVehicle) {
        return NextResponse.json({ message: 'Slug atau Plat Nomor sudah terdaftar untuk kendaraan lain.' }, { status: 409 });
    }

    // Pastikan ownerId valid dan ada
    const ownerExists = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true }
    });
    if (!ownerExists) {
        return NextResponse.json({ message: 'Owner ID tidak ditemukan.' }, { status: 400 });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        name,
        slug,
        description,
        type,
        capacity: parseInt(capacity),
        transmissionType,
        fuelType,
        dailyRate: parseFloat(dailyRate),
        lateFeePerDay: parseFloat(lateFeePerDay || '0'),
        mainImageUrl: mainImageUrl || 'https://placehold.co/600x400/gray/white?text=No+Image',
        isAvailable: isAvailable ?? true,
        licensePlate,
        city,
        ownerId,
      },
      select: { // Pilih data yang ingin dikembalikan setelah update
        id: true,
        name: true,
        slug: true,
        type: true,
        dailyRate: true,
        isAvailable: true,
        owner: { select: { name: true } },
        updatedAt: true,
      }
    });

    return NextResponse.json(updatedVehicle, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating vehicle ${params.id}:`, error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Slug atau Plat Nomor sudah terdaftar.' }, { status: 409 });
    }
    if (error.code === 'P2025') { // Kendaraan tidak ditemukan
        return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ===========================================
// DELETE: Hapus kendaraan berdasarkan ID
// ===========================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminOwnerPermission();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: Access Denied' }, { status: 403 });
  }

  const vehicleId = parseAndValidateId(params.id);
  if (vehicleId === null) {
    return NextResponse.json({ message: 'Invalid Vehicle ID' }, { status: 400 });
  }

  try {
    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });
    return NextResponse.json({ message: 'Vehicle deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting vehicle ${params.id}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
