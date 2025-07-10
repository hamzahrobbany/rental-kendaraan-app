// File: src/app/dashboard/security/SecuritySettings.tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function SecuritySettings() {
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2fa = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setShow2faSetup(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleDisable2fa = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIs2faEnabled(false);
      setShow2faSetup(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleVerify2fa = async () => {
    setIsLoading(true);
    setTimeout(() => {
      if (twoFactorCode === '123456') {
        setIs2faEnabled(true);
        setShow2faSetup(false);
        setTwoFactorCode('');
        alert('2FA berhasil diaktifkan!');
      } else {
        alert('Kode tidak valid. Coba lagi.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Keamanan</CardTitle>
        <CardDescription>
          Kelola pengaturan keamanan akun Anda, seperti otentikasi dua faktor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-semibold">Otentikasi Dua Faktor (2FA)</h4>
            <p className="text-sm text-muted-foreground">
              Tambahkan lapisan keamanan ekstra ke akun Anda.
            </p>
          </div>
          {is2faEnabled ? (
            <Button
              variant="destructive"
              onClick={handleDisable2fa}
              disabled={isLoading}
            >
              {isLoading ? 'Menonaktifkan...' : 'Nonaktifkan 2FA'}
            </Button>
          ) : (
            <Button onClick={handleEnable2fa} disabled={isLoading}>
              {isLoading ? 'Mengaktifkan...' : 'Aktifkan 2FA'}
            </Button>
          )}
        </div>

        {show2faSetup && (
          <div className="space-y-4 rounded-md border p-4 bg-muted">
            <p className="font-medium">Langkah 1: Pindai Kode QR</p>
            <p className="text-sm text-muted-foreground">
              Gunakan aplikasi autentikator seperti Google Authenticator untuk
              memindai kode QR di bawah ini atau masukkan kunci rahasia secara manual.
            </p>
            <div className="flex flex-col items-center justify-center p-4 bg-background rounded-md border border-dashed">
              <span className="text-sm text-muted-foreground">
                [Kode QR Placeholder]
              </span>
              <p className="mt-2 text-sm font-mono break-all">
                Kunci Rahasia: <span className="font-bold">[KUNCI RAHASIA TEMPORER]</span>
              </p>
            </div>

            <p className="font-medium">Langkah 2: Verifikasi Kode</p>
            <p className="text-sm text-muted-foreground">
              Masukkan kode 6 digit yang dihasilkan oleh aplikasi Anda.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Masukkan kode 2FA"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                className="w-full sm:w-1/2"
              />
              <Button onClick={handleVerify2fa} disabled={isLoading}>
                {isLoading ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2 pt-4">
          <h4 className="text-md font-semibold">Sesi Aktif</h4>
          <p className="text-sm text-muted-foreground">
            Lihat dan kelola perangkat yang saat ini masuk ke akun Anda.
          </p>
          <Button variant="outline" className="w-full sm:w-auto">
            Lihat Sesi Aktif
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
