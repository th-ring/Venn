import React, { useEffect } from 'react';
import { RotateCcw, X, Check } from 'lucide-react';

interface UndoToastProps {
  message: string | null;
  onUndo: () => void;
  onClose: () => void;
  durationMs?: number;
}

/**
 * Reversible Undo Toast (DIN EN ISO 9241-110 Controllability & Error Tolerance)
 * Allows users to revert automatic configuration adjustments with 1 click.
 */
export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onClose,
  durationMs = 8000,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-[#282a2c]/95 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-700 dark:border-[#3c4043] flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md w-[90%] sm:w-auto"
    >
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5" />
      </div>

      <span className="flex-1 truncate font-medium">{message}</span>

      <button
        type="button"
        onClick={() => {
          onUndo();
          onClose();
        }}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Rückgängig</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Benachrichtigung schließen"
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
