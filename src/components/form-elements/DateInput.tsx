// src/components/form-elements/DateInput.tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function DateInput({ label, value, onChange, disabled, required = false }: DateInputProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
      <Label htmlFor={label} className="sm:text-right">{label}</Label>
      <Input
        id={label}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sm:col-span-3"
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
