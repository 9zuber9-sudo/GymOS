"use client";

import { hasSupabase, supabase } from "./supabase";
import type {
  ReadinessCheck,
  ScheduledWorkout,
  TrainingProfile,
  TrainingSystem,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "gymos-training-system-v1";
export const TRAINING_SYSTEM_EVENT = "gymos:training-system-change";

export const defaultProfile: TrainingProfile = {
  configured: false,
  goal: "build_muscle",
  experience: "beginner",
  trainingSpace: "gym",
  daysPerWeek: 3,
  sessionMinutes: 45,
  equipment: ["Dumbbells", "Barbell", "Machines"],
  considerations: "",
};

export const defaultTrainingSystem: TrainingSystem = {
  profile: defaultProfile,
  schedule: [],
  readiness: null,
  remindersEnabled: false,
};

function normalize(value: Partial<TrainingSystem> | null | undefined): TrainingSystem {
  return {
    profile: {
      ...defaultProfile,
      ...(value?.profile || {}),
      equipment: value?.profile?.equipment || defaultProfile.equipment,
    },
    schedule: Array.isArray(value?.schedule) ? value.schedule : [],
    readiness: value?.readiness || null,
    remindersEnabled: Boolean(value?.remindersEnabled),
  };
}

function readLocal() {
  if (typeof window === "undefined") return defaultTrainingSystem;
  try {
    return normalize(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as TrainingSystem,
    );
  } catch {
    return defaultTrainingSystem;
  }
}

function writeLocal(value: TrainingSystem) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(TRAINING_SYSTEM_EVENT));
}

export async function getTrainingSystem(): Promise<TrainingSystem> {
  if (!hasSupabase) return readLocal();
  const result = await supabase!.auth.getUser();
  if (result.error) throw result.error;
  const system = normalize(
    result.data.user?.user_metadata?.training_system as TrainingSystem | undefined,
  );
  const signupSpace = result.data.user?.user_metadata?.training_space;
  if (!system.profile.configured && signupSpace) {
    system.profile.trainingSpace = signupSpace as TrainingProfile["trainingSpace"];
  }
  return system;
}

export async function saveTrainingSystem(value: TrainingSystem) {
  const normalized = normalize(value);
  if (!hasSupabase) {
    writeLocal(normalized);
    return normalized;
  }
  const result = await supabase!.auth.updateUser({
    data: { training_system: normalized },
  });
  if (result.error) throw result.error;
  window.dispatchEvent(new Event(TRAINING_SYSTEM_EVENT));
  return normalized;
}

export async function saveTrainingProfile(profile: TrainingProfile) {
  const current = await getTrainingSystem();
  return saveTrainingSystem({ ...current, profile: { ...profile, configured: true } });
}

export async function saveSchedule(schedule: ScheduledWorkout[]) {
  const current = await getTrainingSystem();
  return saveTrainingSystem({ ...current, schedule });
}

export async function addScheduledWorkout(
  workout: Omit<ScheduledWorkout, "id" | "enabled">,
) {
  const current = await getTrainingSystem();
  return saveTrainingSystem({
    ...current,
    schedule: [...current.schedule, { ...workout, id: uid(), enabled: true }],
  });
}

export async function saveReadiness(readiness: ReadinessCheck) {
  const current = await getTrainingSystem();
  return saveTrainingSystem({ ...current, readiness });
}

export async function setRemindersEnabled(remindersEnabled: boolean) {
  const current = await getTrainingSystem();
  return saveTrainingSystem({ ...current, remindersEnabled });
}

export function readinessPrompt(readiness: ReadinessCheck | null) {
  if (!readiness) return "";
  return `My readiness today: sleep ${readiness.sleep}/5, energy ${readiness.energy}/5, soreness ${readiness.soreness}/5, and I have ${readiness.availableMinutes} minutes. Adjust the workout conservatively for this.`;
}

export function readinessScore(readiness: ReadinessCheck | null) {
  if (!readiness) return null;
  return Math.round(
    ((readiness.sleep + readiness.energy + (6 - readiness.soreness)) / 15) * 100,
  );
}
