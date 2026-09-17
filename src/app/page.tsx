"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Pencil, Check, Star, Eye, EyeOff } from "lucide-react";
import { useDashboard } from "@/lib/useDashboard";
import { useHiddenEntities } from "@/lib/useHiddenEntities";
import { useFavoriteEntities } from "@/lib/useFavoriteEntities";
import { EntityCard, getCardSpan } from "@/components/EntityCard";
import { ScenesRow } from "@/components/ScenesRow";
import { FocusPanel } from "@/components/FocusPanel";
import { FavoriteRow } from "@/components/FavoriteRow";
import { Sidebar, type DashboardView } from "@/components/Sidebar";
import { FavoritesView } from "@/components/FavoritesView";
import { SettingsView } from "@/components/SettingsView";
import { MyDeviceGrid } from "@/components/MyDeviceGrid";
import { MediaMiniCard } from "@/components/MediaMiniCard";
import { isEntityActive } from "@/lib/entityDisplay";
import type { DashboardEntity } from "@/lib/types";

const Clock = dynamic(() => import("@/components/Clock").then((m) => m.Clock), {
  ssr: false,
});
const WeatherCard = dynamic(
  () => import("@/components/WeatherCard").then((m) => m.WeatherCard),
  { ssr: false }
);
const HeroCameraCard = dynamic(
  () => import("@/components/HeroCameraCard").then((m) => m.HeroCameraCard),
  { ssr: false }
);

const SUMMARY_DOMAINS = new Set([
  "light",
  "switch",
  "fan",
  "climate",
  "media_player",
  "cover",
]);

const VIEW_TITLES: Record<DashboardView, string> = {
  home: "",
  rooms: "Rooms",
  favorites: "Favorites",
  settings: "Settings",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function summarizeActivity(entities: DashboardEntity[]): string {
  const active = entities.filter((e) => SUMMARY_DOMAINS.has(e.domain) && isEntityActive(e));
  if (active.length === 0) return "Everything is off.";
  if (active.length === 1) return `${active[0].name} is on.`;
  if (active.length === 2) return `${active[0].name} and ${active[1].name} are on.`;
  return `${active[0].name}, ${active[1].name}, and ${active.length - 2} more are on.`;
}

export default function Home() {
  const { data, error, isLoading } = useDashboard();
  const { hidden, toggleHidden } = useHiddenEntities();
  const { favorites, toggleFavorite } = useFavoriteEntities();
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [focusedEntityId, setFocusedEntityId] = useState<string | null>(null);
  const [view, setView] = useState<DashboardView>("home");

  const tabs = useMemo(() => {
    if (!data) return [];
    const areaTabs = data.areas.map((a) => ({ id: a.areaId, name: a.name }));
    if (data.unassigned.length > 0) areaTabs.push({ id: "__unassigned", name: "Other" });
    return areaTabs;
  }, [data]);

  const currentAreaId = activeAreaId ?? tabs[0]?.id ?? null;
  const currentAreaName = tabs.find((t) => t.id === currentAreaId)?.name ?? "";

  const allEntities = useMemo(() => {
    if (!data) return [];
    return [...data.areas.flatMap((a) => a.entities), ...data.unassigned];
  }, [data]);

  const currentEntities = useMemo(() => {
    if (!data) return [];
    if (currentAreaId === "__unassigned") return data.unassigned;
    return data.areas.find((a) => a.areaId === currentAreaId)?.entities ?? [];
  }, [data, currentAreaId]);

  const visibleEntities = useMemo(
    () => (editing ? currentEntities : currentEntities.filter((e) => !hidden.has(e.entityId))),
    [currentEntities, editing, hidden]
  );

  const favoriteEntities = useMemo(
    () => allEntities.filter((e) => favorites.has(e.entityId)),
    [allEntities, favorites]
  );

  const hiddenEntities = useMemo(
    () => allEntities.filter((e) => hidden.has(e.entityId)),
    [allEntities, hidden]
  );

  const climateEntity = useMemo(() => allEntities.find((e) => e.domain === "climate"), [allEntities]);
  const cameraEntity = useMemo(() => allEntities.find((e) => e.domain === "camera"), [allEntities]);
  const mediaEntity = useMemo(
    () =>
      allEntities.find((e) => e.domain === "media_player" && e.state === "playing") ??
      allEntities.find((e) => e.domain === "media_player"),
    [allEntities]
  );
  const lightSwitchEntities = useMemo(
    () =>
      allEntities
        .filter((e) => e.domain === "light" || e.domain === "switch")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allEntities]
  );

  const defaultFocusEntity = useMemo(() => {
    if (climateEntity) return climateEntity;
    if (favoriteEntities.length > 0) return favoriteEntities[0];
    return null;
  }, [climateEntity, favoriteEntities]);

  const focusedEntity = useMemo(() => {
    if (focusedEntityId) {
      return allEntities.find((e) => e.entityId === focusedEntityId) ?? defaultFocusEntity;
    }
    return defaultFocusEntity;
  }, [focusedEntityId, allEntities, defaultFocusEntity]);

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Connecting to Home Assistant…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-red-400 px-8 text-center">
        Couldn&apos;t reach the dashboard API. Check HA_URL / HA_TOKEN in .env.local and that
        Home Assistant is reachable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 select-none flex">
      <Sidebar view={view} onChange={setView} />

      <div className="flex-1 min-w-0 px-6 sm:px-8 pt-8 pb-10 max-w-[1780px]">
        <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold">
              {view === "home" ? getGreeting() : VIEW_TITLES[view]}
            </h1>
            <p className="text-neutral-500 mt-1">
              {view === "home" || view === "rooms" ? summarizeActivity(allEntities) : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Clock />
            {view === "rooms" && (
              <button
                onClick={() => setEditing((e) => !e)}
                className={`rounded-full p-3 transition-colors ${
                  editing
                    ? "bg-neutral-100 text-neutral-900"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
                aria-label={editing ? "Done editing" : "Edit visible cards"}
              >
                {editing ? <Check size={20} /> : <Pencil size={20} />}
              </button>
            )}
          </div>
        </header>

        {view === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-6 items-start">
            <div className="flex flex-col gap-6 min-w-0">
              {cameraEntity && <HeroCameraCard camera={cameraEntity} />}
              <ScenesRow scenes={data?.scenes ?? []} />
              <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-4">
                  <Star size={16} />
                  Favorites
                </div>
                {favoriteEntities.length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    Go to Rooms, tap the pencil, then the star on any card to pin it here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {favoriteEntities.map((entity) => (
                      <FavoriteRow
                        key={entity.entityId}
                        entity={entity}
                        selected={focusedEntity?.entityId === entity.entityId}
                        onSelect={() => setFocusedEntityId(entity.entityId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 min-w-0">
              {lightSwitchEntities.length > 0 && (
                <div className="rounded-[28px] border border-white/5 bg-neutral-900 p-6">
                  <h2 className="text-sm font-medium text-neutral-400 mb-4">Lights &amp; Switches</h2>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
                    {lightSwitchEntities.map((entity) => (
                      <div key={entity.entityId} className={getCardSpan(entity)}>
                        <EntityCard
                          entity={entity}
                          selected={focusedEntity?.entityId === entity.entityId}
                          onSelect={(e) => setFocusedEntityId(e.entityId)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mediaEntity && <MediaMiniCard player={mediaEntity} />}
            </div>

            <div className="flex flex-col gap-6 min-w-0">
              {data?.weather && (
                <WeatherCard weather={data.weather} forecast={data.forecast} sun={data.sun} />
              )}
              <FocusPanel entity={climateEntity ?? null} />
              <MyDeviceGrid entities={favoriteEntities} />
            </div>
          </div>
        )}

        {view === "favorites" && (
          <FavoritesView
            entities={favoriteEntities}
            focusedId={focusedEntity?.entityId ?? null}
            onSelect={(e) => setFocusedEntityId(e.entityId)}
          />
        )}

        {view === "settings" && (
          <SettingsView hiddenEntities={hiddenEntities} onUnhide={toggleHidden} />
        )}

        {view === "rooms" && (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_320px] gap-6 items-start">
            <div className="min-w-0">
              <ScenesRow scenes={data?.scenes ?? []} />

              <nav className="flex gap-2 pb-5 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAreaId(tab.id)}
                    className={`whitespace-nowrap rounded-full px-5 py-2.5 text-base font-medium transition-colors ${
                      currentAreaId === tab.id
                        ? "bg-neutral-100 text-neutral-900"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>

              {tabs.length > 0 && (
                <div className="flex items-baseline justify-between mb-4 px-1">
                  <h2 className="text-lg font-semibold">{currentAreaName}</h2>
                  <span className="text-sm text-neutral-500">
                    {currentEntities.length} {currentEntities.length === 1 ? "Device" : "Devices"}
                  </span>
                </div>
              )}

              {editing && (
                <p className="pb-3 px-1 text-sm text-neutral-500">
                  Tap the star to pin a card to Favorites, or the eye to hide it. Tap the
                  checkmark when you&apos;re done.
                </p>
              )}

              {currentEntities.length === 0 ? (
                <div className="text-neutral-500 py-12 text-center">
                  {tabs.length === 0
                    ? "No areas or entities found yet."
                    : "Nothing in this area yet."}
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                  {visibleEntities.map((entity) => {
                    const isHidden = hidden.has(entity.entityId);
                    const isFavorite = favorites.has(entity.entityId);
                    return (
                      <div key={entity.entityId} className={`relative ${getCardSpan(entity)}`}>
                        <div className={editing ? "pointer-events-none" : ""}>
                          <EntityCard
                            entity={entity}
                            selected={focusedEntity?.entityId === entity.entityId}
                            onSelect={(e) => setFocusedEntityId(e.entityId)}
                          />
                        </div>
                        {editing && (
                          <div
                            className={`absolute inset-0 rounded-[28px] flex items-center justify-center gap-3 ${
                              isHidden ? "bg-neutral-950/80" : "bg-black/55"
                            }`}
                          >
                            <button
                              onClick={() => toggleFavorite(entity.entityId)}
                              className={`rounded-full p-3 ${
                                isFavorite
                                  ? "bg-amber-400 text-neutral-900"
                                  : "bg-white/10 text-white"
                              }`}
                              aria-label={isFavorite ? "Unpin from favorites" : "Pin to favorites"}
                            >
                              <Star size={20} fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => toggleHidden(entity.entityId)}
                              className={`rounded-full p-3 ${
                                isHidden
                                  ? "bg-neutral-700 text-neutral-400"
                                  : "bg-white/10 text-white"
                              }`}
                              aria-label={isHidden ? "Show card" : "Hide card"}
                            >
                              {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0 xl:sticky xl:top-8">
              <FocusPanel entity={focusedEntity} />
            </div>

            <aside className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 px-1 h-9">
                <Star size={16} />
                Favorites
              </div>
              {favoriteEntities.length === 0 ? (
                <div className="text-sm text-neutral-600 px-1">
                  Tap the pencil, then the star on any card to pin it here.
                </div>
              ) : (
                favoriteEntities.map((entity) => (
                  <FavoriteRow
                    key={entity.entityId}
                    entity={entity}
                    selected={focusedEntity?.entityId === entity.entityId}
                    onSelect={() => setFocusedEntityId(entity.entityId)}
                  />
                ))
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
