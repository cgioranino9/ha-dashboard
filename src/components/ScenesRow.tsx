"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Sparkles } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";

const PALETTE = [
  "bg-rose-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-cyan-500",
];

export function ScenesRow({ scenes }: { scenes: DashboardEntity[] }) {
  const [activating, setActivating] = useState<string | null>(null);

  const activate = (entityId: string) => async () => {
    setActivating(entityId);
    try {
      await callService("scene", "turn_on", entityId);
    } catch (err) {
      console.error(err);
    } finally {
      setActivating(null);
      mutate("/api/dashboard");
    }
  };

  return (
    <div className="mb-6">
      <div className="text-sm font-medium text-neutral-400 mb-3 px-1">Scenes</div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {scenes.map((scene, i) => (
          <button
            key={scene.entityId}
            onClick={activate(scene.entityId)}
            disabled={activating === scene.entityId}
            className="flex flex-col items-center gap-2 shrink-0 w-16"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${
                PALETTE[i % PALETTE.length]
              } ${activating === scene.entityId ? "opacity-60" : ""}`}
            >
              <Sparkles size={22} strokeWidth={1.75} />
            </div>
            <span className="text-xs text-neutral-400 text-center leading-tight truncate w-full">
              {scene.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
