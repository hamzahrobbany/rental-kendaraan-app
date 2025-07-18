// src/app/api/vehicles/[slug]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// ===========================================
// GET: Mengambil detail kendaraan tunggal berdasarkan slug
// ===========================================
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ message: 'Slug kendaraan diperlukan.' }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { slug: slug },
      include: {
        owner: { // Sertakan detail pemilik
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ message: 'Kendaraan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    console.error(`Error fetching vehicle with slug ${slug}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
