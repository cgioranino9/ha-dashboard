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
