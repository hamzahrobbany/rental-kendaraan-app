// src/components/dashboard/Sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Users, Car, ShoppingCart, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area'; // Import ScrollArea
import { Separator } from '../ui/separator'; // Import Separator

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Dashboard Saya',
      roles: ['ADMIN', 'OWNER', 'CUSTOMER'],
    },
    {
      href: '/dashboard/admin/users',
      icon: Users,
      label: 'Kelola Pengguna',
      roles: ['ADMIN'],
    },
    {
      href: '/dashboard/admin/vehicles',
      icon: Car,
      label: 'Kelola Kendaraan',
      roles: ['ADMIN', 'OWNER'],
    },
    {
      href: '/dashboard/admin/orders',
      icon: ShoppingCart,
      label: 'Kelola Pesanan',
      roles: ['ADMIN', 'OWNER'],
    },
  ];

  return (
    <aside className="fixed top-0 left-0 z-10 flex h-screen w-64 flex-col border-r bg-background px-4 py-8 shadow-sm">
      <div className="mb-6 flex items-center justify-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          SewaCepat
        </Link>
      </div>
      <Separator className="mb-6 bg-gray-200" /> {/* Pemisah gaya Shadcn */}

      <ScrollArea className="flex-grow"> {/* Gunakan ScrollArea untuk konten navigasi */}
        <nav className="grid items-start gap-2">
          {navItems.map((item) => {
            if (item.roles.includes(userRole)) {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary hover:text-primary"
                  )}
                  prefetch={false} // Opsional: untuk kontrol prefetching
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            }
            return null;
          })}
        </nav>
      </ScrollArea>

      <div className="mt-auto pt-6"> {/* Pemisah lebih besar sebelum logout */}
        <Separator className="mb-4 bg-gray-200" />
        <Button
          onClick={() => signOut({ callbackUrl: '/' })}
          variant="secondary" // Menggunakan variant secondary agar cocok dengan tema
          className="w-full justify-start text-base"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}