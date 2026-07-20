"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  CirclePlus,
  Dumbbell,
  Flame,
  History,
  LoaderCircle,
  MessageSquarePlus,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Timer,
  TrendingUp,
  Trash2,
  UserRound,
  Weight,
  X,
} from "lucide-react";
import { ErrorState } from "@/components/ui";
import { showToast } from "@/components/toast-provider";
import { getData, getTemplate, saveTemplate, saveWorkout } from "@/lib/data";
import {
  deleteChatSession,
  listChatSessions,
  saveChatSession,
} from "@/lib/chat-history";
import { postToGymmi } from "@/lib/gymmi-client";
import {
  progressionTargets,
  type ProgressionTarget,
} from "@/lib/progression";
import type {
  ActiveWorkout,
  ChatMessage,
  ChatSession,
  SetLog,
  TemplateExercise,
  WorkoutDraft,
  WorkoutExercise,
} from "@/lib/types";
import {
  cn,
  completedSets,
  streakFor,
  totalSets,
  uid,
  workoutVolume,
} from "@/lib/utils";

type RawWorkout = {
  focus: string;
  exercises: Array<{ name: string; sets: number; reps: number }>;
};

const welcome: ChatMessage = {
  role: "assistant",
  content:
    "Ready when you are. Tell me what you want to train, how much time you have, or how your body feels today.",
};

function rawToDraft(raw: RawWorkout): WorkoutDraft {
  return {
    focus: raw.focus || "Workout",
    exercises: (raw.exercises || []).map((exercise) => ({
      name: exercise.name,
      sets: Array.from({ length: Math.max(1, Number(exercise.sets) || 1) }, () => ({
        weight: 0,
        reps: Math.max(1, Number(exercise.reps) || 8),
        completed: false,
        toFailure: false,
      })),
    })),
  };
}

function parseWorkout(content: string): WorkoutDraft | null {
  const match = content.match(/<workout>\s*([\s\S]*?)\s*<\/workout>/i);
  if (!match) return null;
  try {
    return rawToDraft(JSON.parse(match[1]) as RawWorkout);
  } catch {
    return null;
  }
}

function templateToTag(name: string, exercises: TemplateExercise[]) {
  return `<workout>\n${JSON.stringify({ focus: name, exercises })}\n</workout>`;
}

function formatTimer(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const ACTIVE_WORKOUT_KEY = "gymos-active-workout-v1";

function WorkoutCard({
  initial,
  initialSeconds = 0,
  isActive = true,
}: {
  initial: WorkoutDraft;
  initialSeconds?: number;
  isActive?: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [saved, setSaved] = useState(false);
  const [discarded, setDiscarded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<{
    id: string;
    title: string;
    image: string;
  } | null>(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState("");
  const [targets, setTargets] = useState<Record<number, ProgressionTarget>>({});
  const progressionLoaded = useRef(false);

  useEffect(() => {
    if (!isActive || saved || discarded) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [discarded, isActive, saved]);

  useEffect(() => {
    if (!isActive || saved || discarded) return;
    const active: ActiveWorkout = {
      draft,
      seconds,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(active));
    window.dispatchEvent(new Event("gymos:active-workout"));
  }, [discarded, draft, isActive, saved, seconds]);

  useEffect(() => {
    if (restSeconds <= 0) return;
    const timer = window.setInterval(
      () => setRestSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [restSeconds]);

  useEffect(() => {
    if (progressionLoaded.current) return;
    progressionLoaded.current = true;
    getData()
      .then((data) => {
        const suggestions = progressionTargets(initial.exercises, data.workouts);
        const byIndex: Record<number, ProgressionTarget> = {};
        initial.exercises.forEach((exercise, index) => {
          const target = suggestions.find(
            (item) => item.exercise.toLowerCase() === exercise.name.toLowerCase(),
          );
          if (target) byIndex[index] = target;
        });
        setTargets(byIndex);
        setDraft((current) => ({
          ...current,
          exercises: current.exercises.map((exercise, index) => {
            const target = byIndex[index];
            if (!target || exercise.sets.some((set) => set.weight > 0)) return exercise;
            return {
              ...exercise,
              sets: exercise.sets.map((set) => ({
                ...set,
                weight: target.weight,
                reps: target.reps,
              })),
            };
          }),
        }));
      })
      .catch(() => {
        // A workout must remain usable even if history is temporarily offline.
      });
  }, [initial.exercises]);

  const done = completedSets(draft.exercises);
  const all = totalSets(draft.exercises);
  const percent = all ? Math.round((done / all) * 100) : 0;
  const volume = workoutVolume({ exercises: draft.exercises });

  function updateExercise(index: number, update: Partial<WorkoutExercise>) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, i) =>
        i === index ? { ...exercise, ...update } : exercise,
      ),
    }));
  }

  function updateSet(exerciseIndex: number, setIndex: number, update: Partial<SetLog>) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, j) => (j === setIndex ? { ...set, ...update } : set)),
            }
          : exercise,
      ),
    }));
  }

  function addSet(exerciseIndex: number) {
    const exercise = draft.exercises[exerciseIndex];
    const previous = exercise.sets.at(-1);
    updateExercise(exerciseIndex, {
      sets: [
        ...exercise.sets,
        {
          weight: previous?.weight || 0,
          reps: previous?.reps || 8,
          completed: false,
          toFailure: false,
        },
      ],
    });
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    const exercise = draft.exercises[exerciseIndex];
    if (exercise.sets.length <= 1) return;
    updateExercise(exerciseIndex, {
      sets: exercise.sets.filter((_, index) => index !== setIndex),
    });
  }

  function toggleCompleted(exerciseIndex: number, setIndex: number) {
    const set = draft.exercises[exerciseIndex].sets[setIndex];
    updateSet(exerciseIndex, setIndex, { completed: !set.completed });
    if (!set.completed) setRestSeconds(90);
  }

  function discardWorkout() {
    if (!window.confirm("Discard this active workout and all unsaved set data?")) {
      return;
    }
    window.localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    window.dispatchEvent(new Event("gymos:active-workout"));
    setDiscarded(true);
    showToast({
      title: "Workout discarded",
      description: "The active draft was removed.",
      tone: "info",
    });
  }

  async function bookmark() {
    setError("");
    try {
      await saveTemplate({
        name: draft.focus,
        exercises: draft.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets.length,
          reps: exercise.sets[0]?.reps || 8,
        })),
      });
      setTemplateSaved(true);
      showToast({
        title: "Template saved",
        description: `${draft.focus} is ready in your Workouts library.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save the template.";
      setError(message);
      showToast({
        title: "Template not saved",
        description: message,
        tone: "error",
      });
    }
  }

  async function regenerate() {
    if (!editPrompt.trim()) return;
    setBusy(true);
    setError("");
    try {
      const reply = await postToGymmi([
        {
          role: "user",
          content: `Create a complete replacement workout. Requested change: ${editPrompt}`,
        },
      ]);
      const next = parseWorkout(reply);
      if (!next) throw new Error("Gymmi returned an invalid workout. Please try again.");
      setDraft(next);
      setSeconds(0);
      setSaved(false);
      setTemplateSaved(false);
      setShowEdit(false);
      setEditPrompt("");
      showToast({
        title: "Workout updated",
        description: "Gymmi replaced the session with your new request.",
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not replace this workout.";
      setError(message);
      showToast({
        title: "Workout not updated",
        description: message,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (
      done < all &&
      !window.confirm(
        `${all - done} sets are still incomplete. Finish and save anyway?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveWorkout({
        focus: draft.focus,
        exercises: draft.exercises,
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: seconds,
      });
      setSaved(true);
      setShowSummary(true);
      setRestSeconds(0);
      window.localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      window.dispatchEvent(new Event("gymos:active-workout"));
      try {
        const latestData = await getData();
        const weighted = latestData.workouts.some((workout) =>
          workout.exercises.some((exercise) =>
            exercise.sets.some((set) => set.completed && set.weight > 0),
          ),
        );
        const candidates = [
          {
            id: "first",
            title: "First Rep",
            image: "/assets/achievements/first-workout.png",
            unlocked: latestData.workouts.length >= 1,
          },
          {
            id: "strength",
            title: "Iron Signal",
            image: "/assets/achievements/strength-pr.png",
            unlocked: weighted,
          },
          {
            id: "streak",
            title: "Seven on Fire",
            image: "/assets/achievements/streak-7.png",
            unlocked: streakFor(latestData.workouts) >= 7,
          },
          {
            id: "consistency",
            title: "Built by Habit",
            image: "/assets/achievements/consistency.png",
            unlocked: latestData.workouts.length >= 10,
          },
        ];
        const seen: string[] = JSON.parse(
          window.localStorage.getItem("gymos-achievements-seen") || "[]",
        );
        const fresh = candidates.find(
          (candidate) => candidate.unlocked && !seen.includes(candidate.id),
        );
        if (fresh) {
          setUnlockedAchievement(fresh);
          window.localStorage.setItem(
            "gymos-achievements-seen",
            JSON.stringify([...seen, fresh.id]),
          );
        }
      } catch {
        // Achievement calculation must never block a saved workout.
      }
      showToast({
        title: "Workout complete",
        description: `${draft.focus} was saved to your progress.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your workout.";
      setError(message);
      showToast({
        title: "Workout not saved",
        description: message,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (discarded) {
    return (
      <div className="mt-4 rounded-2xl border border-zinc-800 bg-[#18181B] p-5 text-center">
        <div className="text-sm font-semibold text-zinc-300">Workout discarded</div>
        <p className="mt-1 text-xs text-zinc-600">
          Ask Gymmi for another session whenever you are ready.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-700 bg-[#151517] shadow-[0_24px_80px_rgba(0,0,0,.28)]">
      <div className="border-b border-zinc-800 bg-[radial-gradient(circle_at_90%_0%,rgba(249,115,22,.11),transparent_40%)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="eyebrow text-orange-500">Gymmi session</div>
            <input
              disabled={saved}
              value={draft.focus}
              onChange={(event) => setDraft((current) => ({ ...current, focus: event.target.value }))}
              className="mt-1 w-full border-0 bg-transparent text-xl font-bold tracking-[-0.03em] text-white outline-none disabled:opacity-100"
            />
          </div>
          <button
            disabled={saved || templateSaved}
            onClick={bookmark}
            title="Save as template"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-500 transition hover:text-white disabled:cursor-default",
              templateSaved && "border-green-500/30 bg-green-500/10 text-green-400",
            )}
          >
            {templateSaved ? <Check size={16} /> : <Bookmark size={16} />}
          </button>
          <button
            disabled={saved}
            onClick={() => setShowEdit((value) => !value)}
            title="Replace workout with Gymmi"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-500 transition hover:text-white disabled:opacity-40"
          >
            {showEdit ? <X size={16} /> : <Pencil size={16} />}
          </button>
          {isActive && (
            <button
              disabled={saved}
              onClick={discardWorkout}
              title="Discard workout"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-600 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {showEdit && !saved && (
          <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/6 p-3">
            <div className="mb-2 text-xs font-semibold text-orange-200">Tell Gymmi what you want instead</div>
            <div className="flex gap-2">
              <input
                value={editPrompt}
                onChange={(event) => setEditPrompt(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && regenerate()}
                placeholder="Make it shorter, replace bench…"
                className="input h-10 px-3 text-xs"
              />
              <button
                disabled={busy || !editPrompt.trim()}
                onClick={regenerate}
                className="primary-button grid h-10 w-11 shrink-0 place-items-center"
              >
                {busy ? <LoaderCircle size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            [Timer, "TIME", formatTimer(seconds)],
            [Weight, "VOLUME", `${Math.round(volume).toLocaleString()} kg`],
            [CheckCircle2, "SETS", `${done} / ${all}`],
          ].map(([Icon, label, value]) => {
            const StatIcon = Icon as typeof Timer;
            return (
              <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex items-center gap-1.5 text-zinc-600">
                  <StatIcon size={12} />
                  <span className="mono-font text-[8px] tracking-[.12em]">{String(label)}</span>
                </div>
                <div className="mono-font mt-2 truncate text-xs font-semibold text-zinc-300">{String(value)}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        {restSeconds > 0 && !saved && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/7 px-3 py-2.5">
            <Clock3 size={15} className="text-orange-500" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-orange-300">
                Rest timer
              </div>
              <div className="mono-font mt-0.5 text-xs text-zinc-300">
                {formatTimer(restSeconds)}
              </div>
            </div>
            <button
              onClick={() => setRestSeconds((value) => value + 30)}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-[9px] text-zinc-400"
            >
              +30s
            </button>
            <button
              onClick={() => setRestSeconds(0)}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-[9px] text-zinc-400"
            >
              Skip
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {draft.exercises.map((exercise, exerciseIndex) => {
          const exerciseDone = exercise.sets.filter((set) => set.completed).length;
          return (
            <div key={`${exercise.name}-${exerciseIndex}`} className="rounded-xl border border-zinc-800 bg-[#1b1b1f]">
              <div className="flex items-center gap-3 border-b border-zinc-800 px-3 py-3">
                <div className="grid size-7 place-items-center rounded-lg bg-orange-500/10 text-[10px] font-bold text-orange-400">
                  {String(exerciseIndex + 1).padStart(2, "0")}
                </div>
                <input
                  disabled={saved}
                  value={exercise.name}
                  onChange={(event) => updateExercise(exerciseIndex, { name: event.target.value })}
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-zinc-200 outline-none disabled:opacity-100"
                />
                <span className="mono-font text-[9px] text-zinc-600">
                  {exerciseDone}/{exercise.sets.length}
                </span>
                {!saved && draft.exercises.length > 1 && (
                  <button
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        exercises: current.exercises.filter((_, index) => index !== exerciseIndex),
                      }))
                    }
                    className="text-zinc-700 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {targets[exerciseIndex] && !saved && (
                <div className="border-b border-orange-500/10 bg-orange-500/5 px-3 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={13} className="text-orange-500" />
                      <span className="eyebrow text-[8px] text-orange-400">
                        Smart target
                      </span>
                    </div>
                    <div className="mono-font text-[10px] text-zinc-400 sm:ml-auto">
                      Last: {targets[exerciseIndex].previous} → Today:{" "}
                      {targets[exerciseIndex].weight
                        ? `${targets[exerciseIndex].weight} kg`
                        : "Bodyweight"}{" "}
                      × {targets[exerciseIndex].reps}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-zinc-600">
                    {targets[exerciseIndex].reason}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="min-w-[590px] px-3 py-2">
                  <div className="grid grid-cols-[32px_1.35fr_.7fr_58px_76px] gap-2 px-1 py-1">
                    {["SET", "WEIGHT", "REPS", "FAIL", "DONE"].map((heading) => (
                      <span key={heading} className="mono-font text-center text-[8px] tracking-[.1em] text-zinc-700">
                        {heading}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className={cn(
                          "grid grid-cols-[32px_1.35fr_.7fr_58px_76px] items-center gap-2 rounded-lg border border-transparent px-1 py-1.5 transition",
                          set.completed && "border-green-500/10 bg-green-500/5",
                        )}
                      >
                        <div className="mono-font text-center text-[10px] text-zinc-600">{setIndex + 1}</div>
                        <div className="flex h-9 items-center rounded-lg border border-zinc-700 bg-zinc-950">
                          <button
                            disabled={saved}
                            onClick={() => updateSet(exerciseIndex, setIndex, { weight: Math.max(0, set.weight - 2.5) })}
                            className="grid h-full w-9 place-items-center text-zinc-600 hover:text-white disabled:opacity-40"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            disabled={saved}
                            type="number"
                            min="0"
                            step="0.5"
                            value={set.weight}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, { weight: Number(event.target.value) })}
                            className="min-w-0 flex-1 border-0 bg-transparent text-center text-xs font-semibold text-zinc-200 outline-none"
                          />
                          <span className="text-[9px] text-zinc-700">kg</span>
                          <button
                            disabled={saved}
                            onClick={() => updateSet(exerciseIndex, setIndex, { weight: set.weight + 2.5 })}
                            className="grid h-full w-9 place-items-center text-zinc-600 hover:text-white disabled:opacity-40"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <input
                          disabled={saved}
                          type="number"
                          min="1"
                          value={set.reps}
                          onChange={(event) => updateSet(exerciseIndex, setIndex, { reps: Number(event.target.value) })}
                          className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 text-center text-xs font-semibold text-zinc-200 outline-none focus:border-orange-500"
                        />
                        <button
                          disabled={saved}
                          onClick={() => updateSet(exerciseIndex, setIndex, { toFailure: !set.toFailure })}
                          title="To failure"
                          className={cn(
                            "mx-auto grid size-8 place-items-center rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-700 transition",
                            set.toFailure && "border-red-500/30 bg-red-500/10 text-red-400",
                          )}
                        >
                          <Flame size={13} className={set.toFailure ? "fill-red-500/50" : ""} />
                        </button>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            disabled={saved}
                            onClick={() =>
                              toggleCompleted(exerciseIndex, setIndex)
                            }
                            title="Mark completed"
                            className={cn(
                              "grid size-8 place-items-center rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-700 transition",
                              set.completed && "border-green-500/30 bg-green-500/12 text-green-400",
                            )}
                          >
                            <Check size={14} />
                          </button>
                          {!saved && exercise.sets.length > 1 && (
                            <button
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              title="Remove set"
                              className="grid size-7 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {!saved && (
                <button
                  onClick={() => addSet(exerciseIndex)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-zinc-800 py-2.5 text-[10px] font-semibold text-zinc-600 transition hover:text-orange-400"
                >
                  <Plus size={12} /> Add set
                </button>
              )}
            </div>
          );
        })}

        {!saved && (
          <button
            onClick={() =>
              setDraft((current) => ({
                ...current,
                exercises: [
                  ...current.exercises,
                  {
                    name: "New Exercise",
                    sets: [{ weight: 0, reps: 10, completed: false, toFailure: false }],
                  },
                ],
              }))
            }
            className="ghost-button flex h-11 w-full items-center justify-center gap-2 border-dashed text-xs"
          >
            <CirclePlus size={15} /> Add exercise
          </button>
        )}
        {error && <ErrorState message={error} />}
        <button
          disabled={busy || saved || !isActive}
          onClick={finish}
          className={cn(
            "primary-button sticky bottom-1 z-10 flex h-12 w-full items-center justify-center gap-2 text-sm shadow-[0_12px_30px_rgba(0,0,0,.35)]",
            saved && "!border !border-green-500/30 !bg-green-500/12 !text-green-400",
          )}
        >
          {busy ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={17} />
          ) : (
            <Dumbbell size={17} />
          )}
          {!isActive
            ? "Archived workout plan"
            : saved
              ? "Workout saved"
              : busy
                ? "Saving…"
                : "Finish workout"}
        </button>
      </div>
      {showSummary && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-md overflow-hidden p-6 text-center [animation:achievement-pop_.45s_cubic-bezier(.2,.9,.2,1.2)_both]">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-green-500/25 bg-green-500/10 text-green-400">
              <CheckCircle2 size={26} />
            </div>
            <div className="eyebrow mt-5 text-green-400">Session complete</div>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em]">
              {draft.focus}
            </h3>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["TIME", formatTimer(seconds)],
                ["SETS", `${done}/${all}`],
                ["VOLUME", `${Math.round(volume)}kg`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
                >
                  <div className="eyebrow text-[8px]">{label}</div>
                  <div className="mono-font mt-2 text-xs font-semibold">
                    {value}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowSummary(false);
                if (unlockedAchievement) setShowAchievement(true);
              }}
              className="primary-button mt-5 h-11 w-full text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
      {showAchievement && unlockedAchievement && (
        <div className="fixed inset-0 z-[95] grid place-items-center overflow-hidden bg-black/85 p-4 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(249,115,22,.18),transparent_42%)]" />
          <div className="surface achievement-card relative w-full max-w-md overflow-hidden border-orange-500/30 p-7 text-center">
            <div className="achievement-shine pointer-events-none absolute inset-0" />
            <div className="eyebrow text-green-400">Achievement unlocked</div>
            <div className="achievement-float relative mx-auto mt-3 aspect-square w-52">
              <Image
                src={unlockedAchievement.image}
                alt={`${unlockedAchievement.title} achievement`}
                fill
                sizes="208px"
                className="object-contain"
              />
            </div>
            <h3 className="mt-2 text-3xl font-bold tracking-[-0.05em]">
              {unlockedAchievement.title}
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              Your training earned this. It is now in Achievements.
            </p>
            <button
              onClick={() => setShowAchievement(false)}
              className="primary-button mt-6 h-11 w-full text-sm"
            >
              Claim achievement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GymmiChat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(uid);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [resumedWorkout, setResumedWorkout] = useState<ActiveWorkout | null>(
    null,
  );
  const handled = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function loadActiveWorkout() {
      try {
        const raw = window.localStorage.getItem(ACTIVE_WORKOUT_KEY);
        setActiveWorkout(raw ? (JSON.parse(raw) as ActiveWorkout) : null);
      } catch {
        setActiveWorkout(null);
      }
    }
    const initial = window.setTimeout(() => {
      loadActiveWorkout();
      listChatSessions()
        .then(setSessions)
        .catch(() => setSessions([]));
    }, 0);
    window.addEventListener("gymos:active-workout", loadActiveWorkout);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("gymos:active-workout", loadActiveWorkout);
    };
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = window.setTimeout(() => {
      saveChatSession(sessionId, messages)
        .then(() => listChatSessions())
        .then(setSessions)
        .catch(() => {});
    }, 700);
    return () => window.clearTimeout(timer);
  }, [messages, sessionId]);

  useEffect(() => {
    function warnOnClose(event: BeforeUnloadEvent) {
      if (!activeWorkout) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnOnClose);
    return () => window.removeEventListener("beforeunload", warnOnClose);
  }, [activeWorkout]);

  function newChat() {
    setSessionId(uid());
    setMessages([welcome]);
    setError("");
    setResumedWorkout(null);
    setHistoryLoaded(false);
    setShowHistory(false);
  }

  function openChat(session: ChatSession) {
    setSessionId(session.id);
    setMessages(session.messages);
    setError("");
    setResumedWorkout(null);
    setHistoryLoaded(true);
    setShowHistory(false);
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: clean }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const reply = await postToGymmi(nextMessages);
      if (parseWorkout(reply)) setHistoryLoaded(false);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gymmi could not respond.";
      setError(message);
      showToast({
        title: "Gymmi is unavailable",
        description: message,
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = searchParams.get("q");
    const templateId = searchParams.get("template");
    const key = q ? `q:${q}` : templateId ? `template:${templateId}` : "";
    if (!key || handled.current === key) return;
    handled.current = key;
    router.replace("/dashboard/gymmi");

    if (q) {
      window.setTimeout(() => send(q), 0);
      return;
    }
    if (templateId) {
      getTemplate(templateId)
        .then((template) => {
          if (!template) throw new Error("That template no longer exists.");
          setMessages([
            welcome,
            { role: "user", content: `Start my ${template.name} template.` },
            { role: "assistant", content: templateToTag(template.name, template.exercises) },
          ]);
        })
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : "Could not open that template.";
          setError(message);
          showToast({
            title: "Template not opened",
            description: message,
            tone: "error",
          });
        });
    }
    // URL intent should only run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const latestWorkoutIndex = messages.reduce(
    (latest, message, index) =>
      message.role === "assistant" && parseWorkout(message.content)
        ? index
        : latest,
    -1,
  );

  return (
    <div className="relative mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl flex-col md:h-[calc(100vh-4.5rem)]">
      <header className="mb-5 flex items-center gap-3">
        <div className="relative grid size-11 place-items-center rounded-2xl bg-orange-500 text-black shadow-[0_0_28px_rgba(249,115,22,.18)]">
          <Bot size={23} />
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#09090b] bg-green-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em]">Gymmi</h1>
          <p className="mt-0.5 text-xs text-zinc-600">Your AI training partner · Online</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={newChat}
            title="New conversation"
            className="ghost-button grid size-9 place-items-center"
          >
            <MessageSquarePlus size={16} />
          </button>
          <button
            onClick={() => setShowHistory((current) => !current)}
            className="ghost-button flex h-9 items-center gap-2 px-3 text-[10px]"
          >
            <History size={14} /> History
          </button>
        </div>
      </header>

      {showHistory && (
        <div className="surface absolute right-0 top-14 z-40 w-full max-w-sm overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <div className="eyebrow">Gymmi memory</div>
              <div className="mt-1 text-sm font-semibold">Conversation history</div>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="grid size-8 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-800"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {sessions.length ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex items-center gap-2 rounded-xl p-2 hover:bg-zinc-900"
                >
                  <button
                    onClick={() => openChat(session)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-xs font-semibold text-zinc-300">
                      {session.title}
                    </div>
                    <div className="mt-1 text-[9px] text-zinc-700">
                      {new Date(session.updated_at).toLocaleDateString()} ·{" "}
                      {session.messages.length} messages
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await deleteChatSession(session.id);
                      setSessions(await listChatSessions());
                      if (session.id === sessionId) newChat();
                      showToast({
                        title: "Conversation deleted",
                        description: "Gymmi history was updated.",
                        tone: "success",
                      });
                    }}
                    className="grid size-8 place-items-center rounded-lg text-zinc-700 opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs leading-5 text-zinc-600">
                Your Gymmi conversations will appear here automatically.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="surface min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="space-y-5">
          {activeWorkout && !resumedWorkout && (
            <div className="flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/7 p-4">
              <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                <Dumbbell size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-zinc-200">
                  Active workout found
                </div>
                <div className="mt-1 truncate text-[10px] text-zinc-600">
                  {activeWorkout.draft.focus} ·{" "}
                  {formatTimer(activeWorkout.seconds)}
                </div>
              </div>
              <button
                onClick={() => setResumedWorkout(activeWorkout)}
                className="primary-button h-9 px-3 text-[10px]"
              >
                Resume
              </button>
            </div>
          )}
          {resumedWorkout && (
            <div className="flex gap-3">
              <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                <Bot size={16} />
              </div>
              <div className="w-full max-w-[760px]">
                <WorkoutCard
                  initial={resumedWorkout.draft}
                  initialSeconds={resumedWorkout.seconds}
                />
              </div>
            </div>
          )}
          {messages.map((message, index) => {
            const workout = message.role === "assistant" ? parseWorkout(message.content) : null;
            return (
              <div
                key={`${index}-${message.content.slice(0, 20)}`}
                className={cn("flex gap-3", message.role === "user" && "justify-end")}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Bot size={16} />
                  </div>
                )}
                <div className={cn("max-w-[88%] sm:max-w-[82%]", workout && "w-full max-w-[760px]")}>
                  {workout ? (
                    <WorkoutCard
                      initial={workout}
                      isActive={
                        !resumedWorkout &&
                        !historyLoaded &&
                        index === latestWorkoutIndex
                      }
                    />
                  ) : (
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-6",
                        message.role === "assistant"
                          ? "rounded-tl-sm border border-zinc-800 bg-zinc-900 text-zinc-300"
                          : "rounded-tr-sm bg-orange-500 font-medium text-[#1d0b02]",
                      )}
                    >
                      {message.content}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                    <UserRound size={15} />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <div className="grid size-8 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900 px-4 py-3">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-1.5 rounded-full bg-zinc-500"
                    style={{ animation: `pulse-soft 1s ${dot * 160}ms infinite` }}
                  />
                ))}
              </div>
            </div>
          )}
          {error && <ErrorState message={error} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="pt-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="relative"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask Gymmi or describe today’s workout…"
            className="input min-h-14 resize-none py-4 pl-5 pr-16 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-xl bg-orange-500 text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </form>
        <p className="mt-2 text-center text-[9px] text-zinc-700">
          Gymmi can make mistakes. Use good judgment and stop if something hurts.
        </p>
      </div>
    </div>
  );
}

export default function GymmiPage() {
  return (
    <Suspense fallback={<div className="surface min-h-[70vh]" />}>
      <GymmiChat />
    </Suspense>
  );
}
