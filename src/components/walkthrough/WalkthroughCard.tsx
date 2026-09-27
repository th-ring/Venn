import React, { useMemo, useRef } from 'react';
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

  // Touch gesture state for mobile swiping between steps
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Detect intentional horizontal swipe (> 45px and predominantly horizontal)
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        // Swiped Left -> Next
        onNext();
      } else {
        // Swiped Right -> Prev
        if (!isFirst) onPrev();
      }
    }
  };

  // Icon selector
  const StepIcon = useMemo(() => {
    switch (step.iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'Users':
        return <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />;
      case 'Clock':
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'Focus':
        return <Focus className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'MapPin':
        return <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'Building2':
        return <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'CheckCircle':
        return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-[#8ab4f8] shrink-0" />;
    }
  }, [step.iconName]);

  // Compute card positioning on desktop
  const cardStyle = useMemo<React.CSSProperties>(() => {
    if (typeof window === 'undefined') return {};

    const isMobile = window.innerWidth < 768;
    if (isMobile || !targetRect || step.position === 'center') {
      return {};
    }

    const margin = 20;
    const cardWidth = 420;
    const cardHeight = 340;

    let left = targetRect.right + margin;
    let top = targetRect.top;

    if (step.position === 'right') {
      left = targetRect.right + margin;
      top = Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, targetRect.top));
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

  // Dynamic mobile placement: place at top if target is in bottom half, bottom if in top half
  const mobilePlacement = useMemo<'top' | 'bottom' | 'center'>(() => {
    if (!targetRect || step.position === 'center') {
      return 'center';
    }
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    // If target starts in lower 52% of screen, position card at top so target is never covered
    return targetRect.top >= vh * 0.48 ? 'top' : 'bottom';
  }, [targetRect, step.position]);

  // Construct placement CSS classes
  const placementClass = useMemo(() => {
    if (isDesktopAnchored) {
      return 'fixed z-50 select-none animate-in fade-in zoom-in-95 duration-200 pointer-events-auto';
    }
    if (mobilePlacement === 'top') {
      return 'fixed z-50 select-none top-[max(0.75rem,calc(env(safe-area-inset-top)+0.5rem))] inset-x-3 sm:inset-x-4 max-w-lg mx-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] animate-in fade-in slide-in-from-top-3 md:slide-in-from-top-0 md:zoom-in-95 duration-200 pointer-events-auto';
    }
    if (mobilePlacement === 'bottom') {
      return 'fixed z-50 select-none bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] inset-x-3 sm:inset-x-4 max-w-lg mx-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] animate-in fade-in slide-in-from-bottom-3 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 pointer-events-auto';
    }
    // Center modal
    return 'fixed z-50 select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 inset-x-3 sm:inset-x-4 max-w-md mx-auto w-[calc(100%-1.5rem)] sm:w-[440px] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto';
  }, [isDesktopAnchored, mobilePlacement]);

  return (
    <div
      style={isDesktopAnchored ? cardStyle : undefined}
      className={placementClass}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-white/95 dark:bg-[#1e1f20]/95 border border-slate-200/90 dark:border-[#3c4043] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-5 backdrop-blur-md max-h-[85vh]">
        {/* Header: Badge, Step indicator, Close button */}
        <div className="flex items-center justify-between gap-3 mb-2 sm:mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {step.badge && (
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-[#004a77]/50 text-blue-700 dark:text-[#8ab4f8] border border-blue-200/80 dark:border-[#004a77] uppercase tracking-wider shrink-0">
                {step.badge}
              </span>
            )}
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-[#9aa0a6]">
              {currentIndex + 1} von {totalSteps}
            </span>
          </div>

          <button
            id="btn-walkthrough-close"
            type="button"
            onClick={onSkip}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer shrink-0 -mr-1"
            title="Einführung beenden"
            aria-label="Einführung beenden"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Title with Icon */}
        <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
          <div className="p-1 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-[#282a2c] shrink-0 mt-0.5">
            {StepIcon}
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#e8eaed] leading-snug">
            {step.title}
          </h2>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c4c7c5] leading-relaxed mb-2.5 sm:mb-3">
          {step.description}
        </p>

        {/* Optional Tip Box */}
        {step.tip && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 mb-3 flex items-start gap-2 text-[11px] sm:text-xs text-amber-900 dark:text-amber-200">
            <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{step.tip}</div>
          </div>
        )}

        {/* Footer: Progress Dots & Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-[#3c4043] mt-auto">
          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1 sm:gap-1.5 py-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onJumpToStep(idx)}
                className={`transition-all rounded-full cursor-pointer p-0.5 ${
                  idx === currentIndex
                    ? 'w-5 sm:w-6 h-2 bg-blue-600 dark:bg-[#8ab4f8]'
                    : 'w-2 h-2 bg-slate-200 dark:bg-[#3c4043] hover:bg-slate-300 dark:hover:bg-[#5f6368]'
                }`}
                title={`Zu Schritt ${idx + 1} springen`}
                aria-label={`Schritt ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isFirst && (
              <button
                id="btn-walkthrough-prev"
                type="button"
                onClick={onPrev}
                className="px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#3c4043] text-xs font-semibold text-slate-600 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors cursor-pointer flex items-center gap-1 min-h-[34px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Zurück</span>
              </button>
            )}

            {isFirst && (
              <button
                id="btn-walkthrough-skip"
                type="button"
                onClick={onSkip}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:hover:text-[#e3e3e3] transition-colors cursor-pointer min-h-[34px] flex items-center"
              >
                Überspringen
              </button>
            )}

            <button
              id="btn-walkthrough-next"
              type="button"
              onClick={onNext}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer min-h-[34px] ${
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
