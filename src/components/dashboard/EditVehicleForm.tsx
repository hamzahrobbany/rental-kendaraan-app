// src/components/dashboard/EditVehicleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Vehicle, TransmissionType, FuelType, User, VehicleType, Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Firebase Storage Imports
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Import deleteObject
import { getApps } from 'firebase/app'; // Untuk memeriksa apakah Firebase sudah diinisialisasi

interface EditVehicleFormProps {
  vehicle: Vehicle;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditVehicleForm({ vehicle, onSuccess, onCancel }: EditVehicleFormProps) {
  const [name, setName] = useState(vehicle.name || '');
  const [slug, setSlug] = useState(vehicle.slug || '');
  const [description, setDescription] = useState(vehicle.description || '');
  const [type, setType] = useState<VehicleType>(vehicle.type);
  const [capacity, setCapacity] = useState(vehicle.capacity.toString());
  const [transmissionType, setTransmissionType] = useState<TransmissionType>(vehicle.transmissionType);
  const [fuelType, setFuelType] = useState<FuelType>(vehicle.fuelType);
  const [dailyRate, setDailyRate] = useState(vehicle.dailyRate.toString());
  const [lateFeePerDay, setLateFeePerDay] = useState(vehicle.lateFeePerDay?.toString() || '');
  const [ownerId, setOwnerId] = useState<string>(vehicle.ownerId?.toString() || '');
  // const [mainImageUrl, setMainImageUrl] = useState(vehicle.mainImageUrl || ''); // <-- Hapus ini
  const [imageFile, setImageFile] = useState<File | null>(null); // <-- BARU: State untuk file gambar baru
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(vehicle.mainImageUrl || null); // <-- BARU: State untuk preview, inisialisasi dengan URL yang ada
  const [isAvailable, setIsAvailable] = useState(vehicle.isAvailable);
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || '');
  const [city, setCity] = useState(vehicle.city || '');

  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [ownersError, setOwnersError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false); // <-- BARU: State untuk status upload gambar

  // Reset form state jika vehicle berubah
  useEffect(() => {
    setName(vehicle.name || '');
    setSlug(vehicle.slug || '');
    setDescription(vehicle.description || '');
    setType(vehicle.type);
    setCapacity(vehicle.capacity.toString());
    setTransmissionType(vehicle.transmissionType);
    setFuelType(vehicle.fuelType);
    setDailyRate(vehicle.dailyRate.toString());
    setLateFeePerDay(vehicle.lateFeePerDay?.toString() || '');
    setOwnerId(vehicle.ownerId?.toString() || '');
    setImageFile(null); // Reset file input
    setImagePreviewUrl(vehicle.mainImageUrl || null); // Reset preview ke gambar asli
    setIsAvailable(vehicle.isAvailable);
    setLicensePlate(vehicle.licensePlate || '');
    setCity(vehicle.city || '');
  }, [vehicle]);

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
        if (!vehicle.ownerId && data.filter(user => user.role === Role.OWNER).length > 0) {
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
  }, [vehicle.ownerId]);

  // Handle file input change
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file)); // Create a URL for preview
    } else {
      setImageFile(null);
      setImagePreviewUrl(vehicle.mainImageUrl || null); // Kembali ke gambar asli jika tidak ada file baru
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
      const storage = getStorage();
      const storageRef = ref(storage, `vehicle_images/${file.name}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
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

  // Function to delete old image from Firebase Storage (optional, but good practice)
  const deleteOldImageFromFirebase = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      return; // Hanya hapus jika itu URL dari Firebase Storage
    }
    try {
      const storage = getStorage();
      const imageRef = ref(storage, imageUrl); // Ref dari URL
      await deleteObject(imageRef);
      console.log('Old image deleted from Firebase Storage:', imageUrl);
    } catch (error) {
      console.warn('Could not delete old image from Firebase Storage (might not exist or permissions):', error);
      // Jangan tampilkan toast error ke user untuk ini, karena ini operasi latar belakang
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalImageUrl = vehicle.mainImageUrl; // Default ke URL yang sudah ada

    try {
      if (imageFile) { // Jika ada file baru yang dipilih
        if (vehicle.mainImageUrl) { // Jika ada gambar lama, coba hapus
          await deleteOldImageFromFirebase(vehicle.mainImageUrl);
        }
        finalImageUrl = await uploadImageToFirebase(imageFile); // Unggah gambar baru
      } else if (imagePreviewUrl === null && vehicle.mainImageUrl) {
        // Jika preview dihapus dan sebelumnya ada gambar, berarti user ingin menghapus gambar
        await deleteOldImageFromFirebase(vehicle.mainImageUrl);
        finalImageUrl = null; // Set URL ke null di database
      }


      const response = await fetch(`/api/admin/vehicles/${vehicle.id}`, {
        method: 'PUT',
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
          mainImageUrl: finalImageUrl, // Kirim URL yang didapat dari Firebase Storage atau null
          isAvailable,
          licensePlate,
          city,
          ownerId: parseInt(ownerId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui kendaraan.');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error updating vehicle:', err);
      toast.error('Gagal Memperbarui Kendaraan', {
        description: err.message || 'Terjadi kesalahan saat memperbarui kendaraan.',
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
                onClick={() => { setImageFile(null); setImagePreviewUrl(null); }} // Hapus preview dan file
              >
                Hapus
              </Button>
            </div>
          )}
          {!imagePreviewUrl && (
            <p className="text-sm text-muted-foreground">Pilih file gambar (JPG, PNG, GIF) atau biarkan kosong.</p>
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
        <Button type="submit" disabled={loading || imageUploading || ownersLoading || owners.length === 0}>
          {loading || imageUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}