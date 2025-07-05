// src/app/layout.tsx
import '../globals.css'; // Pastikan path ini benar (harusnya di src/globals.css)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'; // Import Providers

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SewaCepat - Rental Kendaraan',
  description: 'Aplikasi rental kendaraan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}