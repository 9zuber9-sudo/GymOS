"use client";

import { hasSupabase, supabase } from "./supabase";
import type {
  GymOSData,
  Note,
  NoteCategory,
  WeightLog,
  Workout,
  WorkoutTemplate,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "gymos-data-v1";
export const DATA_EVENT = "gymos:data-change";

function isoDaysAgo(days: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function sets(weight: number, reps: number, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    weight: weight + (index === count - 1 ? 2.5 : 0),
    reps,
    completed: true,
    toFailure: index === count - 1,
  }));
}

const seed: GymOSData = {
  workouts: [
    {
      id: "demo-workout-1",
      focus: "Push Day",
      status: "completed",
      created_at: isoDaysAgo(0, 7),
      completed_at: isoDaysAgo(0, 8),
      duration_seconds: 3120,
      exercises: [
        { name: "Barbell Bench Press", sets: sets(60, 8, 4) },
        { name: "Incline Dumbbell Press", sets: sets(22.5, 10, 3) },
        { name: "Cable Fly", sets: sets(15, 12, 3) },
      ],
    },
    {
      id: "demo-workout-2",
      focus: "Pull Day",
      status: "completed",
      created_at: isoDaysAgo(1, 18),
      completed_at: isoDaysAgo(1, 19),
      duration_seconds: 2760,
      exercises: [
        { name: "Lat Pulldown", sets: sets(50, 10, 4) },
        { name: "Seated Cable Row", sets: sets(45, 10, 3) },
        { name: "Dumbbell Curl", sets: sets(12.5, 12, 3) },
      ],
    },
    {
      id: "demo-workout-3",
      focus: "Leg Day",
      status: "completed",
      created_at: isoDaysAgo(2, 17),
      completed_at: isoDaysAgo(2, 18),
      duration_seconds: 3480,
      exercises: [
        { name: "Back Squat", sets: sets(75, 8, 4) },
        { name: "Romanian Deadlift", sets: sets(65, 10, 3) },
        { name: "Walking Lunges", sets: sets(16, 12, 3) },
      ],
    },
    {
      id: "demo-workout-4",
      focus: "Upper Body",
      status: "completed",
      created_at: isoDaysAgo(5, 17),
      completed_at: isoDaysAgo(5, 18),
      duration_seconds: 2400,
      exercises: [
        { name: "Overhead Press", sets: sets(35, 8, 4) },
        { name: "Chest Supported Row", sets: sets(25, 10, 3) },
      ],
    },
  ],
  weightLogs: [
    { id: "weight-1", weight: 78.4, logged_at: isoDaysAgo(21, 8) },
    { id: "weight-2", weight: 77.8, logged_at: isoDaysAgo(14, 8) },
    { id: "weight-3", weight: 77.2, logged_at: isoDaysAgo(7, 8) },
    { id: "weight-4", weight: 76.8, logged_at: isoDaysAgo(0, 8) },
  ],
  notes: [
    {
      id: "note-1",
      content: "Keep the last set controlled. Form before load.",
      category: "Workout",
      pinned: true,
      created_at: isoDaysAgo(0, 9),
    },
    {
      id: "note-2",
      content: "Prep oats and fruit tonight so breakfast is automatic.",
      category: "Nutrition",
      pinned: false,
      created_at: isoDaysAgo(1, 21),
    },
    {
      id: "note-3",
      content: "Add 2.5 kg to bench when all four sets reach 8 clean reps.",
      category: "Goals",
      pinned: false,
      created_at: isoDaysAgo(4, 20),
    },
  ],
  templates: [
    {
      id: "template-push",
      name: "Push Strength",
      created_at: isoDaysAgo(14),
      exercises: [
        { name: "Barbell Bench Press", sets: 4, reps: 6 },
        { name: "Overhead Press", sets: 3, reps: 8 },
        { name: "Incline Dumbbell Press", sets: 3, reps: 10 },
        { name: "Tricep Pushdown", sets: 3, reps: 12 },
      ],
    },
    {
      id: "template-legs",
      name: "Leg Builder",
      created_at: isoDaysAgo(10),
      exercises: [
        { name: "Back Squat", sets: 4, reps: 8 },
        { name: "Romanian Deadlift", sets: 3, reps: 10 },
        { name: "Walking Lunges", sets: 3, reps: 12 },
        { name: "Standing Calf Raise", sets: 4, reps: 15 },
      ],
    },
  ],
};

function localRead(): GymOSData {
  if (typeof window === "undefined") return seed;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(saved) as GymOSData;
  } catch {
    return seed;
  }
}

function localWrite(data: GymOSData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(DATA_EVENT));
}

async function userId() {
  const result = await supabase!.auth.getUser();
  if (!result.data.user) throw new Error("Please sign in to continue.");
  return result.data.user.id;
}

export async function getData(): Promise<GymOSData> {
  if (!hasSupabase) return localRead();
  const uid = await userId();
  const [workouts, weightLogs, notes, templates] = await Promise.all([
    supabase!.from("workouts").select("*").eq("user_id", uid).order("completed_at", { ascending: false }),
    supabase!.from("body_weight_logs").select("*").eq("user_id", uid).order("logged_at"),
    supabase!.from("notes").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase!.from("workout_templates").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
  ]);
  const error = workouts.error || weightLogs.error || notes.error || templates.error;
  if (error) throw error;
  return {
    workouts: (workouts.data || []) as Workout[],
    weightLogs: (weightLogs.data || []) as WeightLog[],
    notes: (notes.data || []) as Note[],
    templates: (templates.data || []) as WorkoutTemplate[],
  };
}

export async function saveWorkout(workout: Omit<Workout, "id" | "created_at">) {
  if (!hasSupabase) {
    const data = localRead();
    const created = { ...workout, id: uid(), created_at: new Date().toISOString() };
    localWrite({ ...data, workouts: [created, ...data.workouts] });
    return created;
  }
  const owner = await userId();
  const result = await supabase!
    .from("workouts")
    .insert({ ...workout, user_id: owner })
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data as Workout;
}

export async function addWeight(weight: number) {
  const created: WeightLog = { id: uid(), weight, logged_at: new Date().toISOString() };
  if (!hasSupabase) {
    const data = localRead();
    localWrite({ ...data, weightLogs: [...data.weightLogs, created] });
    return created;
  }
  const owner = await userId();
  const result = await supabase!
    .from("body_weight_logs")
    .insert({ weight, user_id: owner })
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data as WeightLog;
}

export async function updateWeight(id: string, weight: number) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({
      ...data,
      weightLogs: data.weightLogs.map((log) =>
        log.id === id ? { ...log, weight } : log,
      ),
    });
    return;
  }
  const result = await supabase!
    .from("body_weight_logs")
    .update({ weight })
    .eq("id", id);
  if (result.error) throw result.error;
}

export async function deleteWeight(id: string) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({
      ...data,
      weightLogs: data.weightLogs.filter((log) => log.id !== id),
    });
    return;
  }
  const result = await supabase!.from("body_weight_logs").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function deleteWorkout(id: string) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({
      ...data,
      workouts: data.workouts.filter((workout) => workout.id !== id),
    });
    return;
  }
  const result = await supabase!.from("workouts").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function addNote(content: string, category: NoteCategory) {
  const created: Note = {
    id: uid(),
    content,
    category,
    pinned: false,
    created_at: new Date().toISOString(),
  };
  if (!hasSupabase) {
    const data = localRead();
    localWrite({ ...data, notes: [created, ...data.notes] });
    return created;
  }
  const owner = await userId();
  const result = await supabase!
    .from("notes")
    .insert({ content, category, pinned: false, user_id: owner })
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data as Note;
}

export async function updateNote(id: string, updates: Partial<Pick<Note, "pinned">>) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({
      ...data,
      notes: data.notes.map((note) => (note.id === id ? { ...note, ...updates } : note)),
    });
    return;
  }
  const result = await supabase!.from("notes").update(updates).eq("id", id);
  if (result.error) throw result.error;
}

export async function deleteNote(id: string) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({ ...data, notes: data.notes.filter((note) => note.id !== id) });
    return;
  }
  const result = await supabase!.from("notes").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function saveTemplate(
  template: Omit<WorkoutTemplate, "id" | "created_at">,
) {
  const created: WorkoutTemplate = {
    ...template,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  if (!hasSupabase) {
    const data = localRead();
    localWrite({ ...data, templates: [created, ...data.templates] });
    return created;
  }
  const owner = await userId();
  const result = await supabase!
    .from("workout_templates")
    .insert({ ...template, user_id: owner })
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data as WorkoutTemplate;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<WorkoutTemplate, "name" | "exercises">>,
) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({
      ...data,
      templates: data.templates.map((template) =>
        template.id === id ? { ...template, ...updates } : template,
      ),
    });
    return;
  }
  const result = await supabase!.from("workout_templates").update(updates).eq("id", id);
  if (result.error) throw result.error;
}

export async function deleteTemplate(id: string) {
  if (!hasSupabase) {
    const data = localRead();
    localWrite({ ...data, templates: data.templates.filter((template) => template.id !== id) });
    return;
  }
  const result = await supabase!.from("workout_templates").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function getTemplate(id: string) {
  if (!hasSupabase) return localRead().templates.find((template) => template.id === id) || null;
  const result = await supabase!.from("workout_templates").select("*").eq("id", id).single();
  if (result.error) throw result.error;
  return result.data as WorkoutTemplate;
}

export function resetDemoData() {
  localWrite(seed);
}
