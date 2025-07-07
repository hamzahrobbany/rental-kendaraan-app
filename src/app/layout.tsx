// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import NextAuthSessionProvider from '@/components/NextAuthSessionProvider';
import { Toaster } from 'sonner';

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app'; // Import Firebase Core
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

// Dapatkan konfigurasi Firebase dari variabel global
// PENTING: Jika Anda tidak menggunakan lingkungan Canvas, Anda harus menyediakan firebaseConfig Anda di sini.
// Contoh: const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... };
declare const __firebase_config: string; // Deklarasi untuk lingkungan Canvas

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SewaCepat App',
  description: 'Aplikasi Penyewaan Kendaraan',
};

// Inisialisasi Firebase di luar komponen untuk memastikan hanya sekali
// Ini akan dijalankan saat modul dimuat pertama kali di server dan klien
// Pastikan ini tidak menyebabkan masalah hidrasi jika Anda memiliki SSR/SSG
let firebaseApp;
let firebaseStorage;

if (typeof window !== 'undefined') { // Hanya jalankan di sisi klien
  try {
    const firebaseConfig = typeof __firebase_config !== 'undefined'
      ? JSON.parse(__firebase_config)
      : null; // Atau ganti dengan config hardcoded Anda

    if (firebaseConfig && !getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
      firebaseStorage = getStorage(firebaseApp);
      console.log('Firebase initialized in layout.');
    } else if (getApps().length) {
      firebaseApp = getApp();
      firebaseStorage = getStorage(firebaseApp);
      console.log('Firebase already initialized.');
    }
  } catch (e) {
    console.error('Failed to initialize Firebase:', e);
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}