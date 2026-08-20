'use client';

import { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Dialog, DialogContent, DialogTitle } from '@tienda/ui';
import type { PDPProduct } from '@lib/storefront/types';

type ProductGalleryProps = {
  product: PDPProduct;
  className?: string;
};

export function ProductGallery({ product, className }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const images = product.images;
  const current = images[selectedIndex]!;

  const goTo = useCallback((index: number) => {
    setSelectedIndex(Math.max(0, Math.min(index, images.length - 1)));
  }, [images.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = imageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0]!.clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0]!.clientX - touchStart;
    if (Math.abs(diff) > 50) {
      goTo(selectedIndex + (diff < 0 ? 1 : -1));
    }
    setTouchStart(null);
  }, [touchStart, selectedIndex, goTo]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goTo(selectedIndex - 1);
    if (e.key === 'ArrowRight') goTo(selectedIndex + 1);
    if (e.key === 'Escape') setFullscreen(false);
  }, [selectedIndex, goTo]);

  if (images.length === 0) {
    return (
      <div className={cn('aspect-square rounded-xl bg-muted flex items-center justify-center text-muted-foreground', className)}>
        Sin imagen disponible
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} onKeyDown={handleKeyDown}>
      <div
        ref={imageRef}
        className="relative aspect-square rounded-xl bg-muted overflow-hidden cursor-crosshair group"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="img"
        aria-label={current.alt}
        tabIndex={0}
      >
        <img
          src={current!.src}
          alt={current!.alt}
          className={cn(
            'h-full w-full object-cover transition-transform duration-200',
            zoomed ? 'scale-150' : 'scale-100',
          )}
          style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          draggable={false}
        />

        {product.videos.length > 0 && (
          <button
            type="button"
            className="absolute top-3 left-3 rounded-lg bg-background/90 p-2 shadow-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ver video del producto"
          >
            <Play className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute top-3 right-3 rounded-lg bg-background/90 p-2 shadow-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Ver en pantalla completa"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => goTo(selectedIndex - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg bg-background/80 p-1.5 shadow-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring opacity-0 group-hover:opacity-100"
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => goTo(selectedIndex + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-background/80 p-1.5 shadow-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring opacity-0 group-hover:opacity-100"
          aria-label="Imagen siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn('h-1.5 rounded-full transition-all', i === selectedIndex ? 'w-6 bg-foreground' : 'w-1.5 bg-foreground/30')}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="hidden sm:flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Miniaturas de imágenes">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            role="tab"
            aria-selected={i === selectedIndex}
            aria-label={`Seleccionar imagen ${i + 1}: ${img.alt}`}
            onClick={() => setSelectedIndex(i)}
            className={cn(
              'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              i === selectedIndex ? 'border-primary' : 'border-border hover:border-muted-foreground/30',
            )}
          >
            <img src={img.src} alt={img.alt} className="h-full w-full object-cover" draggable={false} />
          </button>
        ))}
        {product.videos.map((vid) => (
          <button
            key={vid.id}
            type="button"
            className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-border relative"
            aria-label="Ver video"
          >
            <img src={vid.thumbnail} alt="" className="h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-5 w-5 text-white" />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] h-[90vh] p-0 bg-black/95">
          <DialogTitle className="sr-only">{current!.alt}</DialogTitle>
          <div className="relative flex h-full items-center justify-center">
            <img
              src={current!.src}
              alt={current!.alt}
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar pantalla completa"
            >
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(selectedIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(selectedIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
