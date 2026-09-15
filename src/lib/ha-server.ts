import "server-only";
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  type Connection,
  type HassEntities,
} from "home-assistant-js-websocket";
import type { DashboardArea, DashboardData, DashboardEntity, ForecastDay, HassEntity } from "./types";

const DOMAIN_ALLOWLIST = new Set([
  "light",
  "switch",
  "climate",
  "cover",
  "fan",
  "media_player",
  "lock",
  "binary_sensor",
  "sensor",
  "vacuum",
  "humidifier",
  "camera",
]);

const REGISTRY_REFRESH_MS = 5 * 60 * 1000;
const FORECAST_REFRESH_MS = 20 * 60 * 1000;

type EntityRegistryEntry = {
  entity_id: string;
  device_id: string | null;
  area_id: string | null;
};

type DeviceRegistryEntry = {
  id: string;
  area_id: string | null;
};

type AreaRegistryEntry = {
  area_id: string;
  name: string;
};

type Registries = {
  entityAreaMap: Map<string, string>;
  areaNames: Map<string, string>;
  fetchedAt: number;
};

type ForecastCache = {
  entityId: string;
  days: ForecastDay[];
  fetchedAt: number;
};

type GlobalState = {
  connectionPromise: Promise<Connection> | null;
  entities: HassEntities;
  registries: Registries | null;
  registriesPromise: Promise<Registries> | null;
  forecast: ForecastCache | null;
  forecastPromise: Promise<ForecastCache> | null;
};

const globalForHa = globalThis as unknown as { __haState?: GlobalState };

const state: GlobalState = globalForHa.__haState ?? {
  connectionPromise: null,
  entities: {},
  registries: null,
  registriesPromise: null,
  forecast: null,
  forecastPromise: null,
};
globalForHa.__haState = state;

function getEnv() {
  const HA_URL = process.env.HA_URL;
  const HA_TOKEN = process.env.HA_TOKEN;
  if (!HA_URL || !HA_TOKEN) {
    throw new Error(
      "HA_URL and HA_TOKEN must be set in .env.local (see .env.local.example)"
    );
  }
  return { HA_URL, HA_TOKEN };
}

async function getConnection(): Promise<Connection> {
  if (!state.connectionPromise) {
    const { HA_URL, HA_TOKEN } = getEnv();
    const auth = createLongLivedTokenAuth(HA_URL, HA_TOKEN);
    state.connectionPromise = createConnection({ auth })
      .then((conn) => {
        subscribeEntities(conn, (entities) => {
          state.entities = entities;
        });
        conn.addEventListener("disconnected", () => {
          console.warn("[ha] websocket disconnected, will auto-reconnect");
        });
        return conn;
      })
      .catch((err) => {
        // Don't cache a failed connection attempt — let the next call retry
        // instead of repeating the same failure forever.
        state.connectionPromise = null;
        console.error("[ha] connection failed:", err);
        throw err;
      });
  }
  return state.connectionPromise;
}

async function fetchRegistries(conn: Connection): Promise<Registries> {
  const [entities, devices, areas] = await Promise.all([
    conn.sendMessagePromise<EntityRegistryEntry[]>({
      type: "config/entity_registry/list",
    }),
    conn.sendMessagePromise<DeviceRegistryEntry[]>({
      type: "config/device_registry/list",
    }),
    conn.sendMessagePromise<AreaRegistryEntry[]>({
      type: "config/area_registry/list",
    }),
  ]);

  const deviceAreaMap = new Map<string, string | null>();
  for (const device of devices) {
    deviceAreaMap.set(device.id, device.area_id);
  }

  const entityAreaMap = new Map<string, string>();
  for (const entity of entities) {
    const areaId =
      entity.area_id ?? (entity.device_id ? deviceAreaMap.get(entity.device_id) : null);
    if (areaId) {
      entityAreaMap.set(entity.entity_id, areaId);
    }
  }

  const areaNames = new Map<string, string>();
  for (const area of areas) {
    areaNames.set(area.area_id, area.name);
  }

  return { entityAreaMap, areaNames, fetchedAt: Date.now() };
}

async function getRegistries(conn: Connection): Promise<Registries> {
  const isStale =
    !state.registries || Date.now() - state.registries.fetchedAt > REGISTRY_REFRESH_MS;

  if (isStale && !state.registriesPromise) {
    state.registriesPromise = fetchRegistries(conn)
      .then((registries) => {
        state.registries = registries;
        state.registriesPromise = null;
        return registries;
      })
      .catch((err) => {
        state.registriesPromise = null;
        throw err;
      });
  }

  if (state.registries) return state.registries;
  return state.registriesPromise!;
}

type RawForecastEntry = {
  datetime: string;
  condition: string;
  temperature?: number;
  templow?: number;
};

async function fetchForecast(conn: Connection, entityId: string): Promise<ForecastCache> {
  const response = await conn.sendMessagePromise<
    Record<string, { forecast: RawForecastEntry[] }>
  >({
    type: "weather/get_forecasts",
    entity_id: [entityId],
    forecast_type: "daily",
  });

  const raw = response[entityId]?.forecast ?? [];
  const days: ForecastDay[] = raw.slice(0, 4).map((d) => ({
    datetime: d.datetime,
    condition: d.condition,
    temperature: d.temperature ?? null,
    templow: d.templow ?? null,
  }));

  return { entityId, days, fetchedAt: Date.now() };
}

async function getForecast(conn: Connection, entityId: string): Promise<ForecastDay[]> {
  const isStale =
    !state.forecast ||
    state.forecast.entityId !== entityId ||
    Date.now() - state.forecast.fetchedAt > FORECAST_REFRESH_MS;

  if (isStale && !state.forecastPromise) {
    state.forecastPromise = fetchForecast(conn, entityId)
      .then((cache) => {
        state.forecast = cache;
        state.forecastPromise = null;
        return cache;
      })
      .catch((err) => {
        state.forecastPromise = null;
        throw err;
      });
  }

  try {
    const cache = state.forecast ?? (await state.forecastPromise);
    return cache!.days;
  } catch (err) {
    console.error("[ha] forecast fetch failed:", err);
    return [];
  }
}

function humanizeEntityId(entityId: string): string {
  const objectId = entityId.split(".")[1] ?? entityId;
  return objectId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function getDashboardData(): Promise<DashboardData> {
  const conn = await getConnection();
  const registries = await getRegistries(conn);

  const areaBuckets = new Map<string, DashboardEntity[]>();
  const unassigned: DashboardEntity[] = [];
  const scenes: DashboardEntity[] = [];
  let weather: DashboardEntity | null = null;
  let sun: DashboardEntity | null = null;

  for (const raw of Object.values(state.entities) as HassEntity[]) {
    const domain = raw.entity_id.split(".")[0];
    if (
      domain !== "scene" &&
      domain !== "weather" &&
      domain !== "sun" &&
      !DOMAIN_ALLOWLIST.has(domain)
    )
      continue;

    const entity: DashboardEntity = {
      entityId: raw.entity_id,
      domain,
      name: raw.attributes.friendly_name ?? humanizeEntityId(raw.entity_id),
      state: raw.state,
      attributes: raw.attributes,
      areaId: registries.entityAreaMap.get(raw.entity_id) ?? null,
      lastChanged: raw.last_changed,
    };

    if (domain === "scene") {
      scenes.push(entity);
    } else if (domain === "weather") {
      if (!weather) weather = entity;
    } else if (domain === "sun") {
      if (!sun) sun = entity;
    } else if (entity.areaId) {
      const bucket = areaBuckets.get(entity.areaId) ?? [];
      bucket.push(entity);
      areaBuckets.set(entity.areaId, bucket);
    } else {
      unassigned.push(entity);
    }
  }

  const areas: DashboardArea[] = Array.from(areaBuckets.entries())
    .map(([areaId, entities]) => ({
      areaId,
      name: registries.areaNames.get(areaId) ?? areaId,
      entities: entities.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  unassigned.sort((a, b) => a.name.localeCompare(b.name));
  scenes.sort((a, b) => a.name.localeCompare(b.name));

  const forecast = weather ? await getForecast(conn, weather.entityId) : null;

  return { areas, unassigned, scenes, weather, forecast, sun, updatedAt: Date.now() };
}

export async function callService(
  domain: string,
  service: string,
  entityId: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { HA_URL, HA_TOKEN } = getEnv();
  const res = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entity_id: entityId, ...data }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HA service call failed (${res.status}): ${text}`);
  }
}

export async function getCameraImage(
  entityId: string
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const { HA_URL, HA_TOKEN } = getEnv();
  const res = await fetch(`${HA_URL}/api/camera_proxy/${entityId}`, {
    headers: { Authorization: `Bearer ${HA_TOKEN}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Camera fetch failed (${res.status})`);
  }

  return {
    body: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") ?? "image/jpeg",
  };
}
