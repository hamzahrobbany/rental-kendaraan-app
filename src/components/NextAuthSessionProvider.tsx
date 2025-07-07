// src/components/NextAuthSessionProvider.tsx
'use client'; // Penting! Ini harus Client Component

import { SessionProvider } from 'next-auth/react';

export default function NextAuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}