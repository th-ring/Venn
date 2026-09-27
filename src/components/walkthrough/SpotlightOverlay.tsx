import React, { useEffect, useState } from 'react';

interface SpotlightOverlayProps {
  targetRect: DOMRect | null;
  padding?: number;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  targetRect,
  padding = 8,
}) => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Validate target visibility
  const isValidTarget =
    targetRect &&
    targetRect.width > 0 &&
    targetRect.height > 0 &&
    targetRect.right > 0 &&
    targetRect.bottom > 0 &&
    targetRect.left < viewport.width &&
    targetRect.top < viewport.height;

  if (!isValidTarget) {
    // Elegant dimmed backdrop for steps without target or when target is off-screen
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 dark:bg-black/55 transition-opacity duration-300 pointer-events-auto"
        aria-hidden="true"
      />
    );
  }

  // Calculate coordinates with padding and clamp to viewport
  const left = Math.max(0, targetRect.left - padding);
  const top = Math.max(0, targetRect.top - padding);
  const width = Math.min(viewport.width - left, targetRect.width + padding * 2);
  const height = Math.min(viewport.height - top, targetRect.height + padding * 2);

  const isFullViewport = width >= viewport.width - 24 && height >= viewport.height - 24;
  const isPillOrCircle = height <= 52;
  const radius = isPillOrCircle ? Math.min(height / 2, 24) : 16;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* SVG Mask for cut-out spotlight */}
      <svg
        className="w-full h-full absolute inset-0 transition-all duration-300 ease-out"
        width={viewport.width}
        height={viewport.height}
      >
        <defs>
          <mask id="walkthrough-spotlight-mask">
            {/* White area = visible backdrop */}
            <rect x="0" y="0" width={viewport.width} height={viewport.height} fill="white" />
            {/* Black cutout = transparent hole for highlighted element */}
            <rect
              x={left}
              y={top}
              width={width}
              height={height}
              rx={radius}
              ry={radius}
              fill="black"
              className="transition-all duration-300 ease-out"
            />
          </mask>
        </defs>

        {/* Semi-transparent dark overlay through the mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#walkthrough-spotlight-mask)"
        />
      </svg>

      {/* Glowing / pulsing highlight ring around the element (hidden if covering whole viewport) */}
      {!isFullViewport && (
        <div
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${radius}px`,
          }}
          className="absolute border-2 border-blue-500/90 dark:border-[#8ab4f8] shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all duration-300 ease-out pointer-events-none ring-4 ring-blue-500/20 animate-pulse"
        />
      )}
    </div>
  );
};
