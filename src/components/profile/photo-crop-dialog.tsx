"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

interface PhotoCropDialogProps {
  file: File;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function PhotoCropDialog({
  file,
  onConfirm,
  onCancel,
}: PhotoCropDialogProps) {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const SIZE = 240;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgSize({
        w: imgRef.current.naturalWidth,
        h: imgRef.current.naturalHeight,
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img || imgSize.w === 0) return;

    const canvas = document.createElement("canvas");
    const outputSize = 512; // Output resolution
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Calculate draw size: image fills the container then scale is applied
    const aspect = imgSize.w / imgSize.h;
    let drawW: number, drawH: number;
    if (aspect >= 1) {
      // Landscape: height fills container
      drawH = SIZE * scale;
      drawW = drawH * aspect;
    } else {
      // Portrait: width fills container
      drawW = SIZE * scale;
      drawH = drawW / aspect;
    }

    // Scale offset and draw dimensions to output size
    const ratio = outputSize / SIZE;
    const finalW = drawW * ratio;
    const finalH = drawH * ratio;
    const finalX = (outputSize - finalW) / 2 + offset.x * ratio;
    const finalY = (outputSize - finalH) / 2 + offset.y * ratio;

    ctx.drawImage(img, finalX, finalY, finalW, finalH);

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.92,
    );
  }, [imgSize, scale, offset, onConfirm]);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-background rounded-2xl p-5 space-y-4 shadow-xl animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{t.photoCrop.title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop circle */}
        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-full border-4 border-primary/20 bg-muted cursor-grab active:cursor-grabbing touch-none"
            style={{ width: SIZE, height: SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imageUrl && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                }}
                draggable={false}
                onLoad={handleImageLoad}
              />
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-primary"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {t.photoCrop.hint}
        </p>

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onCancel}
          >
            {t.photoCrop.cancel}
          </Button>
          <Button className="flex-1 rounded-xl" onClick={handleConfirm}>
            {t.photoCrop.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
