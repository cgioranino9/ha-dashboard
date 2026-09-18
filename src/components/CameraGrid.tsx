"use client";

import { useState, useEffect } from "react";
import { X, Video, Expand } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { useCameraFeed } from "@/lib/useCameraFeed";

function CameraTile({ camera, onOpen }: { camera: DashboardEntity; onOpen: () => void }) {
  const src = useCameraFeed(camera.entityId);

  return (
    <button
      onClick={onOpen}
      className="relative rounded-2xl overflow-hidden h-28 w-full bg-neutral-950 border border-white/5 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={camera.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <Expand
        size={14}
        className="absolute top-2 right-2 text-white/0 group-hover:text-white/80 transition-colors"
      />
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-white">
        <Video size={12} className="shrink-0" />
        <span className="text-xs font-medium truncate">{camera.name}</span>
      </div>
    </button>
  );
}

function CameraLightbox({ camera, onClose }: { camera: DashboardEntity; onClose: () => void }) {
  const src = useCameraFeed(camera.entityId, 5000);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 sm:p-10"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={camera.name} className="w-full h-auto rounded-2xl" />
        <div className="absolute top-4 left-4 flex items-center gap-2 text-white font-medium bg-black/50 px-3 py-1.5 rounded-full text-sm">
          <Video size={14} />
          {camera.name}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export function CameraGrid({ cameras }: { cameras: DashboardEntity[] }) {
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const fullscreenCamera = cameras.find((c) => c.entityId === fullscreenId) ?? null;

  if (cameras.length === 0) return null;

  if (cameras.length === 1) {
    return (
      <>
        <button className="block w-full text-left" onClick={() => setFullscreenId(cameras[0].entityId)}>
          <div className="pointer-events-none">
            <CameraTileLarge camera={cameras[0]} />
          </div>
        </button>
        {fullscreenCamera && (
          <CameraLightbox camera={fullscreenCamera} onClose={() => setFullscreenId(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-3">
        <div className="grid grid-cols-2 gap-3">
          {cameras.slice(0, 4).map((camera) => (
            <CameraTile
              key={camera.entityId}
              camera={camera}
              onOpen={() => setFullscreenId(camera.entityId)}
            />
          ))}
        </div>
      </div>
      {fullscreenCamera && (
        <CameraLightbox camera={fullscreenCamera} onClose={() => setFullscreenId(null)} />
      )}
    </>
  );
}

function CameraTileLarge({ camera }: { camera: DashboardEntity }) {
  const src = useCameraFeed(camera.entityId);
  return (
    <div className="relative rounded-[28px] overflow-hidden h-56 bg-neutral-900 border border-white/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={camera.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Video size={18} />
          <span className="font-medium">{camera.name}</span>
        </div>
        <span className="text-xs text-white/70 capitalize">{camera.state}</span>
      </div>
    </div>
  );
}
