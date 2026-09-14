"use client";

import { useState } from "react";
import { mutate } from "swr";
import { ArrowUp, ArrowDown, Square, Minus, Plus, Play, Pause, type LucideIcon } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";
import { getEntityIcon, isEntityActive, formatEntityValue } from "@/lib/entityDisplay";

const DASHBOARD_KEY = "/api/dashboard";

function refresh() {
  mutate(DASHBOARD_KEY);
}

async function run(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.error(err);
  } finally {
    refresh();
  }
}

export function getCardSpan(entity: DashboardEntity): string {
  if (entity.domain === "cover" || entity.domain === "climate") return "col-span-2";
  if (
    (entity.domain === "light" || entity.domain === "switch" || entity.domain === "fan") &&
    isEntityActive(entity)
  ) {
    return "col-span-2";
  }
  if (entity.domain === "media_player" && isEntityActive(entity)) return "col-span-2";
  return "col-span-1";
}

function cardClasses(active: boolean) {
  return active
    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-400/40 shadow-lg shadow-blue-950/40"
    : "bg-neutral-900 text-neutral-200 border-white/5 hover:bg-neutral-800";
}

function selectedRing(selected?: boolean) {
  return selected ? "ring-2 ring-offset-2 ring-offset-neutral-950 ring-blue-400" : "";
}

export function IconBadge({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        active ? "bg-white/20" : "bg-white/5"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} />
    </div>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div
      className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
        on ? "bg-white justify-end" : "bg-neutral-700 justify-start"
      }`}
    >
      <div className={`w-5 h-5 rounded-full ${on ? "bg-blue-600" : "bg-neutral-300"}`} />
    </div>
  );
}

const cardShell = "w-full rounded-[28px] p-5 flex flex-col justify-between min-h-[140px] select-none transition-colors border";

export type EntityCardProps = {
  entity: DashboardEntity;
  onSelect?: (entity: DashboardEntity) => void;
  selected?: boolean;
};

export function EntityCard({ entity, onSelect, selected }: EntityCardProps) {
  switch (entity.domain) {
    case "light":
    case "switch":
    case "fan":
      return <ToggleCard entity={entity} onSelect={onSelect} selected={selected} />;
    case "lock":
      return <LockCard entity={entity} onSelect={onSelect} selected={selected} />;
    case "cover":
      return <CoverCard entity={entity} onSelect={onSelect} selected={selected} />;
    case "climate":
      return <ClimateCard entity={entity} onSelect={onSelect} selected={selected} />;
    case "media_player":
      return <MediaPlayerCard entity={entity} onSelect={onSelect} selected={selected} />;
    default:
      return <ReadOnlyCard entity={entity} onSelect={onSelect} selected={selected} />;
  }
}

function ToggleCard({ entity, onSelect, selected }: EntityCardProps) {
  const active = isEntityActive(entity);
  const Icon = getEntityIcon(entity);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    onSelect?.(entity);
    setPending(true);
    await run(async () => {
      await callService(entity.domain, active ? "turn_off" : "turn_on", entity.entityId);
    });
    setPending(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`${cardShell} text-left ${cardClasses(active)} ${selectedRing(selected)} ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between">
        <IconBadge icon={Icon} active={active} />
        <ToggleSwitch on={active} />
      </div>
      <div>
        <div className="font-medium leading-tight">{entity.name}</div>
        <div className={`text-sm ${active ? "text-white/80" : "text-neutral-500"}`}>
          {formatEntityValue(entity)}
        </div>
      </div>
    </button>
  );
}

function LockCard({ entity, onSelect, selected }: EntityCardProps) {
  const isLocked = entity.state === "locked";
  const Icon = getEntityIcon(entity);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    onSelect?.(entity);
    setPending(true);
    await run(async () => {
      await callService("lock", isLocked ? "unlock" : "lock", entity.entityId);
    });
    setPending(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`${cardShell} text-left ${
        isLocked
          ? "bg-neutral-900 text-neutral-200 border-white/5 hover:bg-neutral-800"
          : "bg-gradient-to-br from-red-600 to-red-500 text-white border-red-400/40 shadow-lg shadow-red-950/40"
      } ${selectedRing(selected)} ${pending ? "opacity-60" : ""}`}
    >
      <IconBadge icon={Icon} active={!isLocked} />
      <div>
        <div className="font-medium leading-tight">{entity.name}</div>
        <div className={`text-sm ${!isLocked ? "text-white/80" : "text-neutral-500"}`}>
          {formatEntityValue(entity)}
        </div>
      </div>
    </button>
  );
}

function CoverCard({ entity, onSelect, selected }: EntityCardProps) {
  const [pending, setPending] = useState<string | null>(null);
  const Icon = getEntityIcon(entity);
  const active = isEntityActive(entity);

  const act = (service: string) => async () => {
    onSelect?.(entity);
    setPending(service);
    await run(async () => {
      await callService("cover", service, entity.entityId);
    });
    setPending(null);
  };

  return (
    <div className={`${cardShell} ${cardClasses(active)} ${selectedRing(selected)}`}>
      <div className="flex items-start justify-between">
        <IconBadge icon={Icon} active={active} />
      </div>
      <div>
        <div className="font-medium leading-tight">{entity.name}</div>
        <div className={`text-sm mb-3 ${active ? "text-white/80" : "text-neutral-500"}`}>
          {formatEntityValue(entity)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={act("open_cover")}
            disabled={!!pending}
            className="flex-1 rounded-xl bg-black/20 hover:bg-black/30 py-2.5 flex items-center justify-center"
          >
            <ArrowUp size={20} />
          </button>
          <button
            onClick={act("stop_cover")}
            disabled={!!pending}
            className="flex-1 rounded-xl bg-black/20 hover:bg-black/30 py-2.5 flex items-center justify-center"
          >
            <Square size={18} />
          </button>
          <button
            onClick={act("close_cover")}
            disabled={!!pending}
            className="flex-1 rounded-xl bg-black/20 hover:bg-black/30 py-2.5 flex items-center justify-center"
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ClimateCard({ entity, onSelect, selected }: EntityCardProps) {
  const [pending, setPending] = useState(false);
  const Icon = getEntityIcon(entity);
  const current = entity.attributes.current_temperature as number | undefined;
  const target = entity.attributes.temperature as number | undefined;
  const active = entity.state !== "off";

  const MIN = 16;
  const MAX = 30;
  const pct = target !== undefined ? Math.min(1, Math.max(0, (target - MIN) / (MAX - MIN))) : 0;

  const adjust = (delta: number) => async () => {
    onSelect?.(entity);
    if (target === undefined) return;
    setPending(true);
    await run(async () => {
      await callService("climate", "set_temperature", entity.entityId, {
        temperature: target + delta,
      });
    });
    setPending(false);
  };

  return (
    <div
      onClick={() => onSelect?.(entity)}
      className={`${cardShell} ${cardClasses(active)} ${selectedRing(selected)} cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconBadge icon={Icon} active={active} />
          <div>
            <div className="font-medium leading-tight">{entity.name}</div>
            <div className={`text-sm ${active ? "text-white/80" : "text-neutral-500"} capitalize`}>
              {entity.state}
              {current !== undefined ? ` · ${current}°` : ""}
            </div>
          </div>
        </div>
        {target !== undefined && (
          <div className="flex items-center gap-3">
            <button
              onClick={adjust(-0.5)}
              disabled={pending}
              className="rounded-full bg-black/20 hover:bg-black/30 p-2.5"
            >
              <Minus size={18} />
            </button>
            <div className="text-2xl font-semibold tabular-nums w-16 text-center">{target}°</div>
            <button
              onClick={adjust(0.5)}
              disabled={pending}
              className="rounded-full bg-black/20 hover:bg-black/30 p-2.5"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
      {target !== undefined && (
        <div className="mt-4 h-1.5 rounded-full bg-black/20 overflow-hidden">
          <div className="h-full rounded-full bg-white/80" style={{ width: `${pct * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function MediaPlayerCard({ entity, onSelect, selected }: EntityCardProps) {
  const active = entity.state === "playing";
  const [pending, setPending] = useState(false);
  const Icon = getEntityIcon(entity);
  const title = entity.attributes.media_title as string | undefined;

  const toggle = async () => {
    onSelect?.(entity);
    setPending(true);
    await run(async () => {
      await callService("media_player", "media_play_pause", entity.entityId);
    });
    setPending(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`${cardShell} text-left ${cardClasses(active)} ${selectedRing(selected)} ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between">
        <IconBadge icon={Icon} active={active} />
        <div className={`rounded-full p-2 ${active ? "bg-white/20" : "bg-white/5"}`}>
          {active ? <Pause size={18} /> : <Play size={18} />}
        </div>
      </div>
      <div>
        <div className="font-medium leading-tight">{entity.name}</div>
        <div className={`text-sm truncate ${active ? "text-white/80" : "text-neutral-500"}`}>
          {title ?? formatEntityValue(entity)}
        </div>
      </div>
    </button>
  );
}

function ReadOnlyCard({ entity, onSelect, selected }: EntityCardProps) {
  const Icon = getEntityIcon(entity);
  const active = isEntityActive(entity);

  return (
    <button
      onClick={() => onSelect?.(entity)}
      className={`${cardShell} min-h-[112px] text-left ${
        active ? cardClasses(true) : "bg-neutral-900/60 text-neutral-400 border-white/5 hover:bg-neutral-900"
      } ${selectedRing(selected)}`}
    >
      <IconBadge icon={Icon} active={active} />
      <div>
        <div className="font-medium leading-tight text-sm">{entity.name}</div>
        <div className={`text-sm ${active ? "text-white/80" : "text-neutral-500"}`}>
          {formatEntityValue(entity)}
        </div>
      </div>
    </button>
  );
}
