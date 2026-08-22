import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { generateOutfitTurntable } from '../services/geminiService';

interface ViewerItem {
  category?: string;
  name: string | null;
  brand: string | null;
  price?: number | null;
  image_url?: string | null;
}

interface OutfitModelViewerProps {
  gender: 'Men' | 'Women';
  items: ViewerItem[];
  verdict?: string;
}

const AUTO_ROTATE_DELAY_MS = 3500;
const AUTO_ROTATE_INTERVAL_MS = 1400;
const DRAG_PIXELS_PER_FRAME = 26;

// Turntable angle order: [0,45,90,135,180,225,270,315]. The last three
// (225,270,315) are CSS-mirrored twins of (135,90,45) — half the generation
// calls, guaranteed pair identity, back views (180/225) carry no face.
const MIRROR_INDICES = new Set([5, 6, 7]);

// Turn a hex color into a near-black swatch tile color (the reels show small
// labelled color chips next to the model — LIGHT WASH, BLACK, etc.). We
// derive the dominant color of each garment from its name as a fallback.
const COLOR_MAP: Record<string, string> = {
  black: '#0b0b0b', white: '#f4f4f4', navy: '#1f2a44', blue: '#2a4a7a',
  'light blue': '#9bb8d3', 'dark blue': '#1a2b4a', red: '#8b1e2b', green: '#2f5d3a',
  olive: '#5c5a32', cream: '#efe6d3', grey: '#9a9a9a', gray: '#9a9a9a',
  beige: '#d9c8a8', tan: '#b08a5a', khaki: '#a8956b', brown: '#5a3d28',
  charcoal: '#2c2c2c', mustard: '#c8a13a', burgundy: '#5a1822', maroon: '#5a1822',
};
const colorOf = (name: string | null): { label: string; hex: string } | null => {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const key of Object.keys(COLOR_MAP)) {
    if (lower.includes(key)) return { label: key.toUpperCase(), hex: COLOR_MAP[key] };
  }
  return null;
};

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

  // Reels editorial caption — a single lowercase word, italic serif, sits
  // under the model. Derived from the outfit's overall register.
  const editorialCaption = useMemo(() => {
    const all = items.map(i => `${i.name || ''} ${i.brand || ''} ${i.category || ''}`).join(' ').toLowerCase();
    if (/suit|blazer|coat|trench|tailored|formal/.test(all)) return 'tailored';
    if (/hoodie|sneaker|jean|t-shirt|tee|oversiz/.test(all)) return 'monochromatic';
    if (/shirt|polo|chino|loafer/.test(all)) return 'refined';
    if (/jersey|print|graphic|statement/.test(all)) return 'statement';
    return 'curated';
  }, [items]);

  // Active product callouts — tap to surface the buy card. Mirrors the
  // reels' floating garment thumbnail rail.
  const [activeProduct, setActiveProduct] = useState<ViewerItem | null>(null);
  const swatches = useMemo(
    () => items
      .map(i => ({ ...colorOf(i.name), name: i.name }))
      .filter((s): s is { label: string; hex: string; name: string | null } => Boolean(s && s.label)),
    [items]
  );

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

    generateOutfitTurntable(gender, items, (angleIndex, src) => {
      if (cancelled) return;
      // Reveal each frame the moment it resolves so the model appears
      // quickly and the spin fills in as the remaining angles arrive.
      setFrames((prev) => {
        const next = prev.slice();
        next[angleIndex] = src;
        return next;
      });
      setLoading(false);
    })
      .then((result) => {
        if (cancelled) return;
        if (result.frames.length) setFrames(result.frames);
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
      className={`relative w-full aspect-[3/4] rounded-[2rem] bg-[#f7f8fa] border border-black/[0.04] overflow-hidden mb-8 select-none ${isSpin ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* soft studio radial wash behind the model — matches reels cyc */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 80% at 50% 18%, #ffffff 0%, #f1f2f4 60%, #e8eaee 100%)' }} />

      {frames.map((src, idx) => {
        const mirrored = MIRROR_INDICES.has(idx);
        return (
          <img
            key={idx}
            src={src}
            alt={`Outfit view ${idx + 1} of ${frameCount}`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-100"
            style={{ opacity: idx === activeFrame ? 1 : 0, transform: mirrored ? 'scaleX(-1)' : undefined }}
          />
        );
      })}

      {/* contact shadow strip beneath the feet, pinned just above the chrome */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-[5]"
        style={{ bottom: '11%', width: '58%', height: 10, background: 'radial-gradient(60% 50% at 50% 50%, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(6px)' }} />

      {/* Verdict badge — top center editorial pill */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/85 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
          <span className="w-1 h-1 bg-white rounded-full"></span>
          {displayVerdict}
        </span>
      </div>

      {/* Floating product callout cards — left rail */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10 pointer-events-auto">
        {items.slice(0, 4).map((it, idx) => (
          <button
            key={idx}
            onClick={() => setActiveProduct(it)}
            className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-black/5 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            aria-label={`${it.name || ''} — ${it.brand || ''}`}
          >
            {it.image_url
              ? <img src={it.image_url} alt={it.name || ''} className="w-full h-full object-contain" draggable={false} />
              : <span className="text-[8px] font-bold uppercase text-black/50">{(it.category || 'item').slice(0, 4)}</span>}
          </button>
        ))}
      </div>

      {/* Color swatches — right rail */}
      {swatches.length > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none z-10">
          {swatches.map((s, idx) => (
            <div key={idx} className="w-14 bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-sm border border-black/5 flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-md border border-black/10 shadow-inner" style={{ backgroundColor: s.hex }} />
              <span className="text-[7px] font-bold tracking-tight uppercase text-black/55 text-center leading-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SÉVEN watermark — bottom left */}
      <div className="absolute bottom-3 left-4 pointer-events-none z-10">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/30">
          SÉVEN
        </span>
      </div>

      {/* Editorial serif caption — reels' lowercase italic word */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center">
        <span className="font-serif italic text-[20px] text-black/65 tracking-wide lowercase">
          {editorialCaption}
        </span>
      </div>

      {isSpin && !hasDragged && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-3 py-2 bg-white/85 backdrop-blur-md rounded-full shadow-sm pointer-events-none z-10">
          <RotateCw size={11} className="text-black" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-black">
            Drag
          </span>
        </div>
      )}

      {/* Product detail sheet — tap a left-rail card to open */}
      {activeProduct && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-20 p-3" onClick={() => setActiveProduct(null)}>
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">{activeProduct.brand || 'SÉVEN'}</span>
                <h3 className="text-base font-bold text-black leading-tight">{activeProduct.name || 'Piece'}</h3>
              </div>
              <button onClick={() => setActiveProduct(null)} className="text-xs font-semibold text-black/50 hover:text-black px-2">✕</button>
            </div>
            {activeProduct.image_url && (
              <div className="h-32 bg-[#f7f8fa] rounded-2xl flex items-center justify-center p-3">
                <img src={activeProduct.image_url} alt={activeProduct.name || ''} className="max-h-full object-contain" />
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-extrabold text-black">{activeProduct.price ? `$${activeProduct.price.toFixed(2)}` : ''}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">{(activeProduct.category || '').toLowerCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
