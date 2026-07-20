"use client";

import { useCallback, useEffect, useState } from "react";
import { DATA_EVENT, getData } from "@/lib/data";
import type { GymOSData } from "@/lib/types";

export function useGymData() {
  const [data, setData] = useState<GymOSData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setError("");
      const next = await getData();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your GymOS data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    window.addEventListener(DATA_EVENT, refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(DATA_EVENT, refresh);
    };
  }, [refresh]);

  return { data, error, loading, refresh };
}
