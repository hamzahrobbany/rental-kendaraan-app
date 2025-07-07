// Pastikan path ini benar sesuai lokasi file Role di Prisma Client Anda
import { Role } from '@prisma/client';
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // ID pengguna dari database
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role; // Definisi role di sesi
      emailVerified?: Date | null; // Tambahkan ini jika Anda juga ingin emailVerified di sesi
    };
  }

  // Penting: Perluas juga interface 'User' dari NextAuth.js
  // agar properti `role` dikenali saat `authorize` mengembalikan objek User.
  interface User {
    id: string; // ID pengguna dari database (sudah di-toString() oleh adapter/authorize)
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role; // Definisi role di objek User yang dikembalikan adapter/authorize
    emailVerified?: Date | null; // Definisi emailVerified
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string; // ID di JWT
    role: Role; // Role di JWT
  }
}