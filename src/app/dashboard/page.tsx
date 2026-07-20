"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  NotebookPen,
  Scale,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { ErrorState, LoadingState } from "@/components/ui";
import { useGymData } from "@/hooks/use-gym-data";
import { hasSupabase, supabase } from "@/lib/supabase";
import {
  completedSets,
  dateKey,
  formatDuration,
  relativeDate,
  streakFor,
  totalSets,
  workoutVolume,
} from "@/lib/utils";

const prompts = [
  "Best chest workout?",
  "What should I eat today?",
  "How can I improve sleep?",
  "Give me motivation",
];

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, error } = useGymData();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("Athlete");

  useEffect(() => {
    async function loadName() {
      if (hasSupabase) {
        const result = await supabase!.auth.getUser();
        const fullName = result.data.user?.user_metadata?.full_name;
        if (fullName) setName(fullName.split(" ")[0]);
      } else {
        const raw = window.localStorage.getItem("gymos-user");
        if (raw) {
          try {
            setName((JSON.parse(raw).full_name || "Athlete").split(" ")[0]);
          } catch {}
        }
      }
    }
    loadName();
  }, []);

  function ask(text: string) {
    if (!text.trim()) return;
    router.push(`/dashboard/gymmi?q=${encodeURIComponent(text.trim())}`);
  }

  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState label="Preparing your training day" />;

  const today = dateKey(new Date());
  const todaysWorkouts = data.workouts.filter((workout) => dateKey(workout.completed_at) === today);
  const todaysWorkout = todaysWorkouts[0];
  const todayCompleted = todaysWorkouts.reduce(
    (sum, workout) => sum + completedSets(workout.exercises),
    0,
  );
  const todayTotal = todaysWorkouts.reduce(
    (sum, workout) => sum + totalSets(workout.exercises),
    0,
  );
  const ring = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const streak = streakFor(data.workouts);

  return (
    <div className="fade-up">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2 text-orange-500">
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.045em]">
            Ready to work, {name}?
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Your next strong session starts with one decision.</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-4 py-2">
          <Flame size={16} className="fill-orange-500 text-orange-500" />
          <span className="mono-font text-xs font-bold text-orange-300">{streak} DAY STREAK</span>
        </div>
      </header>

      <section className="surface relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute right-0 top-0 size-56 rounded-full bg-orange-500/8 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-orange-500 text-black">
            <Bot size={21} />
          </div>
          <div>
            <div className="font-semibold text-zinc-100">Talk to Gymmi</div>
            <div className="text-xs text-zinc-500">Plan a session or ask anything about training.</div>
          </div>
          <Sparkles className="ml-auto text-orange-500/40" size={20} />
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(message);
          }}
          className="relative mt-5"
        >
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder='Try "Build me a 45-minute push workout"'
            className="input h-14 pl-5 pr-14 text-sm"
          />
          <button
            type="submit"
            aria-label="Ask Gymmi"
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-xl bg-orange-500 text-black transition hover:bg-orange-400"
          >
            <Send size={17} />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => ask(prompt)}
              className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[11px] text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Quick actions</h2>
          <span className="eyebrow">Move fast</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              href: "/dashboard/gymmi",
              icon: Dumbbell,
              title: "Start workout",
              text: "Build with Gymmi",
              accent: true,
            },
            {
              href: "/dashboard/plan",
              icon: CalendarDays,
              title: "Plan my week",
              text: "Goals and readiness",
            },
            {
              href: "/dashboard/progress",
              icon: Scale,
              title: "Track weight",
              text: "Update progress",
            },
            {
              href: "/dashboard/notes",
              icon: NotebookPen,
              title: "Add note",
              text: "Capture a thought",
            },
          ].map(({ href, icon: Icon, title, text, accent }) => (
            <Link
              key={title}
              href={href}
              className={`surface surface-hover group flex min-h-28 flex-col justify-between p-4 ${
                accent ? "border-orange-500/25 bg-[linear-gradient(145deg,rgba(249,115,22,.11),rgba(24,24,27,.96))]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className={accent ? "text-orange-500" : "text-zinc-600"} />
                <ArrowRight size={14} className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-200">{title}</div>
                <div className="mt-1 text-[11px] text-zinc-600">{text}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Today&apos;s focus</div>
                <h2 className="mt-2 text-lg font-semibold">
                  {todaysWorkout?.focus || "No session planned yet"}
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-orange-500">
                <Target size={18} />
              </div>
            </div>
            {todaysWorkout ? (
              <>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {todaysWorkout.exercises.map((exercise) => (
                    <div
                      key={exercise.name}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/45 px-3 py-3"
                    >
                      <div className="grid size-7 place-items-center rounded-lg bg-orange-500/10 text-[10px] font-black text-orange-400">
                        {exercise.sets.length}
                      </div>
                      <span className="truncate text-xs font-medium text-zinc-400">{exercise.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-zinc-800/80 pt-4 text-xs text-zinc-600">
                  <span className="flex items-center gap-1.5"><Clock3 size={13} /> {formatDuration(todaysWorkout.duration_seconds)}</span>
                  <span className="flex items-center gap-1.5"><TrendingUp size={13} /> {Math.round(workoutVolume(todaysWorkout)).toLocaleString()} kg</span>
                </div>
              </>
            ) : (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-zinc-800 px-4 py-5">
                <p className="text-sm text-zinc-600">Ask Gymmi to build today&apos;s plan.</p>
                <Link href="/dashboard/gymmi" className="text-xs font-semibold text-orange-500">
                  Plan now
                </Link>
              </div>
            )}
          </section>

          <section className="surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="eyebrow">Recent activity</div>
                <h2 className="mt-2 text-lg font-semibold">Last sessions</h2>
              </div>
              <Link href="/dashboard/progress#history" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-zinc-800/80">
              {data.workouts.slice(0, 3).map((workout) => (
                <div key={workout.id} className="flex items-center gap-4 py-3.5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                    <Dumbbell size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-300">{workout.focus}</div>
                    <div className="mt-1 text-[11px] text-zinc-600">
                      {workout.exercises.length} exercises · {totalSets(workout.exercises)} sets
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono-font text-xs text-zinc-400">{Math.round(workoutVolume(workout)).toLocaleString()} kg</div>
                    <div className="mt-1 text-[10px] text-zinc-600">{relativeDate(workout.completed_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Today&apos;s progress</div>
                <div className="mt-2 text-lg font-semibold">Sets completed</div>
              </div>
              <div
                className="grid size-24 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#f97316 ${ring * 3.6}deg, #27272a 0deg)`,
                }}
              >
                <div className="grid size-[76px] place-items-center rounded-full bg-[#18181b]">
                  <div className="text-center">
                    <div className="mono-font text-xl font-bold">{ring}%</div>
                    <div className="text-[9px] text-zinc-600">{todayCompleted}/{todayTotal || 0} SETS</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${ring}%` }} />
            </div>
          </section>

          <section className="surface relative overflow-hidden p-5">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-orange-500/8 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-orange-500">
                <Sparkles size={16} />
                <span className="eyebrow text-orange-500">Gymmi insight</span>
              </div>
              <blockquote className="mt-5 text-lg font-medium leading-7 tracking-[-0.02em] text-zinc-200">
                “Consistency compounds long before it becomes visible.”
              </blockquote>
              <p className="mt-4 text-xs leading-5 text-zinc-600">
                Keep today simple: show up, move well, record the truth.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
