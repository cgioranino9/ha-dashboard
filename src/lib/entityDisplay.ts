import {
  Lightbulb,
  Power,
  Fan,
  Lock,
  Unlock,
  ChevronsUpDown,
  Thermometer,
  Tv,
  Speaker,
  Wifi,
  Radio,
  Droplets,
  Zap,
  BatteryFull,
  Clock,
  List,
  Gauge,
  DoorOpen,
  Activity,
  Eye,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { DashboardEntity } from "./types";

const ACTIVE_STATES = new Set([
  "on",
  "open",
  "unlocked",
  "playing",
  "home",
  "cleaning",
  "heat",
  "cool",
  "auto",
  "dry",
  "fan_only",
  "heat_cool",
]);

export function isEntityActive(entity: DashboardEntity): boolean {
  if (entity.domain === "sensor") return false;
  return ACTIVE_STATES.has(entity.state);
}

export function getEntityIcon(entity: DashboardEntity): LucideIcon {
  const deviceClass = entity.attributes.device_class as string | undefined;

  switch (entity.domain) {
    case "light":
      return Lightbulb;
    case "switch":
      return Power;
    case "fan":
      return Fan;
    case "lock":
      return entity.state === "locked" ? Lock : Unlock;
    case "cover":
      return ChevronsUpDown;
    case "climate":
      return Thermometer;
    case "media_player":
      return deviceClass === "tv" ? Tv : Speaker;
    case "binary_sensor":
      if (deviceClass === "connectivity") return Wifi;
      if (deviceClass === "motion" || deviceClass === "occupancy") return Activity;
      if (deviceClass === "door" || deviceClass === "window" || deviceClass === "garage_door")
        return DoorOpen;
      return Radio;
    case "sensor":
      if (deviceClass === "temperature") return Thermometer;
      if (deviceClass === "humidity") return Droplets;
      if (deviceClass === "power" || deviceClass === "energy") return Zap;
      if (deviceClass === "battery") return BatteryFull;
      if (deviceClass === "timestamp") return Clock;
      if (deviceClass === "enum") return List;
      return Gauge;
    default:
      return Eye;
  }
}

const WEATHER_ICONS: Record<string, LucideIcon> = {
  sunny: Sun,
  "clear-night": Moon,
  cloudy: Cloud,
  partlycloudy: Cloud,
  fog: CloudFog,
  windy: Wind,
  "windy-variant": Wind,
  rainy: CloudRain,
  pouring: CloudRain,
  snowy: CloudSnow,
  "snowy-rainy": CloudSnow,
  hail: CloudSnow,
  lightning: CloudLightning,
  "lightning-rainy": CloudLightning,
  exceptional: Cloud,
};

export function getWeatherIcon(condition: string): LucideIcon {
  return WEATHER_ICONS[condition] ?? Cloud;
}

export type DomainAccent = {
  gradient: string;
  border: string;
  shadow: string;
  solid: string;
  soft: string;
  ring: string;
};

const ACCENTS: Record<string, DomainAccent> = {
  light: {
    gradient: "from-amber-500 to-amber-400",
    border: "border-amber-300/40",
    shadow: "shadow-amber-950/40",
    solid: "bg-amber-500",
    soft: "bg-amber-500/20 text-amber-300",
    ring: "ring-amber-400",
  },
  switch: {
    gradient: "from-blue-600 to-blue-500",
    border: "border-blue-400/40",
    shadow: "shadow-blue-950/40",
    solid: "bg-blue-500",
    soft: "bg-blue-500/20 text-blue-300",
    ring: "ring-blue-400",
  },
  fan: {
    gradient: "from-cyan-600 to-cyan-500",
    border: "border-cyan-400/40",
    shadow: "shadow-cyan-950/40",
    solid: "bg-cyan-500",
    soft: "bg-cyan-500/20 text-cyan-300",
    ring: "ring-cyan-400",
  },
  climate: {
    gradient: "from-orange-600 to-orange-500",
    border: "border-orange-400/40",
    shadow: "shadow-orange-950/40",
    solid: "bg-orange-500",
    soft: "bg-orange-500/20 text-orange-300",
    ring: "ring-orange-400",
  },
  media_player: {
    gradient: "from-pink-600 to-pink-500",
    border: "border-pink-400/40",
    shadow: "shadow-pink-950/40",
    solid: "bg-pink-500",
    soft: "bg-pink-500/20 text-pink-300",
    ring: "ring-pink-400",
  },
  cover: {
    gradient: "from-violet-600 to-violet-500",
    border: "border-violet-400/40",
    shadow: "shadow-violet-950/40",
    solid: "bg-violet-500",
    soft: "bg-violet-500/20 text-violet-300",
    ring: "ring-violet-400",
  },
  lock: {
    gradient: "from-red-600 to-red-500",
    border: "border-red-400/40",
    shadow: "shadow-red-950/40",
    solid: "bg-red-500",
    soft: "bg-red-500/20 text-red-300",
    ring: "ring-red-400",
  },
};

export function getDomainAccent(domain: string): DomainAccent {
  return ACCENTS[domain] ?? ACCENTS.switch;
}

export function formatEntityValue(entity: DashboardEntity): string {
  const unit = entity.attributes.unit_of_measurement as string | undefined;
  if (entity.domain === "sensor") {
    return unit ? `${entity.state} ${unit}` : entity.state;
  }
  if (entity.domain === "binary_sensor") {
    return isEntityActive(entity) ? "Detected" : "Clear";
  }
  return entity.state.charAt(0).toUpperCase() + entity.state.slice(1).replace(/_/g, " ");
}
