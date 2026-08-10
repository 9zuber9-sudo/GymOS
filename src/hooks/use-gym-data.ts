"use client";

import { useCallback, useEffect, useState } from "react";
import { DATA_EVENT, getData } from "@/lib/data";
import type { GymOSData } from "@/lib/types";

function dataErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; details?: unknown };
    if (typeof candidate.message === "string" && candidate.message) {
      return candidate.message;
    }
    if (typeof candidate.details === "string" && candidate.details) {
      return candidate.details;
    }
  }
  return "Could not load your GymOS data.";
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function useGymData() {
  const [data, setData] = useState<GymOSData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let lastError: unknown;
    try {
      setError("");
      for (const delay of [0, 250, 750]) {
        if (delay) await wait(delay);
        try {
          const next = await getData();
          setData(next);
          return;
        } catch (error) {
          lastError = error;
        }
      }
      setError(dataErrorMessage(lastError));
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
