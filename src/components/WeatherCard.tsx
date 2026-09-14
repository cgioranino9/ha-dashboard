"use client";

import { Wind, Droplets, Sun as UvIcon, type LucideIcon } from "lucide-react";
import type { DashboardEntity } from "@/lib/types";
import { getWeatherIcon } from "@/lib/entityDisplay";

function ConditionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={40} strokeWidth={1.5} className="text-amber-400" />;
}

export function WeatherCard({ weather }: { weather: DashboardEntity }) {
  const Icon = getWeatherIcon(weather.state);
  const temp = weather.attributes.temperature as number | undefined;
  const tempUnit = (weather.attributes.temperature_unit as string) ?? "°";
  const humidity = weather.attributes.humidity as number | undefined;
  const windSpeed = weather.attributes.wind_speed as number | undefined;
  const windUnit = (weather.attributes.wind_speed_unit as string) ?? "";
  const uvIndex = weather.attributes.uv_index as number | undefined;
  const now = new Date();

  return (
    <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-5 w-full sm:w-72 shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">
            {now.toLocaleDateString([], { month: "short", day: "numeric", weekday: "long" })}
          </div>
          {temp !== undefined && (
            <div className="text-3xl font-semibold mt-1">
              {Math.round(temp)}°{tempUnit.replace("°", "")}
            </div>
          )}
          <div className="text-sm text-neutral-500 capitalize">{weather.state}</div>
        </div>
        <ConditionIcon icon={Icon} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
        {windSpeed !== undefined && (
          <div className="flex flex-col items-center gap-1">
            <Wind size={16} className="text-neutral-500" />
            <span className="text-xs text-neutral-400">
              {Math.round(windSpeed)} {windUnit}
            </span>
          </div>
        )}
        {uvIndex !== undefined && (
          <div className="flex flex-col items-center gap-1">
            <UvIcon size={16} className="text-neutral-500" />
            <span className="text-xs text-neutral-400">UV {Math.round(uvIndex)}</span>
          </div>
        )}
        {humidity !== undefined && (
          <div className="flex flex-col items-center gap-1">
            <Droplets size={16} className="text-neutral-500" />
            <span className="text-xs text-neutral-400">{Math.round(humidity)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
