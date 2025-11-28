import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, className = '' }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group bg-black/20 p-3 border border-transparent hover:border-theme-primary/50 transition-colors ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`w-4 h-4 flex items-center justify-center border transition-all ${checked
          ? 'bg-theme-primary border-theme-primary'
          : 'border-theme-dim group-hover:border-theme-primary'
        }`}>
        {checked && (
          <i className="ri-check-line text-xs font-bold text-black"></i>
        )}
      </div>
      <span className="text-xs font-mono group-hover:text-theme-primary transition-colors">{label}</span>
    </label>
  );
};
