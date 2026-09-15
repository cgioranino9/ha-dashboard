"use client";

import { useState, useEffect } from "react";
import { Video } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";

export function HeroCameraCard({ camera }: { camera: DashboardEntity }) {
  const objectId = camera.entityId.split(".")[1];
  const [src, setSrc] = useState(`/api/camera/${objectId}`);

  useEffect(() => {
    const id = setInterval(() => {
      setSrc(`/api/camera/${objectId}?t=${Date.now()}`);
    }, 10000);
    return () => clearInterval(id);
  }, [objectId]);

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
