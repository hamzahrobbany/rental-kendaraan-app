'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Vehicle, VehicleType, TransmissionType, FuelType } from '@prisma/client';
import { Car, Users, Fuel, Gauge, MapPin, Search, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// Helper untuk debounce input pencarian
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BrowseVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | 'all'>('all');
  const [selectedTransmissionType, setSelectedTransmissionType] = useState<TransmissionType | 'all'>('all');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/vehicles?';
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedVehicleType !== 'all') params.append('type', selectedVehicleType);
      if (selectedTransmissionType !== 'all') params.append('transmission', selectedTransmissionType);
      if (selectedFuelType !== 'all') params.append('fuel', selectedFuelType);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      url += params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memuat kendaraan.');
      }
      const data: Vehicle[] = await response.json();
      setVehicles(data);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat kendaraan.');
      toast.error('Gagal Memuat Kendaraan', {
        description: err.message || 'Terjadi kesalahan saat memuat daftar kendaraan.',
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedVehicleType, selectedTransmissionType, selectedFuelType, debouncedSearchQuery]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedVehicleType('all');
    setSelectedTransmissionType('all');
    setSelectedFuelType('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      {/* Navbar (Simple, can be expanded) */}
      <header className="bg-white shadow-sm py-4 px-6 fixed w-full z-20 top-0">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-500 hover:text-primary-600 transition-colors">
            SewaCepat
          </Link>
          <div className="space-x-4">
            <Link href="/" className="text-gray-600 hover:text-primary-500 transition-colors">Beranda</Link>
            <Link href="/auth/login" className="bg-primary-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-600 transition-colors">Masuk</Link>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Jelajahi Kendaraan Kami</h1>

        {/* Filter Section */}
        <Card className="mb-8 p-6 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <Search className="h-6 w-6" /> Filter Kendaraan
            </CardTitle>
            <CardDescription>Temukan kendaraan yang sempurna untuk perjalanan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tanggal Mulai & Akhir */}
            <div className="flex flex-col gap-2">
              <label htmlFor="startDate" className="text-sm font-medium">Mulai Sewa</label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                className="rounded-lg"
              />
            </div>

            {/* Tipe Kendaraan */}
            <div className="flex flex-col gap-2">
              <label htmlFor="vehicleType" className="text-sm font-medium">Tipe Kendaraan</label>
              <Select value={selectedVehicleType} onValueChange={(val: VehicleType | 'all') => setSelectedVehicleType(val)}>
                <SelectTrigger id="vehicleType" className="rounded-lg">
                  <SelectValue placeholder="Pilih Tipe Kendaraan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {Object.values(VehicleType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipe Transmisi */}
            <div className="flex flex-col gap-2">
              <label htmlFor="transmissionType" className="text-sm font-medium">Tipe Transmisi</label>
              <Select value={selectedTransmissionType} onValueChange={(val: TransmissionType | 'all') => setSelectedTransmissionType(val)}>
                <SelectTrigger id="transmissionType" className="rounded-lg">
                  <SelectValue placeholder="Pilih Tipe Transmisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {Object.values(TransmissionType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipe Bahan Bakar */}
            <div className="flex flex-col gap-2">
              <label htmlFor="fuelType" className="text-sm font-medium">Tipe Bahan Bakar</label>
              <Select value={selectedFuelType} onValueChange={(val: FuelType | 'all') => setSelectedFuelType(val)}>
                <SelectTrigger id="fuelType" className="rounded-lg">
                  <SelectValue placeholder="Pilih Tipe Bahan Bakar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {Object.values(FuelType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pencarian */}
            <div className="flex flex-col gap-2">
              <label htmlFor="search" className="text-sm font-medium">Cari Kendaraan</label>
              <Input
                id="search"
                type="text"
                placeholder="Nama atau Plat Nomor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg"
              />
            </div>

            {/* Tombol Reset Filter */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-4">
              <Button onClick={handleClearFilters} variant="outline" className="rounded-lg">
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Listing */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Memuat kendaraan...</p>
        ) : error ? (
          <p className="text-center text-lg text-red-500">Error: {error}</p>
        ) : vehicles.length === 0 ? (
          <p className="text-center text-lg text-gray-600">Tidak ada kendaraan yang ditemukan dengan kriteria yang dipilih.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <img
                  src={vehicle.mainImageUrl || `https://placehold.co/600x400/4F46E5/FFFFFF/png?text=${vehicle.name.replace(/\s/g, '+')}`}
                  alt={vehicle.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/600x400/4F46E5/FFFFFF/png?text=${vehicle.name.replace(/\s/g, '+')}`; }}
                />
                <CardContent className="p-6">
                  <CardTitle className="text-2xl font-bold mb-2">{vehicle.name}</CardTitle>
                  <CardDescription className="text-gray-600 mb-4">
                    {vehicle.type.replace(/_/g, ' ')} {vehicle.city ? `di ${vehicle.city}` : ''}
                  </CardDescription>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{vehicle.description || 'Tidak ada deskripsi.'}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
                    <span className="flex items-center"><Users className="h-4 w-4 mr-1 text-gray-500" /> {vehicle.capacity} Kursi</span>
                    <span className="flex items-center"><Fuel className="h-4 w-4 mr-1 text-gray-500" /> {vehicle.fuelType.replace(/_/g, ' ')}</span>
                    <span className="flex items-center"><Gauge className="h-4 w-4 mr-1 text-gray-500" /> {vehicle.transmissionType.replace(/_/g, ' ')}</span>
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-gray-500" /> {vehicle.city || 'N/A'}</span>
                  </div>
                  <div className="text-3xl font-bold text-primary-500 mb-4">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(vehicle.dailyRate.toString()))}
                    <span className="text-lg text-gray-500">/hari</span>
                  </div>
                  {/* PERBAIKAN: Link ke halaman detail kendaraan */}
                  <Link href={`/vehicles/${vehicle.slug}`}>
                    <Button className="w-full bg-primary-500 text-black py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-md">
                      Sewa Sekarang
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
