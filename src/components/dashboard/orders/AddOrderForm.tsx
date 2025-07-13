// src/components/dashboard/orders/AddOrderForm.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { User, Vehicle, OrderStatus, PaymentMethod, Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import komponen form elements yang baru
import { SelectField } from '@/components/form-elements/SelectField';
import { DateInput } from '@/components/form-elements/DateInput';
import { NumberInput } from '@/components/form-elements/NumberInput';
import { ReadOnlyInput } from '@/components/form-elements/ReadOnlyInput';
import { TextInput } from '@/components/form-elements/TextInput';

interface AddOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddOrderForm({ onSuccess, onCancel }: AddOrderFormProps) {
  // Konsolidasi form state
  const [form, setForm] = useState({
    userId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    depositAmount: '',
    remainingAmount: '', // BARU: Tambahkan remainingAmount ke state
    paymentMethod: '' as PaymentMethod | '',
    orderStatus: OrderStatus.PENDING_REVIEW,
    adminNotes: '',
    pickupLocation: '',
    returnLocation: '',
  });

  // Data for Dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  // Calculated values
  const [selectedVehicleDailyRate, setSelectedVehicleDailyRate] = useState<number>(0);
  const [calculatedRentalDays, setCalculatedRentalDays] = useState<number>(0);
  const [calculatedTotalPrice, setCalculatedTotalPrice] = useState<string>('0.00');

  // Form Control States
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Mengelola perubahan input form
  const handleChange = (field: string, value: string | OrderStatus | PaymentMethod) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Fetch Users (hanya perlu sekali)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRes = await fetch('/api/admin/users');
        if (!usersRes.ok) {
          const errorData = await usersRes.json();
          throw new Error(errorData.message || 'Gagal memuat pengguna.');
        }
        const data: User[] = await usersRes.json();
        const customers = data.filter(u => u.role === Role.CUSTOMER);
        setUsers(customers);
        if (customers.length > 0) {
          setForm(prev => ({ ...prev, userId: customers[0].id.toString() }));
        }
      } catch (err: any) {
        console.error('Error fetching users for order form:', err);
        setDataError(err.message || 'Gagal memuat data pengguna.');
      }
    };
    fetchUsers();
  }, []);

  // Fetch Vehicles berdasarkan tanggal yang dipilih
  const fetchVehiclesByDate = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      let url = '/api/admin/vehicles';
      if (form.startDate && form.endDate) {
        url += `?startDate=${form.startDate}&endDate=${form.endDate}`;
      }

      const vehiclesRes = await fetch(url);
      if (!vehiclesRes.ok) {
        const errorData = await vehiclesRes.json();
        throw new Error(errorData.message || 'Gagal memuat kendaraan.');
      }
      const vehiclesData: Vehicle[] = await vehiclesRes.json();
      setAvailableVehicles(vehiclesData);

      if (vehiclesData.length > 0) {
        if (!vehiclesData.some(v => v.id.toString() === form.vehicleId)) {
          setForm(prev => ({ ...prev, vehicleId: vehiclesData[0].id.toString() }));
        }
        setSelectedVehicleDailyRate(parseFloat(vehiclesData.find(v => v.id.toString() === form.vehicleId)?.dailyRate.toString() || '0'));
      } else {
        setForm(prev => ({ ...prev, vehicleId: '' }));
        setSelectedVehicleDailyRate(0);
      }
    } catch (err: any) {
      console.error('Error fetching vehicles for order form:', err);
      setDataError(err.message || 'Gagal memuat data kendaraan.');
    } finally {
      setDataLoading(false);
    }
  }, [form.startDate, form.endDate, form.vehicleId]);

  useEffect(() => {
    fetchVehiclesByDate();
  }, [fetchVehiclesByDate]);

  useEffect(() => {
    const vehicle = availableVehicles.find(v => v.id.toString() === form.vehicleId);
    if (vehicle) {
      setSelectedVehicleDailyRate(parseFloat(vehicle.dailyRate.toString()));
    } else {
      setSelectedVehicleDailyRate(0);
    }
  }, [form.vehicleId, availableVehicles]);

  // Effect untuk menghitung rentalDays dan totalPrice secara otomatis
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        setCalculatedRentalDays(0);
        setCalculatedTotalPrice('0.00');
        return;
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCalculatedRentalDays(days);

      const calculatedTotal = days * selectedVehicleDailyRate;
      setCalculatedTotalPrice(calculatedTotal.toFixed(2));
    } else {
      setCalculatedRentalDays(0);
      setCalculatedTotalPrice('0.00');
    }
  }, [form.startDate, form.endDate, selectedVehicleDailyRate]);

  // BARU: Effect untuk menghitung remainingAmount
  useEffect(() => {
    const total = parseFloat(calculatedTotalPrice);
    const deposit = parseFloat(form.depositAmount);

    if (!isNaN(total) && !isNaN(deposit)) {
      const remaining = total - deposit;
      setForm(prev => ({ ...prev, remainingAmount: remaining.toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, remainingAmount: calculatedTotalPrice })); // Jika deposit tidak valid, remaining = total
    }
  }, [calculatedTotalPrice, form.depositAmount]);

  // BARU: Effect untuk mengubah orderStatus menjadi PAID jika deposit 100%
  useEffect(() => {
    const total = parseFloat(calculatedTotalPrice);
    const deposit = parseFloat(form.depositAmount);

    if (!isNaN(total) && !isNaN(deposit) && total > 0 && deposit === total) {
      setForm(prev => ({ ...prev, orderStatus: OrderStatus.PAID }));
    }
    // Tidak ada else-if untuk mengubah status kembali dari PAID.
    // Jika status sudah PAID, perubahan deposit tidak akan otomatis mengubahnya kembali.
  }, [calculatedTotalPrice, form.depositAmount]);


  // Handle Next Step
  const handleNext = () => {
    if (currentStep === 1) {
      if (!form.userId || !form.vehicleId || !form.startDate || !form.endDate || parseFloat(calculatedTotalPrice) <= 0) {
        toast.error('Validasi Gagal', { description: 'Harap isi semua bidang wajib di Langkah 1 dan pastikan total harga valid.' });
        return;
      }
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        toast.error('Validasi Gagal', { description: 'Tanggal mulai atau akhir tidak valid.' });
        return;
      }
      if (availableVehicles.length === 0 || !availableVehicles.some(v => v.id.toString() === form.vehicleId)) {
        toast.error('Validasi Gagal', { description: 'Kendaraan yang dipilih tidak tersedia untuk tanggal ini.' });
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  // Handle Previous Step
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(form.userId),
          vehicleId: parseInt(form.vehicleId),
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          totalPrice: parseFloat(calculatedTotalPrice),
          rentalDays: calculatedRentalDays,
          depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : undefined,
          remainingAmount: form.remainingAmount ? parseFloat(form.remainingAmount) : undefined, // Kirim remainingAmount
          paymentMethod: form.paymentMethod || undefined,
          orderStatus: form.orderStatus,
          adminNotes: form.adminNotes || undefined,
          pickupLocation: form.pickupLocation || undefined,
          returnLocation: form.returnLocation || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal membuat pesanan.');
      }

      onSuccess();
      // Reset form fields
      setForm({
        userId: users.length > 0 ? users[0].id.toString() : '',
        vehicleId: '',
        startDate: '',
        endDate: '',
        depositAmount: '',
        remainingAmount: '', // Reset remainingAmount
        paymentMethod: '',
        orderStatus: OrderStatus.PENDING_REVIEW,
        adminNotes: '',
        pickupLocation: '',
        returnLocation: '',
      });
      setCalculatedRentalDays(0);
      setCalculatedTotalPrice('0.00');
      setSelectedVehicleDailyRate(0);
      setCurrentStep(1);

    } catch (err: any) {
      console.error('Error creating order:', err);
      toast.error('Gagal Membuat Pesanan', {
        description: err.message || 'Terjadi kesalahan saat membuat pesanan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Kondisi loading dan error untuk data dropdown
  if (dataLoading && users.length === 0 && availableVehicles.length === 0) {
    return <p className="text-center py-4">Memuat data pengguna dan kendaraan...</p>;
  }

  if (dataError) {
    return <p className="text-center py-4 text-red-500">Error: {dataError}</p>;
  }

  if (users.length === 0) {
    return <p className="text-center py-4 text-orange-500">Tidak ada pelanggan ditemukan. Tambahkan pelanggan terlebih dahulu.</p>;
  }

  // Pesan khusus jika tidak ada kendaraan yang tersedia setelah pemilihan tanggal
  if (availableVehicles.length === 0 && form.startDate && form.endDate && !dataLoading) {
    return <p className="text-center py-4 text-orange-500">Tidak ada kendaraan yang tersedia untuk rentang tanggal yang dipilih.</p>;
  }
  // Pesan awal jika tidak ada kendaraan sama sekali di sistem
  if (availableVehicles.length === 0 && !form.startDate && !form.endDate && !dataLoading) {
    return <p className="text-center py-4 text-orange-500">Tidak ada kendaraan ditemukan. Harap tambahkan kendaraan terlebih dahulu.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {/* Step Indicator */}
      <div className="flex justify-center items-center gap-4 mb-6">
        {[1, 2, 3].map(stepNum => (
          <div
            key={stepNum}
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold
              ${currentStep === stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {stepNum}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Order Details */}
      {currentStep === 1 && (
        <>
          <SelectField
            label="Pelanggan"
            value={form.userId}
            options={users.map(u => ({ value: u.id.toString(), label: `${u.name} (${u.email})` }))}
            onChange={val => handleChange('userId', val)}
            disabled={loading}
            required
          />
          <DateInput
            label="Mulai Sewa"
            value={form.startDate}
            onChange={val => handleChange('startDate', val)}
            disabled={loading}
            required
          />
          <DateInput
            label="Akhir Sewa"
            value={form.endDate}
            onChange={val => handleChange('endDate', val)}
            disabled={loading}
            required
          />
          <SelectField
            label="Kendaraan"
            value={form.vehicleId}
            options={availableVehicles.map(v => ({ value: v.id.toString(), label: `${v.name} (${v.licensePlate}) - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(v.dailyRate.toString()))}/hari` }))}
            onChange={val => handleChange('vehicleId', val)}
            disabled={loading || availableVehicles.length === 0}
            required
          />
          <ReadOnlyInput label="Hari Sewa" value={`${calculatedRentalDays} hari`} />
          <ReadOnlyInput label="Total Harga" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(calculatedTotalPrice))} />
        </>
      )}

      {/* Step 2: Payment & Status Details */}
      {currentStep === 2 && (
        <>
          <NumberInput
            label="Jumlah Deposit"
            value={form.depositAmount}
            onChange={val => handleChange('depositAmount', val)}
            disabled={loading}
            placeholder="Opsional"
          />
          {/* BARU: Input ReadOnly untuk Sisa Pembayaran */}
          <ReadOnlyInput
            label="Sisa Pembayaran"
            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(form.remainingAmount))}
          />
          <SelectField
            label="Metode Pembayaran"
            value={form.paymentMethod}
            options={Object.values(PaymentMethod).map(m => ({ value: m, label: m.replace(/_/g, ' ') }))}
            onChange={val => handleChange('paymentMethod', val as PaymentMethod)}
            disabled={loading}
            placeholder="Pilih Metode Pembayaran"
          />
          <SelectField
            label="Status Pesanan"
            value={form.orderStatus}
            options={Object.values(OrderStatus).map(s => ({ value: s, label: s.replace(/_/g, ' ') }))}
            onChange={val => handleChange('orderStatus', val as OrderStatus)}
            disabled={loading}
            required
          />
        </>
      )}

      {/* Step 3: Additional Notes & Locations */}
      {currentStep === 3 && (
        <>
          <TextInput
            label="Catatan Admin"
            value={form.adminNotes}
            onChange={val => handleChange('adminNotes', val)}
            disabled={loading}
            placeholder="Opsional"
          />
          <TextInput
            label="Lokasi Penjemputan"
            value={form.pickupLocation}
            onChange={val => handleChange('pickupLocation', val)}
            disabled={loading}
            placeholder="Opsional"
          />
          <TextInput
            label="Lokasi Pengembalian"
            value={form.returnLocation}
            onChange={val => handleChange('returnLocation', val)}
            disabled={loading}
            placeholder="Opsional"
          />
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-2 mt-4">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={loading}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Sebelumnya
          </Button>
        )}
        <div className="flex-grow flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          {currentStep < 3 && (
            <Button type="button" onClick={handleNext} disabled={loading}>
              Selanjutnya <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {currentStep === 3 && (
            <Button type="submit" disabled={loading || dataLoading || users.length === 0 || availableVehicles.length === 0 || parseFloat(calculatedTotalPrice) <= 0}>
              {loading ? 'Menambahkan...' : 'Tambah Pesanan'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
