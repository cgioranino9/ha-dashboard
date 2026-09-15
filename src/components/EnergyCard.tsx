"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";

const PALETTE = ["bg-orange-500", "bg-pink-500", "bg-violet-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500"];

const SUFFIXES: Record<"today" | "month", string> = {
  today: "Today's consumption",
  month: "This month's consumption",
};

function deviceLabel(name: string, suffix: string): string {
  if (name.endsWith(suffix)) return name.slice(0, -suffix.length).trim();
  return name;
}

export function EnergyCard({ entities }: { entities: DashboardEntity[] }) {
  const [period, setPeriod] = useState<"today" | "month">("today");
  const suffix = SUFFIXES[period];

  const entries = entities.filter(
    (e) => e.domain === "sensor" && e.attributes.device_class === "energy" && e.name.endsWith(suffix)
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-6 text-neutral-600 text-sm">
        No energy sensors found yet.
      </div>
    );
  }

  const values = entries.map((e) => parseFloat(e.state) || 0);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const maxVal = Math.max(...values, 0.0001);

  return (
    <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Energy <span className="text-amber-400">Saving</span>
        </h2>
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
          {(["today", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                period === p ? "bg-white text-neutral-900" : "text-neutral-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3 h-32 mb-5">
        {entries.map((e, i) => {
          const val = parseFloat(e.state) || 0;
          const heightPct = Math.max(4, (val / maxVal) * 100);
          return (
            <div key={e.entityId} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] text-neutral-500 tabular-nums">{val}</span>
              <div
                className={`w-full rounded-t-lg ${PALETTE[i % PALETTE.length]} transition-all`}
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[10px] text-neutral-500 truncate w-full text-center">
                {deviceLabel(e.name, suffix)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {entries.map((e, i) => {
          const val = parseFloat(e.state) || 0;
          const pct = Math.round((val / total) * 100);
          return (
            <div key={e.entityId} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${
                  PALETTE[i % PALETTE.length]
                }`}
              >
                <Zap size={16} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-neutral-300 truncate">
                  {deviceLabel(e.name, suffix)} ({val} {e.attributes.unit_of_measurement as string})
                </div>
                <div className="h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${PALETTE[i % PALETTE.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-neutral-500 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
