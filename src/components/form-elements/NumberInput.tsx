// src/components/form-elements/NumberInput.tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  step?: string;
}

export function NumberInput({ label, value, onChange, disabled, required = false, placeholder, step = "0.01" }: NumberInputProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
      <Label htmlFor={label} className="sm:text-right">{label}</Label>
      <Input
        id={label}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sm:col-span-3"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
