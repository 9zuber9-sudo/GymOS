"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Award,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  History,
  Plus,
  Pencil,
  Save,
  Scale,
  Target,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from "@/components/ui";
import { showToast } from "@/components/toast-provider";
import { useGymData } from "@/hooks/use-gym-data";
import {
  addWeight,
  deleteWeight,
  deleteWorkout,
  updateWeight,
} from "@/lib/data";
import {
  focusCategory,
  formatDuration,
  relativeDate,
  streakFor,
  totalSets,
  workoutVolume,
} from "@/lib/utils";

const orange = "#f97316";
const chartColors = ["#f97316", "#fb923c", "#c2410c", "#71717a", "#52525b", "#3f3f46", "#27272a"];
const tooltipStyle = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "12px",
  fontSize: "11px",
};

export default function ProgressPage() {
  const { data, loading, error, refresh } = useGymData();
  const [showWeight, setShowWeight] = useState(false);
  const [weight, setWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [actionError, setActionError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState("");
  const [editingValue, setEditingValue] = useState("");

  const analytics = useMemo(() => {
    if (!data) return null;

    const byDate = new Map<string, number>();
    const focus = new Map<string, number>();
    const records = new Map<
      string,
      { name: string; weight: number; reps: number; firstWeight: number }
    >();

    [...data.workouts]
      .reverse()
      .forEach((workout) => {
        const key = new Date(workout.completed_at).toLocaleDateString([], {
          day: "numeric",
          month: "short",
        });
        byDate.set(key, (byDate.get(key) || 0) + workoutVolume(workout));
        const group = focusCategory(workout.focus);
        focus.set(group, (focus.get(group) || 0) + 1);

        workout.exercises.forEach((exercise) => {
          const completed = Array.isArray(exercise.sets)
            ? exercise.sets.filter((set) => set.completed)
            : [];
          completed.forEach((set) => {
            const current = records.get(exercise.name.toLowerCase());
            if (!current) {
              records.set(exercise.name.toLowerCase(), {
                name: exercise.name,
                weight: set.weight,
                reps: set.reps,
                firstWeight: set.weight,
              });
            } else if (set.weight > current.weight) {
              records.set(exercise.name.toLowerCase(), {
                ...current,
                weight: set.weight,
                reps: set.reps,
              });
            }
          });
        });
      });

    const volumeData = Array.from(byDate, ([date, volume]) => ({
      date,
      volume: Math.round(volume),
    }));
    const focusData = Array.from(focus, ([name, value]) => ({ name, value }));
    const prs = Array.from(records.values()).sort((a, b) => b.weight - a.weight);
    const durations = data.workouts
      .map((workout) => workout.duration_seconds)
      .filter((duration) => duration > 0);

    return {
      volumeData,
      focusData,
      prs,
      avgMinutes: durations.length
        ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length / 60)
        : 0,
    };
  }, [data]);

  if (error) return <ErrorState message={error} />;
  if (loading || !data || !analytics) return <LoadingState label="Calculating your progress" />;

  const weightData = data.weightLogs.map((log) => ({
    date: new Date(log.logged_at).toLocaleDateString([], { day: "numeric", month: "short" }),
    weight: Number(log.weight),
  }));

  async function logWeight() {
    const value = Number(weight);
    if (!value || value <= 0) return;
    setSavingWeight(true);
    setActionError("");
    try {
      await addWeight(value);
      setWeight("");
      setShowWeight(false);
      await refresh();
      showToast({
        title: "Weight logged",
        description: `${value} kg was added to your progress.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not log your weight.";
      setActionError(message);
      showToast({
        title: "Weight not logged",
        description: message,
        tone: "error",
      });
    } finally {
      setSavingWeight(false);
    }
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Real data, no filler"
        title="Progress"
        description="The trend matters more than a single day. Every chart below comes from work you actually logged."
        action={
          <div className="relative">
            <button
              onClick={() => setShowWeight((value) => !value)}
              className="primary-button flex h-10 items-center justify-center gap-2 px-4 text-xs"
            >
              {showWeight ? <X size={15} /> : <Plus size={15} />}
              {showWeight ? "Close" : "Log weight"}
            </button>
            {showWeight && (
              <div className="surface absolute right-0 top-12 z-10 w-64 p-4 shadow-2xl">
                <label className="text-xs font-semibold text-zinc-400">Current body weight</label>
                <div className="relative mt-2">
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    step="0.1"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && logWeight()}
                    placeholder="76.5"
                    className="input h-11 px-3 pr-10 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">kg</span>
                </div>
                <button
                  disabled={savingWeight || !Number(weight)}
                  onClick={logWeight}
                  className="primary-button mt-3 h-10 w-full text-xs"
                >
                  {savingWeight ? "Saving…" : "Save entry"}
                </button>
              </div>
            )}
          </div>
        }
      />
      {actionError && <div className="mb-5"><ErrorState message={actionError} /></div>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Workouts completed"
          value={data.workouts.length}
          icon={CheckCircle2}
          detail="All recorded sessions"
        />
        <StatCard
          label="Avg workout time"
          value={`${analytics.avgMinutes}m`}
          icon={Clock3}
          detail="Completed sessions"
        />
        <StatCard
          label="Day streak"
          value={streakFor(data.workouts)}
          icon={Flame}
          detail="Consecutive training days"
          accent
        />
        <StatCard
          label="PRs achieved"
          value={analytics.prs.length}
          icon={Award}
          detail="Exercises with a record"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
        <section className="surface p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="eyebrow">All time</div>
              <h2 className="mt-2 text-base font-semibold">Workout volume</h2>
            </div>
            <div className="grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-orange-500">
              <AreaChart size={17} />
            </div>
          </div>
          {analytics.volumeData.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={analytics.volumeData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={orange} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString()} kg`, "Volume"]} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={orange}
                    strokeWidth={2}
                    fill="url(#volumeGradient)"
                    activeDot={{ r: 4, fill: orange }}
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No volume yet" text="Finish a workout to start your volume trend." />
          )}
        </section>

        <section className="surface p-4 sm:p-5">
          <div>
            <div className="eyebrow">Training split</div>
            <h2 className="mt-2 text-base font-semibold">Muscle group focus</h2>
          </div>
          {analytics.focusData.length ? (
            <>
              <div className="relative mx-auto mt-2 h-52 max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.focusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {analytics.focusData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <div className="mono-font text-xl font-bold">{data.workouts.length}</div>
                    <div className="eyebrow mt-1 text-[8px]">Sessions</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {analytics.focusData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="size-2 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                    <span className="flex-1">{item.name}</span>
                    <span className="mono-font text-zinc-400">
                      {Math.round((item.value / data.workouts.length) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={Target} title="No split yet" text="Workout focus will appear here." />
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <div className="eyebrow">Peak strength</div>
              <h2 className="mt-2 text-base font-semibold">Personal records</h2>
            </div>
            <Award size={18} className="text-orange-500" />
          </div>
          {analytics.prs.length ? (
            <div className="max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-[1fr_80px_70px] border-b border-zinc-800 px-5 py-3">
                {["EXERCISE", "TOP SET", "CHANGE"].map((heading) => (
                  <span key={heading} className="eyebrow text-[8px]">{heading}</span>
                ))}
              </div>
              {analytics.prs.map((record) => {
                const change = record.firstWeight
                  ? Math.round(((record.weight - record.firstWeight) / record.firstWeight) * 100)
                  : 0;
                return (
                  <div key={record.name} className="grid grid-cols-[1fr_80px_70px] items-center border-b border-zinc-800/70 px-5 py-3.5 last:border-0">
                    <div className="truncate text-xs font-semibold text-zinc-300">{record.name}</div>
                    <div>
                      <div className="mono-font text-xs font-semibold text-zinc-300">{record.weight} kg</div>
                      <div className="mt-0.5 text-[9px] text-zinc-700">× {record.reps} reps</div>
                    </div>
                    <div className={change > 0 ? "text-[10px] font-semibold text-green-400" : "text-[10px] text-zinc-600"}>
                      {change > 0 ? `+${change}%` : "Baseline"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Award} title="No records yet" text="Complete weighted sets to establish your first records." />
          )}
        </section>

        <section className="surface p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="eyebrow">Body trend</div>
              <h2 className="mt-2 text-base font-semibold">Weight progress</h2>
            </div>
            <Scale size={18} className="text-orange-500" />
          </div>
          {weightData.length ? (
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart data={weightData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis
                      stroke="#52525b"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      domain={["dataMin - 1", "dataMax + 1"]}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value)} kg`, "Weight"]} />
                    <Area type="monotone" dataKey="weight" stroke="#a1a1aa" strokeWidth={2} fill="url(#weightGradient)" />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 divide-y divide-zinc-800 border-t border-zinc-800">
                {[...data.weightLogs]
                  .reverse()
                  .slice(0, 3)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      {editingWeight === log.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editingValue}
                            onChange={(event) =>
                              setEditingValue(event.target.value)
                            }
                            className="input h-9 max-w-28 px-3 text-xs"
                          />
                          <button
                            onClick={async () => {
                              await updateWeight(log.id, Number(editingValue));
                              setEditingWeight("");
                              await refresh();
                              showToast({
                                title: "Weight corrected",
                                description: "Your progress trend was updated.",
                                tone: "success",
                              });
                            }}
                            className="grid size-8 place-items-center rounded-lg bg-orange-500 text-black"
                          >
                            <Save size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="mono-font text-xs text-zinc-300">
                              {Number(log.weight)} kg
                            </div>
                            <div className="mt-1 text-[9px] text-zinc-700">
                              {relativeDate(log.logged_at)}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingWeight(log.id);
                              setEditingValue(String(log.weight));
                            }}
                            className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-zinc-800 hover:text-zinc-300"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this weight entry?")) return;
                              await deleteWeight(log.id);
                              await refresh();
                              showToast({
                                title: "Weight entry deleted",
                                description: "The trend has been recalculated.",
                                tone: "success",
                              });
                            }}
                            className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Scale}
              title="No weight entries"
              text="Log your weight to see a calm, useful trend—not day-to-day noise."
              action={
                <button onClick={() => setShowWeight(true)} className="text-xs font-semibold text-orange-500">
                  Log your weight
                </button>
              }
            />
          )}
        </section>
      </div>

      <section id="history" className="surface mt-5 overflow-hidden scroll-mt-8">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-5">
          <div>
            <div className="eyebrow">Every session</div>
            <h2 className="mt-2 text-base font-semibold">History</h2>
          </div>
          <History size={18} className="text-zinc-600" />
        </div>
        {data.workouts.length ? (
          <div className="divide-y divide-zinc-800">
            {data.workouts.map((workout) => {
              const open = expanded === workout.id;
              return (
                <article key={workout.id}>
                  <button
                    onClick={() => setExpanded(open ? null : workout.id)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 text-left transition hover:bg-zinc-900/50 sm:grid-cols-[1fr_120px_120px_100px_64px] sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600">
                        <Dumbbell size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-300">{workout.focus}</div>
                        <div className="mt-1 text-[10px] text-zinc-700">{relativeDate(workout.completed_at)}</div>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="eyebrow text-[8px]">Sets</div>
                      <div className="mono-font mt-1 text-xs text-zinc-400">{totalSets(workout.exercises)}</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="eyebrow text-[8px]">Volume</div>
                      <div className="mono-font mt-1 text-xs text-zinc-400">{Math.round(workoutVolume(workout)).toLocaleString()} kg</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="eyebrow text-[8px]">Duration</div>
                      <div className="mono-font mt-1 text-xs text-zinc-400">{formatDuration(workout.duration_seconds)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!window.confirm(`Delete "${workout.focus}" from history?`)) return;
                          await deleteWorkout(workout.id);
                          await refresh();
                          showToast({
                            title: "Workout deleted",
                            description: "Progress metrics were recalculated.",
                            tone: "success",
                          });
                        }}
                        className="grid size-7 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                      <ChevronDown size={15} className={`text-zinc-600 transition ${open ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {open && (
                    <div className="grid gap-2 bg-zinc-950/40 px-4 pb-4 pt-1 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
                      {workout.exercises.map((exercise) => {
                        const top = [...exercise.sets]
                          .filter((set) => set.completed)
                          .sort((a, b) => b.weight - a.weight)[0];
                        return (
                          <div key={exercise.name} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                            <div className="truncate text-xs font-semibold text-zinc-400">{exercise.name}</div>
                            <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-600">
                              <span>{exercise.sets.length} sets</span>
                              {top && <span>Top: {top.weight} kg × {top.reps}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={CalendarRange} title="No history yet" text="Your completed workouts will stay organized here." />
        )}
      </section>
    </div>
  );
}
