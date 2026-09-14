"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Minus, Plus, Play, Pause, ArrowUp, ArrowDown, Square, Lock, Unlock } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";
import { getEntityIcon, isEntityActive, formatEntityValue } from "@/lib/entityDisplay";
import { IconBadge } from "@/components/EntityCard";

function refresh() {
  mutate("/api/dashboard");
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

function TempRing({ pct, size = 220 }: { pct: number; size?: number }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="white"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 200ms ease" }}
      />
    </svg>
  );
}

function PanelHeader({ entity }: { entity: DashboardEntity }) {
  const Icon = getEntityIcon(entity);
  const active = isEntityActive(entity);
  return (
    <div className="flex items-center gap-3 mb-6">
      <IconBadge icon={Icon} active={active} />
      <div>
        <div className="text-xl font-semibold">{entity.name}</div>
        <div className="text-sm text-neutral-500">{formatEntityValue(entity)}</div>
      </div>
    </div>
  );
}

export function FocusPanel({ entity }: { entity: DashboardEntity | null }) {
  if (!entity) {
    return (
      <div className="rounded-[28px] border border-white/5 bg-neutral-900/60 h-full min-h-[300px] flex items-center justify-center text-center px-8">
        <p className="text-neutral-600">Tap any card to see more controls here.</p>
      </div>
    );
  }

  switch (entity.domain) {
    case "climate":
      return <ClimateFocus entity={entity} />;
    case "light":
      return <LightFocus entity={entity} />;
    case "cover":
      return <CoverFocus entity={entity} />;
    case "media_player":
      return <MediaFocus entity={entity} />;
    case "lock":
      return <LockFocus entity={entity} />;
    case "switch":
    case "fan":
      return <ToggleFocus entity={entity} />;
    default:
      return <ReadOnlyFocus entity={entity} />;
  }
}

function shell(children: React.ReactNode) {
  return (
    <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-6 h-full min-h-[300px] flex flex-col">
      {children}
    </div>
  );
}

function ClimateFocus({ entity }: { entity: DashboardEntity }) {
  const [pending, setPending] = useState(false);
  const current = entity.attributes.current_temperature as number | undefined;
  const target = entity.attributes.temperature as number | undefined;
  const min = (entity.attributes.min_temp as number | undefined) ?? 16;
  const max = (entity.attributes.max_temp as number | undefined) ?? 30;
  const modes = (entity.attributes.hvac_modes as string[] | undefined) ?? [];
  const pct = target !== undefined ? Math.min(1, Math.max(0, (target - min) / (max - min))) : 0;

  const adjust = (delta: number) => async () => {
    if (target === undefined) return;
    setPending(true);
    await run(async () => {
      await callService("climate", "set_temperature", entity.entityId, {
        temperature: Math.round((target + delta) * 2) / 2,
      });
    });
    setPending(false);
  };

  const setMode = (mode: string) => async () => {
    setPending(true);
    await run(async () => {
      await callService("climate", "set_hvac_mode", entity.entityId, { hvac_mode: mode });
    });
    setPending(false);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />
      {target !== undefined ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <TempRing pct={pct} />
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-semibold tabular-nums">{target}°</span>
              {current !== undefined && (
                <span className="text-sm text-neutral-500">now {current}°</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={adjust(-0.5)}
              disabled={pending}
              className="rounded-full bg-white/5 hover:bg-white/10 p-4"
            >
              <Minus size={22} />
            </button>
            <button
              onClick={adjust(0.5)}
              disabled={pending}
              className="rounded-full bg-white/5 hover:bg-white/10 p-4"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-600">
          No target temperature reported.
        </div>
      )}
      {modes.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap mt-4">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={setMode(mode)}
              disabled={pending}
              className={`rounded-full px-4 py-2 text-sm capitalize ${
                entity.state === mode
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function LightFocus({ entity }: { entity: DashboardEntity }) {
  const active = isEntityActive(entity);
  const [pending, setPending] = useState(false);
  const brightness = entity.attributes.brightness as number | undefined;
  const serverPct = brightness !== undefined ? Math.round((brightness / 255) * 100) : 0;
  const [dragPct, setDragPct] = useState<number | null>(null);
  const localPct = dragPct ?? serverPct;

  const toggle = async () => {
    setPending(true);
    await run(async () => {
      await callService("light", active ? "turn_off" : "turn_on", entity.entityId);
    });
    setPending(false);
  };

  const commitBrightness = async () => {
    await run(async () => {
      await callService("light", "turn_on", entity.entityId, { brightness_pct: localPct });
    });
    setDragPct(null);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <button
          onClick={toggle}
          disabled={pending}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-lg font-medium transition-colors ${
            active ? "bg-blue-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
          }`}
        >
          {active ? "On" : "Off"}
        </button>
        {brightness !== undefined && active && (
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-sm text-neutral-500 mb-2">
              <span>Brightness</span>
              <span>{localPct}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={localPct}
              onChange={(e) => setDragPct(Number(e.target.value))}
              onMouseUp={commitBrightness}
              onTouchEnd={commitBrightness}
              className="w-full accent-blue-500"
            />
          </div>
        )}
      </div>
    </>
  );
}

function ToggleFocus({ entity }: { entity: DashboardEntity }) {
  const active = isEntityActive(entity);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    setPending(true);
    await run(async () => {
      await callService(entity.domain, active ? "turn_off" : "turn_on", entity.entityId);
    });
    setPending(false);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={toggle}
          disabled={pending}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-lg font-medium transition-colors ${
            active ? "bg-blue-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
          }`}
        >
          {active ? "On" : "Off"}
        </button>
      </div>
    </>
  );
}

function LockFocus({ entity }: { entity: DashboardEntity }) {
  const isLocked = entity.state === "locked";
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    setPending(true);
    await run(async () => {
      await callService("lock", isLocked ? "unlock" : "lock", entity.entityId);
    });
    setPending(false);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={toggle}
          disabled={pending}
          className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 text-lg font-medium transition-colors ${
            !isLocked ? "bg-red-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
          }`}
        >
          {isLocked ? <Lock size={28} /> : <Unlock size={28} />}
          {isLocked ? "Locked" : "Unlocked"}
        </button>
      </div>
    </>
  );
}

function CoverFocus({ entity }: { entity: DashboardEntity }) {
  const [pending, setPending] = useState<string | null>(null);

  const act = (service: string) => async () => {
    setPending(service);
    await run(async () => {
      await callService("cover", service, entity.entityId);
    });
    setPending(null);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />
      <div className="flex-1 flex items-center justify-center gap-4">
        <button
          onClick={act("open_cover")}
          disabled={!!pending}
          className="rounded-full bg-white/5 hover:bg-white/10 p-6"
        >
          <ArrowUp size={28} />
        </button>
        <button
          onClick={act("stop_cover")}
          disabled={!!pending}
          className="rounded-full bg-white/5 hover:bg-white/10 p-6"
        >
          <Square size={24} />
        </button>
        <button
          onClick={act("close_cover")}
          disabled={!!pending}
          className="rounded-full bg-white/5 hover:bg-white/10 p-6"
        >
          <ArrowDown size={28} />
        </button>
      </div>
    </>
  );
}

function MediaFocus({ entity }: { entity: DashboardEntity }) {
  const active = entity.state === "playing";
  const [pending, setPending] = useState(false);
  const title = entity.attributes.media_title as string | undefined;
  const artist = entity.attributes.media_artist as string | undefined;

  const toggle = async () => {
    setPending(true);
    await run(async () => {
      await callService("media_player", "media_play_pause", entity.entityId);
    });
    setPending(false);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <div className="font-medium">{title ?? "Nothing playing"}</div>
          {artist && <div className="text-sm text-neutral-500">{artist}</div>}
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
            active ? "bg-blue-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
          }`}
        >
          {active ? <Pause size={28} /> : <Play size={28} />}
        </button>
      </div>
    </>
  );
}

function ReadOnlyFocus({ entity }: { entity: DashboardEntity }) {
  return shell(
    <>
      <PanelHeader entity={entity} />
      <div className="flex-1 flex items-center justify-center">
        <span className="text-4xl font-semibold">{formatEntityValue(entity)}</span>
      </div>
    </>
  );
}
