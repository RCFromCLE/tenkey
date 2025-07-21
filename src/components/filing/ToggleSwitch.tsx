import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  Icon: LucideIcon;
  label: string;
  description: string;
  disabled?: boolean;
}

/**
 * ToggleSwitch component for settings and preferences
 * with icon, label, and description support.
 */
export function ToggleSwitch({
  checked,
  onChange,
  title,
  Icon,
  label,
  description,
  disabled = false
}: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg transition-colors hover:bg-slate-800/60">
      <div className="flex items-start gap-3">
        <Icon className={cn(
          "w-5 h-5 mt-1",
          checked ? "text-blue-400" : "text-slate-500"
        )} />
        <div>
          <h4 className="text-sm font-medium text-slate-200">{label}</h4>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out flex-shrink-0",
          checked ? 'bg-blue-600' : 'bg-slate-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={title}
      >
        <span className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out",
          checked ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
    </div>
  );
}
