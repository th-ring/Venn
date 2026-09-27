import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WALKTHROUGH_STEPS, WalkthroughStep } from './walkthroughSteps';
import { SpotlightOverlay } from './SpotlightOverlay';
import { WalkthroughCard } from './WalkthroughCard';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnsureSidebarOpen?: () => void;
  onEnsureMapVisible?: () => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onEnsureSidebarOpen,
  onEnsureMapVisible,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep: WalkthroughStep = WALKTHROUGH_STEPS[currentIndex] || WALKTHROUGH_STEPS[0];
  const totalSteps = WALKTHROUGH_STEPS.length;

  // Measure target DOM element bounding box
  const updateTargetRect = useCallback(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetId = (isMobile && currentStep.mobileTargetId) ? currentStep.mobileTargetId : currentStep.targetId;

    if (!targetId) {
      setTargetRect(null);
      return;
    }

    let element = document.getElementById(targetId);
    // Fallback to desktop targetId if mobile target not found
    if (!element && currentStep.targetId && targetId !== currentStep.targetId) {
      element = document.getElementById(currentStep.targetId);
    }

    if (!element) {
      setTargetRect(null);
      return;
    }

    // Scroll into view cleanly if element exists
    const scrollContainer = document.getElementById('sidebar-scrollable-body');
    if (scrollContainer && scrollContainer.contains(element)) {
      if (targetId === 'sidebar-first-person-card') {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch {}
    }

    const rect = element.getBoundingClientRect();

    // Validate that the target is truly visible inside viewport (not hidden or translated off-screen)
    const isVisible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight;

    if (!isVisible) {
      setTargetRect(null);
      return;
    }

    setTargetRect(rect);
  }, [isOpen, currentStep]);

  // Adjust view & compute position when step changes
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setTargetRect(null);
      return;
    }

    // Toggle sidebar or map view based on step requirements
    if (currentStep.targetView === 'sidebar' && onEnsureSidebarOpen) {
      onEnsureSidebarOpen();
    } else if (currentStep.targetView === 'map' && onEnsureMapVisible) {
      onEnsureMapVisible();
    }

    // Measure at key animation milestones (initial, mid-slide, slide complete, scroll settled)
    const timers = [
      setTimeout(updateTargetRect, 50),
      setTimeout(updateTargetRect, 180),
      setTimeout(updateTargetRect, 320),
      setTimeout(updateTargetRect, 500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isOpen, currentIndex, currentStep, onEnsureSidebarOpen, onEnsureMapVisible, updateTargetRect]);

  // Keep target rect synchronized on resize & scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handleNext = () => {
    if (currentIndex < totalSteps - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentIndex(index);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Interaktive App-Einführung für Venn"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Background Spotlight Mask */}
      <SpotlightOverlay targetRect={targetRect} padding={10} />

      {/* Floating Walkthrough Card */}
      <WalkthroughCard
        step={currentStep}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        targetRect={targetRect}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={onClose}
        onJumpToStep={handleJumpToStep}
      />
    </div>
  );
};
