"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Moon,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { showToast } from "@/components/toast-provider";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { useTrainingSystem } from "@/hooks/use-training-system";
import {
  addScheduledWorkout,
  readinessPrompt,
  readinessScore,
  saveReadiness,
  saveSchedule,
  saveTrainingProfile,
  setRemindersEnabled,
} from "@/lib/training-system";
import type {
  ExperienceLevel,
  ReadinessCheck,
  TrainingGoal,
  TrainingProfile,
} from "@/lib/types";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const goalLabels: Record<TrainingGoal, string> = {
  build_muscle: "Build muscle",
  strength: "Get stronger",
  fat_loss: "Fat loss",
  general_fitness: "General fitness",
};
const equipmentOptions = [
  "Bodyweight",
  "Dumbbells",
  "Barbell",
  "Machines",
  "Cables",
  "Resistance bands",
];

export default function PlanPage() {
  const { system, loading, error, refresh } = useTrainingSystem();
  const [profile, setProfile] = useState<TrainingProfile | null>(null);
  const [saving, setSaving] = useState("");
  const [day, setDay] = useState(1);
  const [title, setTitle] = useState("Push workout");
  const [time, setTime] = useState("18:00");
  const [readiness, setReadiness] = useState<ReadinessCheck>({
    date: new Date().toISOString().slice(0, 10),
    sleep: 3,
    energy: 3,
    soreness: 2,
    availableMinutes: 45,
  });

  useEffect(() => {
    if (!system) return;
    const timer = window.setTimeout(() => {
      setProfile(system.profile);
      if (system.readiness?.date === new Date().toISOString().slice(0, 10)) {
        setReadiness(system.readiness);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [system]);

  const sortedSchedule = useMemo(
    () => [...(system?.schedule || [])].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)),
    [system?.schedule],
  );

  async function saveProfile() {
    if (!profile) return;
    setSaving("profile");
    try {
      await saveTrainingProfile(profile);
      await refresh();
      showToast({
        title: "Training profile saved",
        description: "Gymmi will use these goals and constraints.",
        tone: "success",
      });
    } catch (err) {
      showToast({
        title: "Profile not saved",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving("");
    }
  }

  async function addSession() {
    if (!title.trim()) return;
    setSaving("schedule");
    try {
      await addScheduledWorkout({ weekday: day, title: title.trim(), time });
      await refresh();
      showToast({
        title: "Session scheduled",
        description: `${title.trim()} added for ${weekdays[day]}.`,
        tone: "success",
      });
    } catch (err) {
      showToast({
        title: "Schedule not updated",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving("");
    }
  }

  async function updateSchedule(next: NonNullable<typeof system>["schedule"]) {
    setSaving("schedule");
    try {
      await saveSchedule(next);
      await refresh();
    } catch (err) {
      showToast({
        title: "Schedule not updated",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving("");
    }
  }

  async function checkIn() {
    setSaving("readiness");
    try {
      await saveReadiness(readiness);
      await refresh();
      showToast({
        title: "Readiness saved",
        description: "Gymmi can now adjust today’s session.",
        tone: "success",
      });
    } catch (err) {
      showToast({
        title: "Check-in not saved",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving("");
    }
  }

  async function enableReminders() {
    if (!window.isSecureContext || !("Notification" in window)) {
      showToast({
        title: "HTTPS required",
        description: "Install and notification prompts work after HTTPS deployment.",
        tone: "info",
      });
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    await setRemindersEnabled(enabled);
    await refresh();
    showToast({
      title: enabled ? "Reminders enabled" : "Reminders not enabled",
      description: enabled
        ? "GymOS can remind you while the installed app is active."
        : "You can allow notifications later in browser settings.",
      tone: enabled ? "success" : "info",
    });
  }

  if (error) return <ErrorState message={error} />;
  if (loading || !system || !profile) return <LoadingState label="Loading your training system" />;

  const score = readinessScore(
    system.readiness?.date === readiness.date ? system.readiness : readiness,
  );

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Your training system"
        title="Plan"
        description="Set the goal, schedule the work, and let Gymmi adapt the session to the day you are actually having."
        action={
          <Link
            href={`/dashboard/gymmi?q=${encodeURIComponent(
              `Give me a weekly training review using my real history. ${readinessPrompt(system.readiness)}`,
            )}`}
            className="primary-button flex h-10 items-center gap-2 px-4 text-xs"
          >
            <Sparkles size={14} /> Weekly review
          </Link>
        }
      />

      {!profile.configured && (
        <div className="mb-5 rounded-2xl border border-orange-500/25 bg-orange-500/8 p-4 text-sm text-orange-200">
          Complete this profile once so Gymmi can stop giving generic plans.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="surface p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Goal profile</h2>
              <p className="mt-1 text-[11px] text-zinc-600">Used in every personalized Gymmi request.</p>
            </div>
            {profile.configured && <Check size={16} className="ml-auto text-green-400" />}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Primary goal</span>
              <select
                value={profile.goal}
                onChange={(event) => setProfile({ ...profile, goal: event.target.value as TrainingGoal })}
                className="input h-11 px-3 text-sm"
              >
                {Object.entries(goalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Experience</span>
              <select
                value={profile.experience}
                onChange={(event) => setProfile({ ...profile, experience: event.target.value as ExperienceLevel })}
                className="input h-11 px-3 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Training space</span>
              <select
                value={profile.trainingSpace}
                onChange={(event) => setProfile({ ...profile, trainingSpace: event.target.value as TrainingProfile["trainingSpace"] })}
                className="input h-11 px-3 text-sm"
              >
                <option value="home">Home</option>
                <option value="gym">Gym</option>
                <option value="home_and_gym">Home + Gym</option>
                <option value="outdoors_or_other">Outdoors / Other</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-2 block text-xs font-semibold text-zinc-500">Days/week</span>
                <input type="number" min="1" max="7" value={profile.daysPerWeek} onChange={(event) => setProfile({ ...profile, daysPerWeek: Number(event.target.value) })} className="input h-11 px-3 text-sm" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-zinc-500">Minutes</span>
                <input type="number" min="15" max="180" step="5" value={profile.sessionMinutes} onChange={(event) => setProfile({ ...profile, sessionMinutes: Number(event.target.value) })} className="input h-11 px-3 text-sm" />
              </label>
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-xs font-semibold text-zinc-500">Available equipment</span>
            <div className="flex flex-wrap gap-2">
              {equipmentOptions.map((item) => {
                const active = profile.equipment.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => setProfile({
                      ...profile,
                      equipment: active ? profile.equipment.filter((value) => value !== item) : [...profile.equipment, item],
                    })}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${active ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-zinc-800 text-zinc-600"}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-semibold text-zinc-500">Limitations or considerations</span>
            <textarea
              value={profile.considerations}
              onChange={(event) => setProfile({ ...profile, considerations: event.target.value })}
              placeholder="Example: avoid high-impact jumps; prefer short sessions. Do not enter medical records."
              className="input min-h-20 resize-y p-3 text-xs"
            />
          </label>
          <button onClick={saveProfile} disabled={saving === "profile"} className="primary-button mt-5 flex h-10 items-center gap-2 px-4 text-xs">
            {saving === "profile" ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
            Save training profile
          </button>
        </section>

        <section className="surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Today’s readiness</h2>
              <p className="mt-1 text-[11px] text-zinc-600">Self-reported guidance, not a medical score.</p>
            </div>
            <div className="mono-font ml-auto text-xl font-bold text-orange-400">{score}%</div>
          </div>
          <div className="mt-6 space-y-5">
            {[
              ["Sleep quality", "sleep", Moon],
              ["Energy", "energy", Zap],
              ["Soreness", "soreness", Target],
            ].map(([label, key, Icon]) => {
              const ValueIcon = Icon as typeof Moon;
              const field = key as "sleep" | "energy" | "soreness";
              return (
                <label key={field} className="block">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-zinc-500"><ValueIcon size={13} /> {String(label)}</span>
                    <span className="mono-font text-zinc-300">{readiness[field]}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={readiness[field]} onChange={(event) => setReadiness({ ...readiness, [field]: Number(event.target.value) })} className="w-full accent-orange-500" />
                </label>
              );
            })}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Time available today</span>
              <div className="relative">
                <Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input type="number" min="10" max="180" step="5" value={readiness.availableMinutes} onChange={(event) => setReadiness({ ...readiness, availableMinutes: Number(event.target.value) })} className="input h-11 pl-9 pr-12 text-sm" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">MIN</span>
              </div>
            </label>
          </div>
          <button onClick={checkIn} disabled={saving === "readiness"} className="primary-button mt-5 flex h-10 w-full items-center justify-center gap-2 text-xs">
            {saving === "readiness" ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
            Save today’s check-in
          </button>
          <Link href={`/dashboard/gymmi?q=${encodeURIComponent(`Build today's workout. ${readinessPrompt(readiness)}`)}`} className="ghost-button mt-2 flex h-10 w-full items-center justify-center gap-2 text-xs">
            Ask Gymmi to adapt <ChevronRight size={13} />
          </Link>
        </section>
      </div>

      <section className="surface mt-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500"><CalendarDays size={18} /></div>
            <div>
              <h2 className="text-sm font-semibold">Weekly schedule</h2>
              <p className="mt-1 text-[11px] text-zinc-600">A simple repeatable rhythm, editable at any time.</p>
            </div>
          </div>
          <button onClick={enableReminders} className="ghost-button flex h-9 items-center gap-2 px-3 text-[10px] sm:ml-auto">
            <Bell size={13} /> {system.remindersEnabled ? "Reminders enabled" : "Enable reminders"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[150px_1fr_130px_auto]">
          <select value={day} onChange={(event) => setDay(Number(event.target.value))} className="input h-10 px-3 text-xs">
            {weekdays.map((label, index) => <option key={label} value={index}>{label}</option>)}
          </select>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Session name" className="input h-10 px-3 text-xs" />
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="input h-10 px-3 text-xs" />
          <button onClick={addSession} disabled={saving === "schedule" || !title.trim()} className="primary-button flex h-10 items-center justify-center gap-2 px-4 text-xs">
            <Plus size={13} /> Add
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedSchedule.map((item) => (
            <article key={item.id} className={`rounded-2xl border p-4 ${item.enabled ? "border-zinc-800 bg-zinc-950/45" : "border-zinc-800/60 opacity-55"}`}>
              <div className="flex items-start gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-orange-500/10 text-orange-500"><CalendarDays size={15} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-300">{item.title}</div>
                  <div className="mono-font mt-1 text-[9px] text-zinc-600">{weekdays[item.weekday].toUpperCase()} · {item.time}</div>
                </div>
                <button onClick={() => updateSchedule(system.schedule.filter((entry) => entry.id !== item.id))} className="text-zinc-700 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
              <button
                onClick={() => updateSchedule(system.schedule.map((entry) => entry.id === item.id ? { ...entry, enabled: !entry.enabled } : entry))}
                className="mt-3 text-[10px] font-semibold text-zinc-600 hover:text-orange-400"
              >
                {item.enabled ? "Pause session" : "Enable session"}
              </button>
            </article>
          ))}
          {!sortedSchedule.length && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-5 text-xs text-zinc-600">Add your first recurring session above.</div>
          )}
        </div>
      </section>
    </div>
  );
}
