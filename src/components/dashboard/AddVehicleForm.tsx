// src/components/dashboard/AddVehicleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { VehicleType, TransmissionType, FuelType, User, Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Firebase Storage Imports
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApps } from 'firebase/app'; // Untuk memeriksa apakah Firebase sudah diinisialisasi

interface AddVehicleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddVehicleForm({ onSuccess, onCancel }: AddVehicleFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<VehicleType>(VehicleType.SEDAN);
  const [capacity, setCapacity] = useState('4');
  const [transmissionType, setTransmissionType] = useState<TransmissionType>(TransmissionType.AUTOMATIC);
  const [fuelType, setFuelType] = useState<FuelType>(FuelType.Bensin);
  const [dailyRate, setDailyRate] = useState('250000');
  const [lateFeePerDay, setLateFeePerDay] = useState('');
  // const [mainImageUrl, setMainImageUrl] = useState(''); // <-- Hapus ini
  const [imageFile, setImageFile] = useState<File | null>(null); // <-- BARU: State untuk file gambar
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // <-- BARU: State untuk preview gambar
  const [isAvailable, setIsAvailable] = useState(true);
  const [licensePlate, setLicensePlate] = useState('');
  const [city, setCity] = useState('');
  const [ownerId, setOwnerId] = useState<string>('');

  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [ownersError, setOwnersError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false); // <-- BARU: State untuk status upload gambar

  // Fetch Owners for the dropdown
  useEffect(() => {
    const fetchOwners = async () => {
      setOwnersLoading(true);
      setOwnersError(null);
      try {
        const response = await fetch('/api/admin/users?role=OWNER');
        if (!response.ok) {
          throw new Error('Failed to fetch owners');
        }
        const data: User[] = await response.json();
        setOwners(data.filter(user => user.role === Role.OWNER));
        if (data.filter(user => user.role === Role.OWNER).length > 0) {
          setOwnerId(data.filter(user => user.role === Role.OWNER)[0].id.toString());
        }
      } catch (err: any) {
        console.error('Error fetching owners:', err);
        setOwnersError(err.message || 'Gagal memuat daftar pemilik.');
      } finally {
        setOwnersLoading(false);
      }
    };
    fetchOwners();
  }, []);

  // Generate slug automatically from name
  useEffect(() => {
    if (name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''));
    } else {
      setSlug('');
    }
  }, [name]);

  // Handle file input change
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file)); // Create a URL for preview
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  // Function to upload image to Firebase Storage
  const uploadImageToFirebase = async (file: File): Promise<string> => {
    if (!getApps().length) {
      toast.error('Error Firebase', { description: 'Firebase belum diinisialisasi. Mohon refresh halaman.' });
      throw new Error('Firebase not initialized');
    }
    setImageUploading(true);
    try {
      const storage = getStorage(); // Dapatkan instance storage
      const storageRef = ref(storage, `vehicle_images/${file.name}_${Date.now()}`); // Buat referensi file unik
      const snapshot = await uploadBytes(storageRef, file); // Unggah file
      const downloadURL = await getDownloadURL(snapshot.ref); // Dapatkan URL publik
      toast.success('Gambar berhasil diunggah', { description: 'Gambar kendaraan telah berhasil diunggah.' });
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image to Firebase:', error);
      toast.error('Gagal Unggah Gambar', { description: error.message || 'Terjadi kesalahan saat mengunggah gambar.' });
      throw error;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalImageUrl = '';

    try {
      if (imageFile) {
        finalImageUrl = await uploadImageToFirebase(imageFile); // Upload gambar jika ada
      }

      const response = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          type,
          capacity: parseInt(capacity),
          transmissionType,
          fuelType,
          dailyRate: parseFloat(dailyRate),
          lateFeePerDay: parseFloat(lateFeePerDay || '0'),
          mainImageUrl: finalImageUrl, // Kirim URL yang didapat dari Firebase Storage
          isAvailable,
          licensePlate,
          city,
          ownerId: parseInt(ownerId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menambahkan kendaraan.');
      }

      onSuccess();
      // Reset form
      setName('');
      setSlug('');
      setDescription('');
      setType(VehicleType.SEDAN);
      setCapacity('4');
      setTransmissionType(TransmissionType.AUTOMATIC);
      setFuelType(FuelType.Bensin);
      setDailyRate('250000');
      setLateFeePerDay('');
      setImageFile(null); // Reset file input
      setImagePreviewUrl(null); // Reset preview
      setIsAvailable(true);
      setLicensePlate('');
      setCity('');
      setOwnerId(owners.length > 0 ? owners[0].id.toString() : '');

    } catch (err: any) {
      console.error('Error adding vehicle:', err);
      toast.error('Gagal Menambahkan Kendaraan', {
        description: err.message || 'Terjadi kesalahan saat menambahkan kendaraan.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="sm:text-right">Nama</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="sm:col-span-3" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="slug" className="sm:text-right">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="sm:col-span-3" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="sm:text-right">Deskripsi</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="sm:text-right">Tipe Kendaraan</Label>
        <Select value={type} onValueChange={(value: VehicleType) => setType(value)}>
          <SelectTrigger className="sm:col-span-3">
            <SelectValue placeholder="Pilih Tipe Kendaraan" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(VehicleType).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="capacity" className="sm:text-right">Kapasitas</Label>
        <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="sm:col-span-3" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="transmissionType" className="sm:text-right">Transmisi</Label>
        <Select value={transmissionType} onValueChange={(value: TransmissionType) => setTransmissionType(value)}>
          <SelectTrigger className="sm:col-span-3">
            <SelectValue placeholder="Pilih Tipe Transmisi" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TransmissionType).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="fuelType" className="sm:text-right">Bahan Bakar</Label>
        <Select value={fuelType} onValueChange={(value: FuelType) => setFuelType(value)}>
          <SelectTrigger className="sm:col-span-3">
            <SelectValue placeholder="Pilih Tipe Bahan Bakar" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(FuelType).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="dailyRate" className="sm:text-right">Harga Harian</Label>
        <Input id="dailyRate" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className="sm:col-span-3" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="lateFeePerDay" className="sm:text-right">Denda Terlambat/Hari</Label>
        <Input id="lateFeePerDay" type="number" value={lateFeePerDay} onChange={(e) => setLateFeePerDay(e.target.value)} className="sm:col-span-3" placeholder="Opsional" />
      </div>
      {/* PERUBAHAN DI SINI: Ganti input URL gambar dengan input file */}
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="mainImage" className="sm:text-right">Gambar Utama</Label>
        <div className="col-span-full sm:col-span-3 flex flex-col gap-2">
          <Input id="mainImage" type="file" accept="image/*" onChange={handleImageFileChange} />
          {imagePreviewUrl && (
            <div className="relative w-full h-32 rounded-md overflow-hidden border">
              <img src={imagePreviewUrl} alt="Image Preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
              >
                Hapus
              </Button>
            </div>
          )}
          {!imagePreviewUrl && (
            <p className="text-sm text-muted-foreground">Pilih file gambar (JPG, PNG, GIF).</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="licensePlate" className="sm:text-right">Plat Nomor</Label>
        <Input id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="sm:col-span-3" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="city" className="sm:text-right">Kota</Label>
        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="sm:col-span-3" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="ownerId" className="sm:text-right">Pemilik</Label>
        {ownersLoading ? (
          <p className="sm:col-span-3 text-sm text-gray-500">Memuat pemilik...</p>
        ) : ownersError ? (
          <p className="sm:col-span-3 text-sm text-red-500">Error: {ownersError}</p>
        ) : owners.length === 0 ? (
          <p className="sm:col-span-3 text-sm text-orange-500">Tidak ada pemilik (OWNER) ditemukan. Harap tambahkan OWNER terlebih dahulu.</p>
        ) : (
          <Select value={ownerId} onValueChange={(value: string) => setOwnerId(value)}>
            <SelectTrigger className="sm:col-span-3">
              <SelectValue placeholder="Pilih Pemilik" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id.toString()}>
                  {owner.name} ({owner.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="isAvailable" className="sm:text-right">Tersedia</Label>
        <div className="col-span-full sm:col-span-3 flex items-center space-x-2">
          <Checkbox id="isAvailable" checked={isAvailable} onCheckedChange={(checked: boolean) => setIsAvailable(checked)} />
          <label htmlFor="isAvailable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Kendaraan Tersedia untuk Disewa
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading || imageUploading}>
          Batal
        </Button>
        <Button type="submit" disabled={loading || imageUploading || ownersLoading || owners.length === 0 || !imageFile}> {/* Disabled jika tidak ada file */}
          {loading || imageUploading ? 'Menambahkan...' : 'Tambah Kendaraan'}
        </Button>
      </div>
    </form>
  );
}