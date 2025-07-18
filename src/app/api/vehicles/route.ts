// src/app/api/vehicles/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { VehicleType, TransmissionType, FuelType, OrderStatus } from '@prisma/client';

// ===========================================
// GET: Mengambil daftar kendaraan yang tersedia untuk publik
// ===========================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const vehicleTypeParam = searchParams.get('type');
  const transmissionTypeParam = searchParams.get('transmission');
  const fuelTypeParam = searchParams.get('fuel');
  const searchQuery = searchParams.get('search'); // Untuk pencarian nama/plat nomor

  try {
    let whereClause: any = {
      isAvailable: true, // Hanya tampilkan kendaraan yang tersedia secara umum
    };

    // Filter berdasarkan tanggal ketersediaan (menghindari tumpang tindih pesanan)
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return NextResponse.json({ message: 'Tanggal mulai atau akhir tidak valid.' }, { status: 400 });
      }

      // Temukan semua pesanan yang tumpang tindih dalam rentang tanggal yang diberikan
      // dan yang statusnya memblokir ketersediaan.
      const conflictingOrders = await prisma.order.findMany({
        where: {
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
        select: {
          vehicleId: true,
        },
      });

      const unavailableVehicleIds = conflictingOrders.map(order => order.vehicleId);

      // Tambahkan filter untuk mengecualikan kendaraan yang tidak tersedia
      whereClause.id = {
        notIn: unavailableVehicleIds,
      };
    }

    // Filter berdasarkan VehicleType
    if (vehicleTypeParam && Object.values(VehicleType).includes(vehicleTypeParam as VehicleType)) {
      whereClause.type = vehicleTypeParam as VehicleType;
    }

    // Filter berdasarkan TransmissionType
    if (transmissionTypeParam && Object.values(TransmissionType).includes(transmissionTypeParam as TransmissionType)) {
      whereClause.transmissionType = transmissionTypeParam as TransmissionType;
    }

    // Filter berdasarkan FuelType
    if (fuelTypeParam && Object.values(FuelType).includes(fuelTypeParam as FuelType)) {
      whereClause.fuelType = fuelTypeParam as FuelType;
    }

    // Filter berdasarkan pencarian nama atau plat nomor
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { licensePlate: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      select: { // Pilih hanya kolom yang relevan untuk publik
        id: true,
        name: true,
        slug: true,
        type: true,
        capacity: true,
        transmissionType: true,
        fuelType: true,
        dailyRate: true,
        mainImageUrl: true,
        city: true,
        description: true, // Sertakan deskripsi singkat
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    console.error('Error fetching public vehicles:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
