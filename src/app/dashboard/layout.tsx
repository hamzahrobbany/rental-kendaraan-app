// src/app/dashboard/layout.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import Sidebar from '@/components/dashboard/Sidebar'; // Sidebar yang sudah kita buat
import Header from '@/components/dashboard/Header'; // Kita akan buat komponen Header/Navbar

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?error=Unauthorized');
  }

  const userRole: Role | undefined = session.user?.role;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      {session && userRole && (
        <Sidebar userRole={userRole} />
      )}

      <div className="flex flex-col flex-1">
        {/* Header/Navbar */}
        <Header session={session} />

        {/* Konten Utama */}
        {/* Penyesuaian mt-16 dan ml-64 tetap sama */}
        <main className="flex-grow p-8 mt-16 md:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}