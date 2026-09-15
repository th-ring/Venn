import React from 'react';

interface SettingsSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export const SettingsSwitch: React.FC<SettingsSwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1e1f20] disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'bg-blue-600 dark:bg-[#8ab4f8]'
          : 'bg-slate-200 dark:bg-[#3c4043]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out dark:bg-[#131314] ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};
