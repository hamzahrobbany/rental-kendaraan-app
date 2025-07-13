// src/components/form-elements/SelectField.tsx
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function SelectField({ label, value, options, onChange, disabled, required = false, placeholder }: SelectFieldProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
      <Label htmlFor={label} className="sm:text-right">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={label} className="sm:col-span-3">
          <SelectValue placeholder={placeholder || `Pilih ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
