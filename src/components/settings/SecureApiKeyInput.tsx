import React, { useState } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';

interface SecureApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * State-of-the-Art Secure API Key Input
 * - Defaults to password mask (••••••••)
 * - Blocks clipboard copy and cut actions
 * - Blocks text selection (user-select: none)
 * - Blocks context menu on the input
 * - Disables autofill, spellcheck, and password manager scrapers
 * - Provides controlled temporary show/hide toggle and quick-clear
 */
export const SecureApiKeyInput: React.FC<SecureApiKeyInputProps> = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleCopyOrCut = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center">
        {/* Left Security Icon */}
        <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-400 dark:text-[#747775]">
          <Lock className="w-3.5 h-3.5" />
        </div>

        {/* Masked, Protected Input Field */}
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          onCopy={handleCopyOrCut}
          onCut={handleCopyOrCut}
          onDragStart={handleDragStart}
          onContextMenu={handleContextMenu}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          className="w-full text-xs pl-8 pr-16 py-2 border border-slate-300 dark:border-[#3c4043] rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-[#8ab4f8] font-mono bg-white dark:bg-[#1e1f20] text-slate-900 dark:text-[#e3e3e3] select-none transition-colors disabled:bg-slate-100 dark:disabled:bg-[#131314] disabled:text-slate-400 dark:disabled:text-[#747775]"
        />

        {/* Action Controls (Clear & Visibility Toggle) */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
              title="Key entfernen"
              aria-label="Key entfernen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            disabled={disabled || !value}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isVisible
                ? 'text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-400 hover:text-slate-600 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] disabled:text-slate-300 dark:disabled:text-[#5f6368] disabled:hover:bg-transparent'
            }`}
            title={isVisible ? 'Key verbergen' : 'Key anzeigen (Kopieren gesperrt)'}
            aria-label={isVisible ? 'Key verbergen' : 'Key anzeigen'}
          >
            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Security Status & Notice */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#9aa0a6] px-0.5">
        <div className="flex items-center gap-1">
          {isVisible ? (
            <span className="font-semibold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
              Sichtbar (Kopieren gesperrt)
            </span>
          ) : (
            <span className="text-slate-400 dark:text-[#747775]">
              {value ? 'Geschützt & maskiert' : 'Kein Key hinterlegt'}
            </span>
          )}
        </div>

        {value ? (
          <span className="font-mono text-slate-400 dark:text-[#747775]">
            {value.length} Zeichen hinterlegt
          </span>
        ) : null}
      </div>
    </div>
  );
};
