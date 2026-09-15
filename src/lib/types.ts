export type HassEntity = {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    unit_of_measurement?: string;
    device_class?: string;
    brightness?: number;
    current_temperature?: number;
    temperature?: number;
    hvac_modes?: string[];
    volume_level?: number;
    media_title?: string;
  };
  last_changed: string;
  last_updated: string;
};

export type DashboardEntity = {
  entityId: string;
  domain: string;
  name: string;
  state: string;
  attributes: HassEntity["attributes"];
  areaId: string | null;
  lastChanged: string;
};

export type DashboardArea = {
  areaId: string;
  name: string;
  entities: DashboardEntity[];
};

export type ForecastDay = {
  datetime: string;
  condition: string;
  temperature: number | null;
  templow: number | null;
};

export type DashboardData = {
  areas: DashboardArea[];
  unassigned: DashboardEntity[];
  scenes: DashboardEntity[];
  weather: DashboardEntity | null;
  forecast: ForecastDay[] | null;
  sun: DashboardEntity | null;
  updatedAt: number;
};
