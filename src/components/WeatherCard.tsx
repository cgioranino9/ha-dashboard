"use client";

import { Wind, Droplets, Sun as UvIcon, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import type { DashboardEntity, ForecastDay } from "@/lib/types";
import { getWeatherIcon } from "@/lib/entityDisplay";

function ConditionIcon({ icon: Icon, size = 40 }: { icon: LucideIcon; size?: number }) {
  return <Icon size={size} strokeWidth={1.5} className="text-amber-400" />;
}

function formatTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function WeatherCard({
  weather,
  forecast,
  sun,
}: {
  weather: DashboardEntity;
  forecast?: ForecastDay[] | null;
  sun?: DashboardEntity | null;
}) {
  const Icon = getWeatherIcon(weather.state);
  const temp = weather.attributes.temperature as number | undefined;
  const tempUnit = (weather.attributes.temperature_unit as string) ?? "°";
  const humidity = weather.attributes.humidity as number | undefined;
  const windSpeed = weather.attributes.wind_speed as number | undefined;
  const windUnit = (weather.attributes.wind_speed_unit as string) ?? "";
  const uvIndex = weather.attributes.uv_index as number | undefined;
  const now = new Date();

  const sunrise = formatTime(sun?.attributes.next_rising as string | undefined);
  const sunset = formatTime(sun?.attributes.next_setting as string | undefined);

  return (
    <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-5 w-full">
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

      {forecast && forecast.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
          {forecast.map((day) => {
            const DayIcon = getWeatherIcon(day.condition);
            const date = new Date(day.datetime);
            const label = Number.isNaN(date.getTime())
              ? day.datetime
              : date.toLocaleDateString([], { weekday: "long" });
            return (
              <div key={day.datetime} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-neutral-400">
                  <ConditionIcon icon={DayIcon} size={16} />
                  <span>{label}</span>
                </div>
                <div className="tabular-nums">
                  {day.temperature !== null && <span className="font-medium">{Math.round(day.temperature)}°</span>}
                  {day.templow !== null && (
                    <span className="text-neutral-500"> / {Math.round(day.templow)}°</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(sunrise || sunset) && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
          {sunset && (
            <div className="flex items-center gap-2 text-neutral-400">
              <Sunset size={16} className="text-orange-400" />
              <span>
                Sunset <span className="text-neutral-200">{sunset}</span>
              </span>
            </div>
          )}
          {sunrise && (
            <div className="flex items-center gap-2 text-neutral-400">
              <Sunrise size={16} className="text-amber-300" />
              <span>
                Sunrise <span className="text-neutral-200">{sunrise}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
