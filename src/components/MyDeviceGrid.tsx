"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Grid2x2, type LucideIcon } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";
import {
  getEntityIcon,
  isEntityActive,
  getDomainAccent,
  formatSince,
} from "@/lib/entityDisplay";

function TileIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={20} strokeWidth={1.75} />;
}

function primaryAction(entity: DashboardEntity): [string, string] {
  const active = isEntityActive(entity);
  switch (entity.domain) {
    case "climate":
      return [active ? "turn_off" : "turn_on", entity.domain];
    case "media_player":
      return ["media_play_pause", entity.domain];
    default:
      return [active ? "turn_off" : "turn_on", entity.domain];
  }
}

function DeviceTile({ entity }: { entity: DashboardEntity }) {
  const [pending, setPending] = useState(false);
  const active = isEntityActive(entity);
  const Icon = getEntityIcon(entity);
  const accent = getDomainAccent(entity.domain);

  const toggle = async () => {
    const [service, domain] = primaryAction(entity);
    setPending(true);
    try {
      await callService(domain, service, entity.entityId);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
      mutate("/api/dashboard");
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded-2xl p-4 flex flex-col justify-between h-28 text-left transition-colors ${
        active ? `bg-gradient-to-br ${accent.gradient} text-white` : "bg-neutral-900 text-neutral-300"
      } ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between">
        {entity.domain === "switch" ? (
          <span className="text-[10px] font-bold tracking-wide">{active ? "ON" : "OFF"}</span>
        ) : (
          <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">
            {active ? "On" : "Off"}
          </span>
        )}
        <div
          className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${
            active ? "bg-white justify-end" : "bg-white/10 justify-start"
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${active ? accent.solid : "bg-neutral-400"}`} />
        </div>
      </div>
      <div>
        {entity.domain !== "switch" && <TileIcon icon={Icon} />}
        <div className="text-sm font-medium mt-1 truncate">{entity.name}</div>
        <div className={`text-[10px] ${active ? "text-white/70" : "text-neutral-600"}`}>
          {formatSince(entity.lastChanged)}
        </div>
      </div>
    </button>
  );
}

export function MyDeviceGrid({ entities }: { entities: DashboardEntity[] }) {
  if (entities.length === 0) {
    return (
      <div className="text-sm text-neutral-600">
        Pin some cards to Favorites to see them here.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-400">My Device</h3>
        <Grid2x2 size={16} className="text-neutral-600" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {entities.slice(0, 4).map((entity) => (
          <DeviceTile key={entity.entityId} entity={entity} />
        ))}
      </div>
    </div>
  );
}
