// src/app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get('error');
    const regSuccess = searchParams.get('registrationSuccess');

    if (authError === 'CredentialsSignin') {
      setError('Email atau password salah.');
    } else if (authError === 'OAuthAccountNotLinked') {
      setError('Email ini sudah terdaftar dengan metode lain. Silakan login dengan metode sebelumnya atau hubungi admin.');
    } else if (authError) {
      setError('Terjadi kesalahan saat login.');
    }

    if (regSuccess === 'true') {
      setRegistrationSuccess(true);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('registrationSuccess');
      router.replace(newUrl.toString(), { scroll: false });
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegistrationSuccess(false);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        setError('Email atau password salah.');
      } else {
        setError('Terjadi kesalahan saat login: ' + result.error);
      }
    } else if (result?.ok) {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setRegistrationSuccess(false);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md"> {/* Gunakan Card sebagai container utama */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Masuk ke akun Anda untuk melanjutkan.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Formulir Login Email/Password */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {registrationSuccess && <p className="text-green-500 text-sm text-center">Pendaftaran berhasil! Silakan login.</p>}

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          {/* Pemisah "Atau" */}
          <div className="relative mt-6 mb-4"> {/* Atur margin di sini */}
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Atau</span>
            </div>
          </div>

          {/* Tombol Login dengan Google */}
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2"
          >
            {/* Ikon Google SVG */}
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 39.6z"
              ></path>
            </svg>
            Masuk dengan Google
          </Button>

          {/* Link "Belum punya akun?" */}
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              Daftar di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}