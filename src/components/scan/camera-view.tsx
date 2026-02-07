"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";

interface CameraViewProps {
  onCapture: (image: Blob) => void;
  onUpload: (file: File) => void;
  isProcessing: boolean;
  className?: string;
}

export function CameraView({
  onCapture,
  onUpload,
  isProcessing,
  className,
}: CameraViewProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraReady(true);
      }
    } catch {
      setHasCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.9,
    );
  }, [onCapture]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload],
  );

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {hasCamera ? (
        <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {/* Scan guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[80%] h-[60%] border-2 border-white/40 rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[3/4] bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Camera className="h-12 w-12" />
          <p className="text-sm font-medium">{t.scan.noCamera}</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <p className="text-sm text-muted-foreground text-center">
        {t.scan.instruction}
      </p>

      <div className="flex gap-3 w-full">
        {hasCamera && (
          <Button
            onClick={capturePhoto}
            disabled={isProcessing || !isCameraReady}
            className="flex-1 h-12 rounded-xl text-base font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.scan.processing}
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                {t.scan.takePhoto}
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={cn("h-12 rounded-xl", !hasCamera && "flex-1")}
          size="lg"
        >
          <Upload className="mr-2 h-5 w-5" />
          {t.scan.uploadImage}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
