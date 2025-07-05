// types/next-auth.d.ts
import { Role } from '@prisma/client'; // Import Role dari Prisma Client
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role; // Gunakan Role enum
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: number;
    role: Role; // Gunakan Role enum
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role; // Gunakan Role enum
  }
}