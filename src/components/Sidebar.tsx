"use client";

import { Home, LayoutGrid, Star, Settings, HomeIcon } from "lucide-react";

export type DashboardView = "home" | "rooms" | "favorites" | "settings";

const ITEMS: { view: DashboardView; icon: typeof Home; label: string }[] = [
  { view: "home", icon: Home, label: "Home" },
  { view: "rooms", icon: LayoutGrid, label: "Rooms" },
  { view: "favorites", icon: Star, label: "Favorites" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}) {
  return (
    <nav className="hidden md:flex flex-col items-center gap-6 w-20 shrink-0 py-8">
      <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-neutral-400">
        <HomeIcon size={20} strokeWidth={1.75} />
      </div>
      <div className="flex flex-col gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onChange(item.view)}
              aria-label={item.label}
              title={item.label}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                active
                  ? "bg-blue-500 text-white"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
