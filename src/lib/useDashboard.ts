"use client";

import useSWR from "swr";
import type { DashboardData } from "./types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  });

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/dashboard",
    fetcher,
    { refreshInterval: 3000 }
  );

  return { data, error, isLoading, mutate };
}

export async function callService(
  domain: string,
  service: string,
  entityId: string,
  data?: Record<string, unknown>
) {
  const res = await fetch("/api/service", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, service, entityId, data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Service call failed: ${res.status}`);
  }
}
