'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Vehicle, VehicleType, TransmissionType, FuelType, User } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { uploadToSupabase } from '@/lib/uploadToSupabase';

interface Props {
  vehicle: Vehicle;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditVehicleForm({ vehicle, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(1);

  const [name, setName] = useState(vehicle.name);
  const [slug, setSlug] = useState(vehicle.slug);
  const [description, setDescription] = useState(vehicle.description || '');
  const [type, setType] = useState<VehicleType>(vehicle.type);
  const [capacity, setCapacity] = useState(vehicle.capacity.toString());
  const [transmissionType, setTransmissionType] = useState<TransmissionType>(vehicle.transmissionType);
  const [fuelType, setFuelType] = useState<FuelType>(vehicle.fuelType);
  const [dailyRate, setDailyRate] = useState(vehicle.dailyRate.toString());
  const [lateFeePerDay, setLateFeePerDay] = useState(vehicle.lateFeePerDay?.toString() || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(vehicle.mainImageUrl || '');
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || '');
  const [city, setCity] = useState(vehicle.city || '');
  const [ownerId, setOwnerId] = useState(vehicle.ownerId?.toString() || '');
  const [isAvailable, setIsAvailable] = useState(vehicle.isAvailable);

  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await fetch('/api/admin/users?role=OWNER');
        const data: User[] = await res.json();
        setOwners(data);
      } catch (err) {
        toast.error('Gagal mengambil data pemilik');
      }
    };
    fetchOwners();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return imagePreviewUrl;
    try {
      return await uploadToSupabase(imageFile, 'vehicle_images');
    } catch (err) {
      toast.error('Gagal upload gambar ke Supabase');
      throw err;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = await uploadImage();
      const res = await fetch(`/api/admin/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
          mainImageUrl: imageUrl,
          licensePlate,
          city,
          isAvailable,
          ownerId: parseInt(ownerId),
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan perubahan');
      toast.success('Kendaraan berhasil diperbarui');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Informasi Umum</h3>
          <Input placeholder="Nama" value={name} onChange={e => setName(e.target.value)} required />
          <Input placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} required />
          <Input placeholder="Deskripsi" value={description} onChange={e => setDescription(e.target.value)} />
          <Select value={type} onValueChange={v => setType(v as VehicleType)}>
            <SelectTrigger><SelectValue placeholder="Tipe Kendaraan" /></SelectTrigger>
            <SelectContent>
              {Object.values(VehicleType).map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Kapasitas" value={capacity} onChange={e => setCapacity(e.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Spesifikasi Teknis</h3>
          <Select value={transmissionType} onValueChange={v => setTransmissionType(v as TransmissionType)}>
            <SelectTrigger><SelectValue placeholder="Transmisi" /></SelectTrigger>
            <SelectContent>
              {Object.values(TransmissionType).map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fuelType} onValueChange={v => setFuelType(v as FuelType)}>
            <SelectTrigger><SelectValue placeholder="Bahan Bakar" /></SelectTrigger>
            <SelectContent>
              {Object.values(FuelType).map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Harga & Gambar</h3>
          <Input type="number" placeholder="Harga Harian" value={dailyRate} onChange={e => setDailyRate(e.target.value)} />
          <Input type="number" placeholder="Denda Terlambat per Hari" value={lateFeePerDay} onChange={e => setLateFeePerDay(e.target.value)} />
          <Input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreviewUrl && <img src={imagePreviewUrl} alt="Preview" className="w-full h-32 object-cover rounded" />}
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Status & Pemilik</h3>
          <Input placeholder="Plat Nomor" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required />
          <Input placeholder="Kota" value={city} onChange={e => setCity(e.target.value)} required />
          <div className="flex items-center space-x-2">
            <Checkbox checked={isAvailable} onCheckedChange={(c) => setIsAvailable(!!c)} />
            <span>Tersedia</span>
          </div>
          <Select value={ownerId} onValueChange={v => setOwnerId(v)}>
            <SelectTrigger><SelectValue placeholder="Pilih Pemilik" /></SelectTrigger>
            <SelectContent>
              {owners.map(o => (
                <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-between mt-6">
        {step > 1 && <Button type="button" onClick={() => setStep(s => s - 1)}>Sebelumnya</Button>}
        {step < 4 && <Button type="button" onClick={() => setStep(s => s + 1)}>Berikutnya</Button>}
        {step === 4 && <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  );
}
