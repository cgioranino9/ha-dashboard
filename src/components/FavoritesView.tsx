"use client";

import type { DashboardEntity } from "@/lib/types";
import { EntityCard, getCardSpan } from "@/components/EntityCard";

export function FavoritesView({
  entities,
  focusedId,
  onSelect,
}: {
  entities: DashboardEntity[];
  focusedId: string | null;
  onSelect: (entity: DashboardEntity) => void;
}) {
  if (entities.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/5 bg-neutral-900/60 p-10 text-center text-neutral-600">
        No favorites yet. Go to Home, tap the pencil, then the star on any card to pin it here.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
      {entities.map((entity) => (
        <div key={entity.entityId} className={getCardSpan(entity)}>
          <EntityCard
            entity={entity}
            selected={focusedId === entity.entityId}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
