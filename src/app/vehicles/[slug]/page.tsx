// src/app/vehicles/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Vehicle, OrderStatus, PaymentMethod, User } from '@prisma/client';
import { Car, Users, Fuel, Gauge, MapPin, CalendarDays, DollarSign, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Definisi Tipe Data untuk Kendaraan dengan relasi yang disertakan
type VehicleWithRelations = Vehicle & {
  owner: Pick<User, 'id' | 'name' | 'email'>;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession(); // Ambil sesi pengguna
  const slug = params.slug as string;

  const [vehicle, setVehicle] = useState<VehicleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for booking
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalDays, setRentalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [returnLocation, setReturnLocation] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/vehicles/${slug}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal memuat detail kendaraan.');
        }
        const data: VehicleWithRelations = await response.json();
        setVehicle(data);
      } catch (err: any) {
        console.error('Error fetching vehicle details:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat detail kendaraan.');
        toast.error('Gagal Memuat Kendaraan', {
          description: err.message || 'Terjadi kesalahan saat memuat detail kendaraan.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchVehicle();
    }
  }, [slug]);

  // Calculate rental days and total price
  useEffect(() => {
    if (startDate && endDate && vehicle?.dailyRate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        setRentalDays(0);
        setTotalPrice(0);
        setRemainingAmount(0);
        return;
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRentalDays(days);

      const calculatedTotal = days * parseFloat(vehicle.dailyRate.toString());
      setTotalPrice(calculatedTotal);
      setRemainingAmount(calculatedTotal - (parseFloat(depositAmount) || 0)); // Update remaining based on deposit
    } else {
      setRentalDays(0);
      setTotalPrice(0);
      setRemainingAmount(0);
    }
  }, [startDate, endDate, vehicle?.dailyRate, depositAmount]);

  // Update remaining amount when deposit changes
  useEffect(() => {
    const deposit = parseFloat(depositAmount) || 0;
    setRemainingAmount(totalPrice - deposit);
  }, [depositAmount, totalPrice]);


  // Handle booking submission
  const handleBooking = async (e: FormEvent) => {
    e.preventDefault();

    if (status === 'unauthenticated') {
      toast.error('Gagal Memesan', { description: 'Anda harus login untuk memesan kendaraan.' });
      router.push('/auth/login');
      return;
    }

    if (!vehicle) {
      toast.error('Gagal Memesan', { description: 'Detail kendaraan tidak ditemukan.' });
      return;
    }

    if (!startDate || !endDate || rentalDays <= 0 || totalPrice <= 0) {
      toast.error('Validasi Gagal', { description: 'Harap pilih tanggal sewa yang valid.' });
      return;
    }

    if (!pickupLocation || !returnLocation) {
        toast.error('Validasi Gagal', { description: 'Lokasi penjemputan dan pengembalian wajib diisi.' });
        return;
    }

    setBookingLoading(true);

    try {
      const orderStatus = (parseFloat(depositAmount) === totalPrice && totalPrice > 0) ? OrderStatus.PAID : OrderStatus.PENDING_REVIEW;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.id, // ID pengguna dari sesi
          vehicleId: vehicle.id,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          totalPrice: totalPrice,
          rentalDays: rentalDays,
          depositAmount: parseFloat(depositAmount) || 0,
          remainingAmount: remainingAmount,
          paymentMethod: paymentMethod || undefined,
          orderStatus: orderStatus,
          pickupLocation: pickupLocation,
          returnLocation: returnLocation,
          // adminNotes tidak diperlukan di sini
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal membuat pesanan.');
      }

      const newOrder = await response.json();
      toast.success('Pesanan Berhasil Dibuat!', {
        description: `Pesanan Anda untuk ${vehicle.name} telah berhasil dibuat. ID Pesanan: ${newOrder.id}.`,
      });
      // Redirect ke halaman pesanan saya atau detail pesanan
      router.push('/my-orders');
    } catch (err: any) {
      console.error('Error creating order:', err);
      toast.error('Gagal Membuat Pesanan', {
        description: err.message || 'Terjadi kesalahan saat membuat pesanan.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Memuat Detail Kendaraan...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Mohon tunggu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Kendaraan tidak ditemukan.'}</p>
            <Link href="/browse-vehicles">
              <Button className="mt-4">Kembali ke Daftar Kendaraan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      {/* Navbar (Simple, can be expanded) */}
      <header className="bg-white shadow-sm py-4 px-6 fixed w-full z-20 top-0">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-500 hover:text-primary-600 transition-colors">
            SewaCepat
          </Link>
          <div className="space-x-4">
            <Link href="/browse-vehicles" className="text-gray-600 hover:text-primary-500 transition-colors">Jelajahi Kendaraan</Link>
            {session ? (
              <Link href="/my-orders" className="bg-primary-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-600 transition-colors">Pesanan Saya</Link>
            ) : (
              <Link href="/auth/login" className="bg-primary-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-600 transition-colors">Masuk</Link>
            )}
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">{vehicle.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Details Card */}
          <Card className="lg:col-span-2 rounded-xl shadow-lg overflow-hidden">
            <img
              src={vehicle.mainImageUrl || `https://placehold.co/800x500/4F46E5/FFFFFF/png?text=${vehicle.name.replace(/\s/g, '+')}`}
              alt={vehicle.name}
              className="w-full h-80 object-cover"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/800x500/4F46E5/FFFFFF/png?text=${vehicle.name.replace(/\s/g, '+')}`; }}
            />
            <CardContent className="p-6">
              <CardTitle className="text-3xl font-bold mb-4">{vehicle.name}</CardTitle>
              <CardDescription className="text-lg text-gray-700 mb-6">
                {vehicle.description || 'Tidak ada deskripsi untuk kendaraan ini.'}
              </CardDescription>

              <div className="grid grid-cols-2 gap-4 text-gray-800 mb-6">
                <div className="flex items-center gap-2 text-lg">
                  <Car className="h-6 w-6 text-primary-500" />
                  <span>Tipe: {vehicle.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Users className="h-6 w-6 text-primary-500" />
                  <span>Kapasitas: {vehicle.capacity} Kursi</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Gauge className="h-6 w-6 text-primary-500" />
                  <span>Transmisi: {vehicle.transmissionType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Fuel className="h-6 w-6 text-primary-500" />
                  <span>Bahan Bakar: {vehicle.fuelType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="h-6 w-6 text-primary-500" />
                  <span>Kota: {vehicle.city || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <span className="font-semibold">Plat Nomor:</span>
                  <span>{vehicle.licensePlate}</span>
                </div>
              </div>

              <div className="text-4xl font-bold text-primary-600 mb-4">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(vehicle.dailyRate.toString()))}
                <span className="text-xl text-gray-500">/hari</span>
              </div>

              <p className="text-sm text-gray-600">
                Biaya keterlambatan: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(vehicle.lateFeePerDay.toString()))}/hari.
              </p>
            </CardContent>
          </Card>

          {/* Booking Form Card */}
          <Card className="lg:col-span-1 rounded-xl shadow-lg p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-bold mb-2">Pesan Kendaraan Ini</CardTitle>
              <CardDescription>Pilih tanggal dan lengkapi detail pemesanan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {status === 'unauthenticated' ? (
                <div className="text-center py-8">
                  <p className="text-lg text-gray-600 mb-4">Anda harus login untuk memesan.</p>
                  <Link href="/auth/login">
                    <Button className="bg-primary-500 hover:bg-primary-600">Login Sekarang</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="startDate" className="text-sm font-medium">Mulai Sewa</label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="endDate" className="text-sm font-medium">Akhir Sewa</label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Hari Sewa</label>
                    <Input type="text" value={`${rentalDays} hari`} readOnly className="rounded-lg bg-gray-100" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Total Harga</label>
                    <Input type="text" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPrice)} readOnly className="rounded-lg bg-gray-100" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="depositAmount" className="text-sm font-medium">Jumlah Deposit (Opsional)</label>
                    <Input
                      id="depositAmount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Masukkan jumlah deposit"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Sisa Pembayaran</label>
                    <Input type="text" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(remainingAmount)} readOnly className="rounded-lg bg-gray-100" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="paymentMethod" className="text-sm font-medium">Metode Pembayaran</label>
                    <Select value={paymentMethod} onValueChange={(val: PaymentMethod) => setPaymentMethod(val)} required>
                      <SelectTrigger id="paymentMethod" className="rounded-lg">
                        <SelectValue placeholder="Pilih Metode Pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PaymentMethod).map((method) => (
                          <SelectItem key={method} value={method}>
                            {method.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="pickupLocation" className="text-sm font-medium">Lokasi Penjemputan</label>
                    <Input
                      id="pickupLocation"
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Contoh: Bandara, Stasiun, Alamat"
                      required
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="returnLocation" className="text-sm font-medium">Lokasi Pengembalian</label>
                    <Input
                      id="returnLocation"
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      placeholder="Contoh: Bandara, Stasiun, Alamat"
                      required
                      className="rounded-lg"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary-500 text-black py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-md mt-4" disabled={bookingLoading}>
                    {bookingLoading ? 'Memproses Pesanan...' : 'Pesan Sekarang'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
