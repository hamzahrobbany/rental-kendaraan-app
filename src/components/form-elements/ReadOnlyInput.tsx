// src/components/form-elements/ReadOnlyInput.tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReadOnlyInputProps {
  label: string;
  value: string;
}

export function ReadOnlyInput({ label, value }: ReadOnlyInputProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
      <Label htmlFor={label} className="sm:text-right">{label}</Label>
      <Input
        id={label}
        type="text"
        value={value}
        className="sm:col-span-3"
        readOnly
        disabled // Biasanya readOnly juga disabled secara visual
      />
    </div>
  );
}
