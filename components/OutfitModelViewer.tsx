import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { generateOutfitTurntable } from '../services/geminiService';

interface ViewerItem {
  category?: string;
  name: string | null;
  brand: string | null;
}

interface OutfitModelViewerProps {
  gender: 'Men' | 'Women';
  items: ViewerItem[];
  verdict?: string;
}

const AUTO_ROTATE_DELAY_MS = 3500;
const AUTO_ROTATE_INTERVAL_MS = 1400;
const DRAG_PIXELS_PER_FRAME = 26;

// Inspired by the editorial verdict badges in the reference videos
// (✨ POLISHED / 👍 GOOD / ✍ OBVIOUS).
const deriveVerdict = (items: ViewerItem[], fallback: string = 'POLISHED'): string => {
  const all = items.map(i => `${i.name || ''} ${i.brand || ''}`).join(' ').toLowerCase();
  if (/formal|suit|blazer|coat|trench|tailored/.test(all)) return 'SHARP';
  if (/hoodie|sneaker|jean|t-shirt|tee|casual/.test(all)) return 'GOOD';
  if (/shirt|polo|chino|loafer/.test(all)) return 'POLISHED';
  if (/bold|graphic|statement|jersey|print/.test(all)) return 'OBVIOUS';
  return fallback;
};

export const OutfitModelViewer: React.FC<OutfitModelViewerProps> = ({ gender, items, verdict }) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDragged, setHasDragged] = useState(false);

  const positionRef = useRef(0);
  const [activeFrame, setActiveFrame] = useState(0);

  const dragStateRef = useRef<{
    pointerId: number | null;
    lastX: number;
    velocity: number;
    lastMoveTime: number;
  } | null>(null);

  const momentumRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);

  const frameCount = frames.length;
  const isSpin = frameCount > 1;

  const itemsKey = useMemo(
    () => items.map(i => `${i.brand || ''}:${i.name || ''}`).sort().join('|'),
    [items]
  );

  const displayVerdict = verdict || useMemo(() => deriveVerdict(items), [items]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFrames([]);
    positionRef.current = 0;
    setActiveFrame(0);
    setHasDragged(false);

    generateOutfitTurntable(gender, items)
      .then((result) => {
        if (cancelled) return;
        setFrames(result.frames);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, itemsKey]);

  const stopMomentum = useCallback(() => {
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
  }, []);

  const applyPosition = useCallback(
    (position: number) => {
      const count = frameCount || 1;
      const wrapped = ((Math.round(position) % count) + count) % count;
      positionRef.current = position;
      setActiveFrame(wrapped);
    },
    [frameCount]
  );

  const runMomentum = useCallback(
    (velocity: number) => {
      stopMomentum();
      let v = velocity;
      const step = () => {
        if (Math.abs(v) < 0.02) {
          applyPosition(Math.round(positionRef.current));
          return;
        }
        applyPosition(positionRef.current + v);
        v *= 0.94;
        momentumRef.current = requestAnimationFrame(step);
      };
      momentumRef.current = requestAnimationFrame(step);
    },
    [applyPosition, stopMomentum]
  );

  const scheduleAutoRotate = useCallback(() => {
    if (autoTimerRef.current !== null) window.clearTimeout(autoTimerRef.current);
    if (!isSpin) return;
    autoTimerRef.current = window.setTimeout(function spin() {
      applyPosition(positionRef.current + 1);
      autoTimerRef.current = window.setTimeout(spin, AUTO_ROTATE_INTERVAL_MS);
    }, AUTO_ROTATE_DELAY_MS);
  }, [applyPosition, isSpin]);

  // Drag scrubbing — pan-y keeps vertical page scroll alive.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSpin) return;
    stopMomentum();
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    dragStateRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      velocity: 0,
      lastMoveTime: performance.now(),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    const now = performance.now();
    const dt = Math.max(now - drag.lastMoveTime, 1);
    drag.lastMoveTime = now;
    drag.velocity = (dx / DRAG_PIXELS_PER_FRAME) * (16 / dt);
    if (Math.abs(positionRef.current) > 0.05) setHasDragged(true);
    applyPosition(positionRef.current - dx / DRAG_PIXELS_PER_FRAME);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    setHasDragged(true);
    runMomentum(drag.velocity);
    scheduleAutoRotate();
  };

  useEffect(() => {
    scheduleAutoRotate();
    return () => {
      stopMomentum();
      if (autoTimerRef.current !== null) window.clearTimeout(autoTimerRef.current);
    };
  }, [scheduleAutoRotate, stopMomentum, frameCount]);

  if (loading) {
    return (
      <div className="w-full aspect-[3/4] rounded-[2rem] bg-[#fafafa] border border-black/[0.04] flex flex-col items-center justify-center mb-8">
        <div className="w-10 h-10 border-4 border-t-black border-black/5 rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black animate-pulse">
          Rendering Model
        </p>
      </div>
    );
  }

  if (frameCount === 0) return null;

  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-[2rem] bg-[#fafafa] border border-black/[0.04] overflow-hidden mb-8 select-none ${isSpin ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {frames.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Outfit view ${idx + 1} of ${frameCount}`}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-100"
          style={{ opacity: idx === activeFrame ? 1 : 0 }}
        />
      ))}

      {/* Verdict badges — matches the editorial badges in the reference videos */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
          <span className="w-1 h-1 bg-white rounded-full"></span>
          {displayVerdict}
        </span>
      </div>

      {/* SÉVEN watermark — replaces the @HOLYDRIP.CLUB branding in the reference */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/25">
          SÉVEN
        </span>
      </div>

      {isSpin && !hasDragged && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/85 backdrop-blur-md rounded-full shadow-sm pointer-events-none z-10">
          <RotateCw size={12} className="text-black" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-black">
            Drag
          </span>
        </div>
      )}
    </div>
  );
};
