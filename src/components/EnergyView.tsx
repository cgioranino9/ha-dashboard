"use client";

import { Zap } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";

const PALETTE = ["bg-orange-500", "bg-pink-500", "bg-violet-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500"];

const KNOWN_SUFFIXES = [
  "Today's consumption",
  "This month's consumption",
  "Total consumption",
  "Current consumption",
];

function deviceLabel(name: string): string {
  for (const suffix of KNOWN_SUFFIXES) {
    if (name.endsWith(suffix)) return name.slice(0, -suffix.length).trim();
  }
  return name;
}

export function EnergyView({ entities }: { entities: DashboardEntity[] }) {
  const energySensors = entities.filter(
    (e) =>
      e.domain === "sensor" &&
      (e.attributes.device_class === "energy" || e.attributes.device_class === "power")
  );
  const todayEntries = energySensors.filter((e) => e.name.toLowerCase().includes("today"));
  const maxVal = Math.max(...todayEntries.map((e) => parseFloat(e.state) || 0), 0.0001);

  if (energySensors.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/5 bg-neutral-900/60 p-10 text-center text-neutral-600">
        No energy sensors found yet. Devices that report power or energy usage will show up here
        automatically.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Energy Usage</h2>
        {todayEntries.length > 0 ? (
          <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-6">
            <div className="flex items-end gap-4 h-40">
              {todayEntries.map((e, i) => {
                const val = parseFloat(e.state) || 0;
                const heightPct = Math.max(4, (val / maxVal) * 100);
                return (
                  <div
                    key={e.entityId}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-xs text-neutral-400 tabular-nums">
                      {val} {e.attributes.unit_of_measurement as string}
                    </span>
                    <div
                      className={`w-full rounded-t-lg ${PALETTE[i % PALETTE.length]} transition-all`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-xs text-neutral-500 text-center truncate w-full">
                      {deviceLabel(e.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-neutral-600 text-sm">No daily consumption sensors found.</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">All Energy &amp; Power Sensors</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {energySensors.map((e, i) => (
            <div
              key={e.entityId}
              className="rounded-2xl border border-white/5 bg-neutral-900 p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                  PALETTE[i % PALETTE.length]
                }`}
              >
                <Zap size={18} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{e.name}</div>
                <div className="text-xs text-neutral-500">
                  {e.state} {e.attributes.unit_of_measurement as string}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
