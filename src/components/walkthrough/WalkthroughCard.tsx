import React, { useMemo } from 'react';
import { WalkthroughStep } from './walkthroughSteps';
import {
  Sparkles,
  Users,
  Clock,
  Focus,
  MapPin,
  Building2,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface WalkthroughCardProps {
  step: WalkthroughStep;
  currentIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onJumpToStep: (index: number) => void;
}

export const WalkthroughCard: React.FC<WalkthroughCardProps> = ({
  step,
  currentIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  onJumpToStep,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSteps - 1;

  // Icon selector
  const StepIcon = useMemo(() => {
    switch (step.iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'Users':
        return <Users className="w-5 h-5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'Focus':
        return <Focus className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'CheckCircle':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />;
    }
  }, [step.iconName]);

  // Compute card positioning on desktop
  const cardStyle = useMemo<React.CSSProperties>(() => {
    if (typeof window === 'undefined') return {};

    const isMobile = window.innerWidth < 768;
    if (isMobile || !targetRect || step.position === 'center') {
      // Centered or Mobile Bottom Sheet
      return {};
    }

    const margin = 20;
    const cardWidth = 420;
    const cardHeight = 360;

    let left = targetRect.right + margin;
    let top = targetRect.top;

    // Position Right (default for sidebar elements)
    if (step.position === 'right') {
      left = targetRect.right + margin;
      top = Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, targetRect.top));
      // Fallback if overflowing right edge
      if (left + cardWidth > window.innerWidth - margin) {
        left = Math.max(margin, targetRect.left - cardWidth - margin);
      }
    } else if (step.position === 'bottom') {
      left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, targetRect.left));
      top = targetRect.bottom + margin;
      if (top + cardHeight > window.innerHeight - margin) {
        top = Math.max(margin, targetRect.top - cardHeight - margin);
      }
    } else if (step.position === 'top') {
      left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, targetRect.left));
      top = Math.max(margin, targetRect.top - cardHeight - margin);
    } else if (step.position === 'left') {
      left = Math.max(margin, targetRect.left - cardWidth - margin);
      top = Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, targetRect.top));
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${cardWidth}px`,
    };
  }, [targetRect, step.position]);

  const isDesktopAnchored =
    typeof window !== 'undefined' &&
    window.innerWidth >= 768 &&
    targetRect !== null &&
    step.position !== 'center';

  return (
    <div
      style={isDesktopAnchored ? cardStyle : undefined}
      className={`z-50 select-none ${
        isDesktopAnchored
          ? 'animate-in fade-in zoom-in-95 duration-200'
          : 'fixed inset-x-4 bottom-5 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-[440px] max-w-full animate-in fade-in zoom-in-95 duration-200'
      }`}
    >
      <div className="bg-white dark:bg-[#1e1f20] border border-slate-200/90 dark:border-[#3c4043] rounded-3xl shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6 backdrop-blur-md">
        {/* Header: Badge, Step indicator, Close button */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {step.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-[#004a77]/50 text-blue-700 dark:text-[#8ab4f8] border border-blue-200/80 dark:border-[#004a77] uppercase tracking-wider shrink-0">
                {step.badge}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400 dark:text-[#9aa0a6]">
              {currentIndex + 1} von {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
            title="Einführung beenden"
            aria-label="Einführung beenden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title with Icon */}
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#282a2c] shrink-0 mt-0.5">
            {StepIcon}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#e8eaed] leading-snug">
            {step.title}
          </h2>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c4c7c5] leading-relaxed mb-3.5">
          {step.description}
        </p>

        {/* Optional Tip Box */}
        {step.tip && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-2.5 mb-4 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{step.tip}</div>
          </div>
        )}

        {/* Footer: Progress Dots & Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#3c4043] mt-auto">
          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onJumpToStep(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-blue-600 dark:bg-[#8ab4f8]'
                    : 'w-2 h-2 bg-slate-200 dark:bg-[#3c4043] hover:bg-slate-300 dark:hover:bg-[#5f6368]'
                }`}
                title={`Zu Schritt ${idx + 1} springen`}
                aria-label={`Schritt ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#3c4043] text-xs font-semibold text-slate-600 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Zurück</span>
              </button>
            )}

            {isFirst && (
              <button
                type="button"
                onClick={onSkip}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#e3e3e3] transition-colors cursor-pointer"
              >
                Überspringen
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                isLast
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 ring-2 ring-emerald-400/30'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#131314]'
              }`}
            >
              <span>{isLast ? 'Jetzt starten!' : isFirst ? 'Tour starten' : 'Weiter'}</span>
              {isLast ? (
                <ArrowRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
