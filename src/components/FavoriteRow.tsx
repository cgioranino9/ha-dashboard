"use client";

import { useState } from "react";
import { mutate } from "swr";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";
import { getEntityIcon, isEntityActive, formatEntityValue, getDomainAccent } from "@/lib/entityDisplay";
import { IconBadge } from "@/components/EntityCard";

const TOGGLE_DOMAINS = new Set(["light", "switch", "fan"]);

function refresh() {
  mutate("/api/dashboard");
}

export function FavoriteRow({
  entity,
  selected,
  onSelect,
}: {
  entity: DashboardEntity;
  selected: boolean;
  onSelect: () => void;
}) {
  const [pending, setPending] = useState(false);
  const Icon = getEntityIcon(entity);
  const active = isEntityActive(entity);

  const handleClick = async () => {
    onSelect();
    if (!TOGGLE_DOMAINS.has(entity.domain)) return;
    setPending(true);
    try {
      await callService(entity.domain, active ? "turn_off" : "turn_on", entity.entityId);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
      refresh();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors border ${
        selected
          ? `${getDomainAccent(entity.domain).soft} ${getDomainAccent(entity.domain).border}`
          : "bg-neutral-900 border-white/5 hover:bg-neutral-800"
      } ${pending ? "opacity-60" : ""}`}
    >
      <IconBadge icon={Icon} active={active} />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{entity.name}</div>
        <div className="text-xs text-neutral-500 truncate">{formatEntityValue(entity)}</div>
      </div>
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? "bg-emerald-400" : "bg-neutral-700"}`}
      />
    </button>
  );
}
