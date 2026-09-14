"use client";

import { Eye } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";

export function SettingsView({
  hiddenEntities,
  onUnhide,
}: {
  hiddenEntities: DashboardEntity[];
  onUnhide: (entityId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold mb-1">Hidden Cards</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Cards you&apos;ve hidden from room views. Tap the eye to bring one back.
        </p>
        {hiddenEntities.length === 0 ? (
          <p className="text-neutral-600 text-sm">Nothing is hidden right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {hiddenEntities.map((entity) => (
              <div
                key={entity.entityId}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-neutral-900 p-3"
              >
                <span className="text-sm">{entity.name}</span>
                <button
                  onClick={() => onUnhide(entity.entityId)}
                  className="rounded-full bg-white/5 hover:bg-white/10 p-2 text-neutral-300"
                  aria-label="Show card"
                >
                  <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
