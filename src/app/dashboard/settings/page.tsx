// File: src/app/dashboard/settings/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import EditUserForm from '@/components/dashboard/EditUserForm';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const { data: session } = useSession();
  const [successKey, setSuccessKey] = useState(0); // Untuk re-render saat berhasil

  if (!session?.user) {
    return <p>Memuat profil...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Profil</CardTitle>
        <CardDescription>Perbarui informasi profil Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <EditUserForm
          key={successKey}
          user={session.user as any} // pastikan session.user punya struktur yang sesuai
          onSuccess={() => {
            toast.success('Profil berhasil diperbarui.');
            setSuccessKey((prev) => prev + 1); // reset form
          }}
          onCancel={() => {}}
          disableRoleAndVerification={true}
        />
      </CardContent>
    </Card>
  );
}
