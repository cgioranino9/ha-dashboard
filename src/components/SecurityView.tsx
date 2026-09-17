"use client";

import { HeroCameraCard } from "@/components/HeroCameraCard";
import type { DashboardEntity } from "@/lib/types";

export function SecurityView({ cameras }: { cameras: DashboardEntity[] }) {
  if (cameras.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/5 bg-neutral-900/60 p-10 text-center text-neutral-600">
        No cameras found yet. Cameras added in Home Assistant will show up here automatically.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
      {cameras.map((camera) => (
        <HeroCameraCard key={camera.entityId} camera={camera} />
      ))}
    </div>
  );
}
