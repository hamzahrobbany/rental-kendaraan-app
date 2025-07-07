// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding...');

  // --- Hapus data yang ada (opsional, untuk memastikan data bersih setiap kali seed) ---
  // Hati-hati menggunakan ini di lingkungan produksi!
  await prisma.user.deleteMany();
  console.log('Data pengguna yang ada telah dihapus.');

  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordOwner = await bcrypt.hash('owner123', 10);
  const hashedPasswordCustomer = await bcrypt.hash('customer123', 10);

  // --- Buat Pengguna Contoh ---
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {}, // Tidak ada update jika sudah ada
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPasswordAdmin,
      role: Role.ADMIN,
      isVerifiedByAdmin: true,
      emailVerified: new Date(),
      image: 'https://placehold.co/100x100/FF0000/FFFFFF?text=AD'
    },
  });
  console.log(`Pengguna Admin dibuat: ${adminUser.email}`);

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      name: 'Owner User',
      email: 'owner@example.com',
      password: hashedPasswordOwner,
      role: Role.OWNER,
      isVerifiedByAdmin: true,
      emailVerified: new Date(),
      image: 'https://placehold.co/100x100/00FF00/FFFFFF?text=OW'
    },
  });
  console.log(`Pengguna Owner dibuat: ${ownerUser.email}`);

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Customer User',
      email: 'customer@example.com',
      password: hashedPasswordCustomer,
      role: Role.CUSTOMER,
      isVerifiedByAdmin: false,
      emailVerified: new Date(),
      image: 'https://placehold.co/100x100/0000FF/FFFFFF?text=CU'
    },
  });
  console.log(`Pengguna Customer dibuat: ${customerUser.email}`);

  // --- Anda bisa menambahkan data kendaraan, pesanan, dll. di sini ---
  // Contoh data kendaraan
  // await prisma.vehicle.upsert({
  //   where: { slug: 'toyota-avanza-2023' },
  //   update: {},
  //   create: {
  //     ownerId: ownerUser.id,
  //     name: 'Toyota Avanza 2023',
  //     slug: 'toyota-avanza-2023',
  //     description: 'Kendaraan keluarga yang nyaman dan irit.',
  //     type: 'MPV',
  //     capacity: 7,
  //     transmissionType: 'AUTOMATIC',
  //     fuelType: 'Bensin',
  //     dailyRate: 350000.00,
  //     lateFeePerDay: 50000.00,
  //     mainImageUrl: 'https://placehold.co/600x400/orange/white?text=Avanza',
  //     isAvailable: true,
  //     licensePlate: 'B 1234 ABC',
  //     city: 'Bandung',
  //   },
  // });
  // console.log('Kendaraan contoh dibuat.');

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });