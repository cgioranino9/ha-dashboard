"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Play, Pause, SkipBack, SkipForward, Music2 } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { callService } from "@/lib/useDashboard";

export function MediaMiniCard({ player }: { player: DashboardEntity }) {
  const [pending, setPending] = useState(false);
  const active = player.state === "playing";
  const title =
    (player.attributes.media_title as string | undefined) ??
    (player.attributes.app_name as string | undefined) ??
    "Nothing playing";
  const artist = player.attributes.media_artist as string | undefined;
  const position = player.attributes.media_position as number | undefined;
  const duration = player.attributes.media_duration as number | undefined;
  const pct =
    position !== undefined && duration ? Math.min(1, Math.max(0, position / duration)) : 0;

  const run = async (service: string) => {
    setPending(true);
    try {
      await callService("media_player", service, player.entityId);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
      mutate("/api/dashboard");
    }
  };

  const formatTime = (secs: number | undefined) => {
    if (secs === undefined) return "--:--";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shrink-0">
          <Music2 size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-xs text-neutral-500 truncate">{artist ?? player.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => run("media_previous_track")}
            disabled={pending}
            className="rounded-full p-2 text-neutral-400 hover:text-white"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={() => run("media_play_pause")}
            disabled={pending}
            className="rounded-full p-2.5 bg-violet-500 text-white"
          >
            {active ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => run("media_next_track")}
            disabled={pending}
            className="rounded-full p-2 text-neutral-400 hover:text-white"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
      {duration !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
