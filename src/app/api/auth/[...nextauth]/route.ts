// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/db';
import { compare } from 'bcryptjs';
import { Role, PrismaClient } from '@prisma/client';

// Custom Prisma Adapter to include 'role' in user object
import { Adapter } from "next-auth/adapters";

function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const baseAdapter = PrismaAdapter(prisma);
  return {
    ...baseAdapter,
    async getUser(id: string) {
      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user) return null;
      return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    },
    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    },
  } as Adapter;
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};
        if (!email || !password) {
          throw new Error('Email dan password wajib diisi.');
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          throw new Error('Kredensial tidak valid.');
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          throw new Error('Kredensial tidak valid.');
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? Role.CUSTOMER; // fallback default
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Hanya untuk dev mode
  ...(process.env.NODE_ENV === 'development' && {
    allowDangerousEmailAccountLinking: true,
  }),
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
