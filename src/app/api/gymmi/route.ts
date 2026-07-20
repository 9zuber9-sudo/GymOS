import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askGymmi } from "@/lib/ai";
import type { ChatMessage } from "@/lib/types";

const requests = new Map<string, number[]>();
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

async function requestIdentity(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "demo";

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function withinDailyLimit(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return true;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.rpc("consume_gymmi_request", {
    daily_limit: 50,
  });
  // The migration may not be installed during local development; burst
  // limiting still applies in that case.
  if (result.error) return true;
  return result.data === true;
}

async function verifiedTrainingContext(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "";
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return "";
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [userResult, workoutsResult] = await Promise.all([
    client.auth.getUser(token),
    client
      .from("workouts")
      .select("focus,exercises,completed_at,duration_seconds")
      .order("completed_at", { ascending: false })
      .limit(6),
  ]);
  const trainingSystem = userResult.data.user?.user_metadata?.training_system;
  const profile = trainingSystem?.profile;
  const readiness = trainingSystem?.readiness;
  const schedule = trainingSystem?.schedule;
  const workouts = (workoutsResult.data || []).map((workout) => ({
    focus: workout.focus,
    completed_at: workout.completed_at,
    duration_minutes: Math.round((workout.duration_seconds || 0) / 60),
    exercises: Array.isArray(workout.exercises)
      ? workout.exercises.map(
          (exercise: {
            name?: string;
            sets?: Array<{
              weight?: number;
              reps?: number;
              completed?: boolean;
              toFailure?: boolean;
            }>;
          }) => ({
            name: exercise.name,
            completed_sets: (exercise.sets || [])
              .filter((set) => set.completed)
              .map((set) => ({
                weight: set.weight || 0,
                reps: set.reps || 0,
                to_failure: Boolean(set.toFailure),
              })),
          }),
        )
      : [],
  }));
  return JSON.stringify({
    profile: profile || null,
    today_readiness: readiness || null,
    weekly_schedule: schedule || [],
    recent_workouts: workouts,
  });
}

function withinRateLimit(identity: string) {
  const now = Date.now();
  const recent = (requests.get(identity) || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  requests.set(identity, recent);
  return true;
}

export async function POST(request: Request) {
  try {
    const identity = await requestIdentity(request);
    if (!identity) {
      return NextResponse.json(
        { error: "Please sign in before talking to Gymmi." },
        { status: 401 },
      );
    }
    if (!withinRateLimit(identity)) {
      return NextResponse.json(
        { error: "Gymmi needs a short break. Try again in a few minutes." },
        { status: 429 },
      );
    }
    if (!(await withinDailyLimit(request))) {
      return NextResponse.json(
        {
          error:
            "You reached today’s Gymmi limit. Your history and logged workouts are still available.",
        },
        { status: 429 },
      );
    }

    const body = (await request.json()) as { messages?: ChatMessage[] };
    if (!Array.isArray(body.messages) || !body.messages.length) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }
    const context = await verifiedTrainingContext(request);
    const reply = await askGymmi(body.messages, context);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gymmi request failed", error);
    return NextResponse.json(
      { error: "Gymmi is catching its breath. Please try again." },
      { status: 500 },
    );
  }
}
