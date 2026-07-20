import type { Workout, WorkoutExercise } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function uid() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  // randomUUID can be unavailable when a development build is opened through
  // a plain-http LAN address. Supabase still owns all persisted auth/user IDs.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function totalSets(exercises: WorkoutExercise[]) {
  return exercises.reduce((sum, ex) => sum + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
}

export function completedSets(exercises: WorkoutExercise[]) {
  return exercises.reduce(
    (sum, ex) =>
      sum + (Array.isArray(ex.sets) ? ex.sets.filter((set) => set.completed).length : 0),
    0,
  );
}

export function workoutVolume(workout: Pick<Workout, "exercises">) {
  return workout.exercises.reduce(
    (sum, ex) =>
      sum +
      (Array.isArray(ex.sets)
        ? ex.sets.reduce(
            (setSum, set) => setSum + (set.completed ? Number(set.weight) * Number(set.reps) : 0),
            0,
          )
        : 0),
    0,
  );
}

export function dateKey(date: string | Date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function streakFor(workouts: Workout[]) {
  const days = new Set(workouts.map((workout) => dateKey(workout.completed_at)));
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes ? `${minutes}m ${secs ? `${secs}s` : ""}`.trim() : `${secs}s`;
}

export function relativeDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (dateKey(date) === dateKey(today)) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey(date) === dateKey(yesterday)) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function focusCategory(focus: string) {
  const text = focus.toLowerCase();
  if (/chest|push|pec/.test(text)) return "Chest";
  if (/back|pull|lat/.test(text)) return "Back";
  if (/leg|quad|hamstring|glute/.test(text)) return "Legs";
  if (/shoulder|delt/.test(text)) return "Shoulders";
  if (/arm|bicep|tricep/.test(text)) return "Arms";
  if (/core|abs/.test(text)) return "Core";
  return "Other";
}

export function muscleOf(exercise: string) {
  const text = exercise.toLowerCase();
  if (/bench|chest|fly|push-up|dip/.test(text)) return "chest";
  if (/row|pulldown|pull-up|deadlift|back/.test(text)) return "back";
  if (/shoulder|overhead|lateral|delt/.test(text)) return "shoulders";
  if (/curl|tricep|extension|arm/.test(text)) return "arms";
  if (/squat|leg|lunge|calf|hamstring|glute/.test(text)) return "legs";
  if (/plank|crunch|core|ab/.test(text)) return "core";
  return "other";
}
