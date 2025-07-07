// src/components/dashboard/Header.tsx
'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/button'; // Komponen Button dari shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Jika Anda punya komponen Avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Jika Anda punya DropdownMenu
import Link from 'next/link';

interface HeaderProps {
  session: Session | null;
}

export default function Header({ session }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 md:ml-64 w-full md:w-[calc(100%-16rem)] bg-white shadow-sm h-16 flex items-center justify-between px-6 z-20">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>

      <div className="flex items-center space-x-4">
        {/* Contoh: Notifikasi atau ikon lainnya */}
        {/* <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button> */}

        {/* Dropdown Menu untuk Profil Pengguna */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image || undefined} alt="User Avatar" />
                <AvatarFallback>{session?.user?.name ? session.user.name.charAt(0) : session?.user?.email?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  Peran: {session?.user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Pengaturan Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}