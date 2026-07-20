"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getTrainingSystem,
  TRAINING_SYSTEM_EVENT,
} from "@/lib/training-system";
import type { TrainingSystem } from "@/lib/types";

export function useTrainingSystem() {
  const [system, setSystem] = useState<TrainingSystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      setSystem(await getTrainingSystem());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your training plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(TRAINING_SYSTEM_EVENT, refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(TRAINING_SYSTEM_EVENT, refresh);
    };
  }, [refresh]);

  return { system, loading, error, refresh };
}
