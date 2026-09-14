"use client";

import { useState } from "react";
import { mutate } from "swr";
import {
  Minus,
  Plus,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Square,
  Lock,
  Unlock,
  Flame,
  Snowflake,
  Repeat,
  Power,
  type LucideIcon,
} from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";
import { getEntityIcon, isEntityActive, formatEntityValue, getDomainAccent } from "@/lib/entityDisplay";
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

function TempRing({ pct, size = 220, gapDeg = 90 }: { pct: number; size?: number; gapDeg?: number }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const trackLen = ((360 - gapDeg) / 360) * c;
  const clampedPct = Math.max(0, Math.min(1, pct));
  const valueLen = clampedPct * trackLen;
  const rotate = 90 + gapDeg / 2;
  const theta = (valueLen / c) * 2 * Math.PI;
  const handleX = cx + r * Math.cos(theta);
  const handleY = cy + r * Math.sin(theta);
  return (
    <svg width={size} height={size} style={{ transform: `rotate(${rotate}deg)` }}>
      <defs>
        <linearGradient id="climate-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${trackLen} ${c - trackLen}`}
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="url(#climate-ring-gradient)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${valueLen} ${c - valueLen}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 200ms ease" }}
      />
      {clampedPct > 0 && (
        <circle cx={handleX} cy={handleY} r={stroke / 2 + 3} fill="white" stroke="#ea580c" strokeWidth={3} />
      )}
    </svg>
  );
}

function ModeButton({
  icon: Icon,
  active,
  disabled,
  onClick,
  label,
  activeClass,
}: {
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex-1 rounded-full py-3 flex items-center justify-center transition-colors ${
        active ? `${activeClass} text-white` : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );
}

const HVAC_MODE_ICONS: Record<string, LucideIcon> = {
  heat: Flame,
  cool: Snowflake,
  heat_cool: Repeat,
};

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
  const currentHumidity = entity.attributes.current_humidity as number | undefined;
  const hvacAction = entity.attributes.hvac_action as string | undefined;
  const min = (entity.attributes.min_temp as number | undefined) ?? 60;
  const max = (entity.attributes.max_temp as number | undefined) ?? 85;
  const unit = min > 40 ? "°F" : "°C";
  const step = (entity.attributes.target_temp_step as number | undefined) ?? 1;
  const allModes = (entity.attributes.hvac_modes as string[] | undefined) ?? [];
  const isOff = entity.state === "off";
  const isRange = entity.state === "heat_cool";
  const target = entity.attributes.temperature as number | undefined;
  const targetLow = entity.attributes.target_temp_low as number | undefined;
  const targetHigh = entity.attributes.target_temp_high as number | undefined;
  const fanModes = entity.attributes.fan_modes as string[] | undefined;
  const fanMode = entity.attributes.fan_mode as string | undefined;
  const presetModes = entity.attributes.preset_modes as string[] | undefined;
  const presetMode = entity.attributes.preset_mode as string | undefined;

  const pct =
    target !== undefined ? Math.min(1, Math.max(0, (target - min) / (max - min))) : 0;

  const setMode = (mode: string) => async () => {
    setPending(true);
    await run(async () => {
      await callService("climate", "set_hvac_mode", entity.entityId, { hvac_mode: mode });
    });
    setPending(false);
  };

  const togglePower = async () => {
    setPending(true);
    await run(async () => {
      if (isOff) {
        await callService("climate", "turn_on", entity.entityId);
      } else {
        await callService("climate", "turn_off", entity.entityId);
      }
    });
    setPending(false);
  };

  const adjustSingle = (delta: number) => async () => {
    if (target === undefined) return;
    setPending(true);
    await run(async () => {
      await callService("climate", "set_temperature", entity.entityId, {
        temperature: target + delta,
      });
    });
    setPending(false);
  };

  const adjustRange = (which: "low" | "high", delta: number) => async () => {
    if (targetLow === undefined || targetHigh === undefined) return;
    setPending(true);
    await run(async () => {
      await callService("climate", "set_temperature", entity.entityId, {
        target_temp_low: which === "low" ? targetLow + delta : targetLow,
        target_temp_high: which === "high" ? targetHigh + delta : targetHigh,
      });
    });
    setPending(false);
  };

  const setFanMode = (mode: string) => async () => {
    setPending(true);
    await run(async () => {
      await callService("climate", "set_fan_mode", entity.entityId, { fan_mode: mode });
    });
    setPending(false);
  };

  const setPreset = (preset: string) => async () => {
    setPending(true);
    await run(async () => {
      await callService("climate", "set_preset_mode", entity.entityId, { preset_mode: preset });
    });
    setPending(false);
  };

  return shell(
    <>
      <PanelHeader entity={entity} />

      {isOff && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          {current !== undefined && (
            <span className="text-5xl font-semibold tabular-nums">
              {Math.round(current)}
              {unit}
            </span>
          )}
          <span className="text-neutral-500">Off{currentHumidity !== undefined ? ` · ${currentHumidity}% humidity` : ""}</span>
        </div>
      )}

      {!isOff && !isRange && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <TempRing pct={pct} />
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-medium tracking-wide text-orange-300 uppercase">
                {hvacAction ?? entity.state}
              </span>
              <span className="text-4xl font-semibold tabular-nums">
                {target}
                {unit}
              </span>
              {current !== undefined && (
                <span className="text-sm text-neutral-500">now {Math.round(current)}°</span>
              )}
            </div>
            <span className="absolute left-2 bottom-2 text-xs text-neutral-600">
              {min}°
            </span>
            <span className="absolute right-2 bottom-2 text-xs text-neutral-600">
              {max}°
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={adjustSingle(-step)}
              disabled={pending || target === undefined}
              className="rounded-full bg-white/5 hover:bg-white/10 p-4"
            >
              <Minus size={22} />
            </button>
            <button
              onClick={adjustSingle(step)}
              disabled={pending || target === undefined}
              className="rounded-full bg-white/5 hover:bg-white/10 p-4"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      )}

      {!isOff && isRange && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <span className="text-xs font-medium tracking-wide text-orange-300 uppercase">
            {hvacAction ?? entity.state}
          </span>
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-neutral-500">Low</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={adjustRange("low", -step)}
                  disabled={pending || targetLow === undefined}
                  className="rounded-full bg-white/5 hover:bg-white/10 p-2.5"
                >
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-semibold tabular-nums w-14 text-center">
                  {targetLow ?? "–"}°
                </span>
                <button
                  onClick={adjustRange("low", step)}
                  disabled={pending || targetLow === undefined}
                  className="rounded-full bg-white/5 hover:bg-white/10 p-2.5"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-neutral-500">High</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={adjustRange("high", -step)}
                  disabled={pending || targetHigh === undefined}
                  className="rounded-full bg-white/5 hover:bg-white/10 p-2.5"
                >
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-semibold tabular-nums w-14 text-center">
                  {targetHigh ?? "–"}°
                </span>
                <button
                  onClick={adjustRange("high", step)}
                  disabled={pending || targetHigh === undefined}
                  className="rounded-full bg-white/5 hover:bg-white/10 p-2.5"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          {current !== undefined && (
            <span className="text-sm text-neutral-500">now {Math.round(current)}°</span>
          )}
        </div>
      )}

      {allModes.length > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 mt-4">
          {allModes.map((mode) =>
            mode === "off" ? null : (
              <ModeButton
                key={mode}
                icon={HVAC_MODE_ICONS[mode] ?? Repeat}
                active={entity.state === mode}
                disabled={pending}
                onClick={setMode(mode)}
                label={mode.replace("_", " ")}
                activeClass={getDomainAccent("climate").solid}
              />
            )
          )}
        </div>
      )}

      {fanModes && fanModes.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-xs text-neutral-600">Fan</span>
          {fanModes.map((mode) => (
            <button
              key={mode}
              onClick={setFanMode(mode)}
              disabled={pending}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                fanMode === mode
                  ? getDomainAccent("climate").soft
                  : "bg-white/5 text-neutral-500 hover:bg-white/10"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {presetModes && presetModes.length > 0 && (
        <div className="flex items-center gap-2 justify-center flex-wrap mt-3">
          {presetModes.map((preset) => (
            <button
              key={preset}
              onClick={setPreset(preset)}
              disabled={pending}
              className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                presetMode?.toLowerCase() === preset.toLowerCase()
                  ? "bg-amber-400/20 text-amber-300"
                  : "bg-white/5 text-neutral-500 hover:bg-white/10"
              }`}
            >
              {preset.replace("_", " ")}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-5">
        <button
          onClick={togglePower}
          disabled={pending}
          className={`rounded-full p-4 transition-colors ${
            isOff ? "bg-white text-neutral-900" : "bg-white/5 text-neutral-400 hover:bg-white/10"
          }`}
          aria-label={isOff ? "Turn on" : "Turn off"}
        >
          <Power size={22} />
        </button>
      </div>
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
            active ? `${getDomainAccent("light").solid} text-white` : "bg-white/5 text-neutral-400 hover:bg-white/10"
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
              className="w-full accent-amber-500"
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
            active
              ? `${getDomainAccent(entity.domain).solid} text-white`
              : "bg-white/5 text-neutral-400 hover:bg-white/10"
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
            active
              ? `${getDomainAccent("media_player").solid} text-white`
              : "bg-white/5 text-neutral-400 hover:bg-white/10"
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
