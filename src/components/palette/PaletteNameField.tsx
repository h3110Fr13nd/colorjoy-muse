import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaletteNameFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown as placeholder and used when the field is left blank. */
  fallbackName: string;
  autoFocus?: boolean;
}

export const PALETTE_NAME_MAX_LENGTH = 60;

const PaletteNameField: React.FC<PaletteNameFieldProps> = ({ id, value, onChange, fallbackName, autoFocus }) => (
  <div className="grid gap-2">
    <Label htmlFor={id}>
      Name <span className="font-normal text-muted-foreground">(optional)</span>
    </Label>
    <Input
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={fallbackName}
      maxLength={PALETTE_NAME_MAX_LENGTH}
      autoComplete="off"
      autoFocus={autoFocus}
    />
    <p className="text-xs text-muted-foreground">Leave blank to use “{fallbackName}”.</p>
  </div>
);

export default PaletteNameField;
