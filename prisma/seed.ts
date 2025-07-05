// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create an Admin User
  const adminPassword = await hash('admin123', 10); // Password 'admin123'
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      isVerifiedByAdmin: true,
    },
  });
  console.log(`Admin user created/updated: ${adminUser.email} (ID: ${adminUser.id})`);

  // 2. Create an Owner User
  const ownerPassword = await hash('owner123', 10); // Password 'owner123'
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      name: 'Owner User',
      email: 'owner@example.com',
      password: ownerPassword,
      role: 'OWNER',
      isVerifiedByAdmin: true,
    },
  });
  console.log(`Owner user created/updated: ${ownerUser.email} (ID: ${ownerUser.id})`);

  // 3. Create a Customer User
  const customerPassword = await hash('customer123', 10); // Password 'customer123'
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Customer User',
      email: 'customer@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      isVerifiedByAdmin: false,
    },
  });
  console.log(`Customer user created/updated: ${customerUser.email} (ID: ${customerUser.id})`);

  // 4. Create some Vehicles (owned by the Owner User)
  const vehicle1 = await prisma.vehicle.upsert({
    where: { slug: 'toyota-avanza-2023' },
    update: {},
    create: {
      ownerId: ownerUser.id, // Assign to the owner user
      name: 'Toyota Avanza 2023',
      slug: 'toyota-avanza-2023',
      description: 'Mobil keluarga yang nyaman dan irit, cocok untuk perjalanan jauh maupun dalam kota. Dilengkapi AC dingin dan audio modern.',
      type: 'MPV',
      capacity: 7,
      transmissionType: 'AUTOMATIC',
      fuelType: 'Bensin',
      dailyRate: 350000.00,
      lateFeePerDay: 100000.00,
      mainImageUrl: '/images/avanza.jpg', // Pastikan path ini valid di public folder
      isAvailable: true,
      images: {
        create: [
          { imageUrl: '/images/avanza-interior.jpg', altText: 'Interior Toyota Avanza' },
          { imageUrl: '/images/avanza-rear.jpg', altText: 'Belakang Toyota Avanza' },
        ],
      },
    },
  });
  console.log(`Vehicle seeded: ${vehicle1.name}`);

  const vehicle2 = await prisma.vehicle.upsert({
    where: { slug: 'honda-crv-2022' },
    update: {},
    create: {
      ownerId: ownerUser.id, // Assign to the owner user
      name: 'Honda CR-V 2022',
      slug: 'honda-crv-2022',
      description: 'SUV premium dengan desain sporty dan interior mewah. Ideal untuk petualangan atau perjalanan bisnis.',
      type: 'SUV',
      capacity: 5,
      transmissionType: 'AUTOMATIC',
      fuelType: 'Bensin',
      dailyRate: 600000.00,
      lateFeePerDay: 150000.00,
      mainImageUrl: '/images/crv.jpg',
      isAvailable: true,
      images: {
        create: [
          { imageUrl: '/images/crv-interior.jpg', altText: 'Interior Honda CR-V' },
          { imageUrl: '/images/crv-side.jpg', altText: 'Sisi Honda CR-V' },
        ],
      },
    },
  });
  console.log(`Vehicle seeded: ${vehicle2.name}`);

  // 5. Create a sample Order (for Customer User)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7); // Start 7 days from now
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 3); // End 3 days after start

  const rentalDays = 3;
  const totalAmount = Number(vehicle1.dailyRate) * rentalDays;
  const depositAmount = totalAmount * 0.3; // 30% deposit

  const order1 = await prisma.order.upsert({
    where: { id: 1 }, // Assuming first order has ID 1, adjust if needed
    update: {},
    create: {
      userId: customerUser.id,
      vehicleId: vehicle1.id,
      startDate: startDate,
      endDate: endDate,
      rentalDays: rentalDays,
      totalAmount: totalAmount,
      depositAmount: depositAmount,
      remainingAmount: totalAmount - depositAmount,
      paymentMethod: 'BANK_TRANSFER_MANUAL',
      status: 'PENDING_REVIEW',
      adminNotes: 'Initial test order for Avanza by Customer User.'
    }
  });
  console.log(`Order seeded: ID ${order1.id} for ${order1.totalAmount} by ${customerUser.email}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });