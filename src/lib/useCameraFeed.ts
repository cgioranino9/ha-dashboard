"use client";

import { useState, useEffect } from "react";

export function useCameraFeed(entityId: string, intervalMs = 10000): string {
  const objectId = entityId.split(".")[1];
  const [src, setSrc] = useState(`/api/camera/${objectId}`);

  useEffect(() => {
    const id = setInterval(() => {
      setSrc(`/api/camera/${objectId}?t=${Date.now()}`);
    }, intervalMs);
    return () => clearInterval(id);
  }, [objectId, intervalMs]);

  return src;
}
