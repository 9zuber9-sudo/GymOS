"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Dumbbell,
  ListPlus,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { showToast } from "@/components/toast-provider";
import { useGymData } from "@/hooks/use-gym-data";
import { deleteTemplate, saveTemplate, updateTemplate } from "@/lib/data";
import type { TemplateExercise, WorkoutTemplate } from "@/lib/types";
import { cn, muscleOf } from "@/lib/utils";

const emptyExercise = (): TemplateExercise => ({ name: "", sets: 3, reps: 10 });

function BodyMap({ exercises }: { exercises: TemplateExercise[] }) {
  const active = new Set<ReturnType<typeof muscleOf>>(
    exercises.map((exercise) => muscleOf(exercise.name)),
  );
  const fill = (muscle: ReturnType<typeof muscleOf>) =>
    active.has(muscle) ? "#f97316" : "#3f3f46";
  return (
    <div className="relative mx-auto flex max-w-[330px] items-center justify-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-950/45 px-5 py-6">
      <svg viewBox="0 0 100 250" className="h-64 w-28" aria-label="Front muscle view">
        <text x="50" y="10" textAnchor="middle" fill="#52525b" fontSize="7">FRONT</text>
        <circle cx="50" cy="29" r="13" fill="#52525b" />
        <rect x="43" y="41" width="14" height="10" rx="5" fill="#52525b" />
        <path d="M34 50 Q50 43 66 50 L72 100 Q63 115 50 116 Q37 115 28 100Z" fill="#27272a" />
        <path d="M35 52 Q43 48 49 53 L48 75 Q39 73 33 66Z" fill={fill("chest")} />
        <path d="M65 52 Q57 48 51 53 L52 75 Q61 73 67 66Z" fill={fill("chest")} />
        <path d="M34 49 Q26 51 23 60 L29 70 L37 56Z" fill={fill("shoulders")} />
        <path d="M66 49 Q74 51 77 60 L71 70 L63 56Z" fill={fill("shoulders")} />
        <path d="M25 62 L15 106 Q15 116 22 116 L34 70Z" fill={fill("arms")} />
        <path d="M75 62 L85 106 Q85 116 78 116 L66 70Z" fill={fill("arms")} />
        <path d="M42 77 L58 77 L62 108 Q50 116 38 108Z" fill={fill("core")} />
        <path d="M36 111 L49 116 L47 175 L28 175Z" fill={fill("legs")} />
        <path d="M64 111 L51 116 L53 175 L72 175Z" fill={fill("legs")} />
        <path d="M28 175 L47 175 L43 232 L31 232Z" fill={fill("legs")} />
        <path d="M72 175 L53 175 L57 232 L69 232Z" fill={fill("legs")} />
      </svg>
      <svg viewBox="0 0 100 250" className="h-64 w-28" aria-label="Back muscle view">
        <text x="50" y="10" textAnchor="middle" fill="#52525b" fontSize="7">BACK</text>
        <circle cx="50" cy="29" r="13" fill="#52525b" />
        <rect x="43" y="41" width="14" height="10" rx="5" fill="#52525b" />
        <path d="M34 50 Q50 43 66 50 L72 100 Q63 115 50 116 Q37 115 28 100Z" fill="#27272a" />
        <path d="M34 50 Q50 45 66 50 L64 91 Q58 105 50 110 Q42 105 36 91Z" fill={fill("back")} />
        <path d="M34 49 Q26 51 23 60 L29 70 L37 56Z" fill={fill("shoulders")} />
        <path d="M66 49 Q74 51 77 60 L71 70 L63 56Z" fill={fill("shoulders")} />
        <path d="M25 62 L15 106 Q15 116 22 116 L34 70Z" fill={fill("arms")} />
        <path d="M75 62 L85 106 Q85 116 78 116 L66 70Z" fill={fill("arms")} />
        <path d="M36 111 L49 116 L47 175 L28 175Z" fill={fill("legs")} />
        <path d="M64 111 L51 116 L53 175 L72 175Z" fill={fill("legs")} />
        <path d="M28 175 L47 175 L43 232 L31 232Z" fill={fill("legs")} />
        <path d="M72 175 L53 175 L57 232 L69 232Z" fill={fill("legs")} />
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-zinc-700">
        Orange = primary focus
      </div>
    </div>
  );
}

function ExerciseEditor({
  exercises,
  onChange,
}: {
  exercises: TemplateExercise[];
  onChange: (exercises: TemplateExercise[]) => void;
}) {
  function update(index: number, update: Partial<TemplateExercise>) {
    onChange(exercises.map((exercise, i) => (i === index ? { ...exercise, ...update } : exercise)));
  }
  return (
    <div className="space-y-2">
      {exercises.map((exercise, index) => (
        <div key={index} className="grid grid-cols-[1fr_58px_58px_32px] items-center gap-2">
          <input
            value={exercise.name}
            onChange={(event) => update(index, { name: event.target.value })}
            placeholder="Exercise name"
            className="input h-10 px-3 text-xs"
          />
          <input
            type="number"
            min="1"
            value={exercise.sets}
            onChange={(event) => update(index, { sets: Number(event.target.value) })}
            title="Sets"
            className="input h-10 px-2 text-center text-xs"
          />
          <input
            type="number"
            min="1"
            value={exercise.reps}
            onChange={(event) => update(index, { reps: Number(event.target.value) })}
            title="Reps"
            className="input h-10 px-2 text-center text-xs"
          />
          <button
            disabled={exercises.length === 1}
            onClick={() => onChange(exercises.filter((_, i) => i !== index))}
            className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...exercises, emptyExercise()])}
        className="ghost-button flex h-9 w-full items-center justify-center gap-2 border-dashed text-[10px]"
      >
        <Plus size={12} /> Add exercise
      </button>
    </div>
  );
}

export default function WorkoutsPage() {
  const { data, loading, error, refresh } = useGymData();
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<TemplateExercise[]>([emptyExercise()]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const templates = useMemo(
    () =>
      data?.templates.filter((template) =>
        template.name.toLowerCase().includes(search.toLowerCase()),
      ) || [],
    [data, search],
  );
  const selected =
    data?.templates.find((template) => template.id === selectedId) ||
    templates[0] ||
    data?.templates[0];

  function resetForm(template?: WorkoutTemplate) {
    setName(template?.name || "");
    setExercises(template?.exercises.map((exercise) => ({ ...exercise })) || [emptyExercise()]);
  }

  async function createTemplate() {
    if (!name.trim() || exercises.some((exercise) => !exercise.name.trim())) return;
    setBusy(true);
    setActionError("");
    try {
      const created = await saveTemplate({
        name: name.trim(),
        exercises: exercises.map((exercise) => ({ ...exercise, name: exercise.name.trim() })),
      });
      await refresh();
      setSelectedId(created.id);
      setCreating(false);
      resetForm();
      showToast({
        title: "Template created",
        description: `${created.name} is ready to start.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create the template.";
      setActionError(message);
      showToast({
        title: "Template not created",
        description: message,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveChanges() {
    if (!selected || !name.trim()) return;
    setBusy(true);
    try {
      await updateTemplate(selected.id, { name: name.trim(), exercises });
      await refresh();
      setEditing(false);
      showToast({
        title: "Template updated",
        description: `${name.trim()} changes were saved.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update the template.";
      setActionError(message);
      showToast({
        title: "Changes not saved",
        description: message,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState label="Loading your workout library" />;

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Reusable routines"
        title="Workouts"
        description="Save the plans that work. Start any template inside Gymmi and adjust every set as you train."
        action={
          <button
            onClick={() => {
              setCreating((value) => !value);
              setEditing(false);
              resetForm();
            }}
            className="primary-button flex h-10 items-center justify-center gap-2 px-4 text-xs"
          >
            {creating ? <X size={15} /> : <Plus size={15} />}
            {creating ? "Cancel" : "New template"}
          </button>
        }
      />

      {actionError && <div className="mb-4"><ErrorState message={actionError} /></div>}

      {creating && (
        <section className="surface mb-5 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ListPlus size={16} className="text-orange-500" />
            <h2 className="text-sm font-semibold">Create a routine</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[.7fr_1.3fr]">
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Template name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Push Strength"
                className="input h-11 px-3 text-sm"
              />
            </label>
            <div>
              <div className="mb-2 grid grid-cols-[1fr_58px_58px_32px] gap-2 px-1">
                <span className="eyebrow text-[8px]">Exercise</span>
                <span className="eyebrow text-center text-[8px]">Sets</span>
                <span className="eyebrow text-center text-[8px]">Reps</span>
              </div>
              <ExerciseEditor exercises={exercises} onChange={setExercises} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={busy || !name.trim() || exercises.some((exercise) => !exercise.name.trim())}
              onClick={createTemplate}
              className="primary-button flex h-10 items-center gap-2 px-5 text-xs"
            >
              <Save size={14} /> {busy ? "Saving…" : "Save template"}
            </button>
          </div>
        </section>
      )}

      <div className="grid min-h-[620px] gap-5 lg:grid-cols-[330px_1fr]">
        <section className="surface overflow-hidden">
          <div className="border-b border-zinc-800 p-4">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates…"
                className="input h-10 pl-10 pr-3 text-xs"
              />
            </div>
          </div>
          {templates.length ? (
            <div className="divide-y divide-zinc-800">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedId(template.id);
                    setEditing(false);
                  }}
                  className={cn(
                    "group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-900/60",
                    selected?.id === template.id && "bg-orange-500/7",
                  )}
                >
                  <div
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600",
                      selected?.id === template.id && "border-orange-500/20 bg-orange-500/10 text-orange-500",
                    )}
                  >
                    <Dumbbell size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-300">{template.name}</div>
                    <div className="mt-1 text-[10px] text-zinc-700">
                      {template.exercises.length} exercises · {template.exercises.reduce((sum, ex) => sum + ex.sets, 0)} sets
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-700" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Dumbbell} title="No templates found" text="Create a routine or save one from Gymmi." />
          )}
        </section>

        <section className="surface overflow-hidden">
          {selected ? (
            <>
              <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                {editing ? (
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="input h-11 max-w-sm px-3 text-lg font-semibold"
                  />
                ) : (
                  <div>
                    <div className="eyebrow">Selected template</div>
                    <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">{selected.name}</h2>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={() => setEditing(false)}
                        className="ghost-button grid size-10 place-items-center"
                        title="Cancel"
                      >
                        <X size={15} />
                      </button>
                      <button onClick={saveChanges} className="primary-button flex h-10 items-center gap-2 px-4 text-xs">
                        <Save size={14} /> Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          resetForm(selected);
                          setEditing(true);
                        }}
                        className="ghost-button grid size-10 place-items-center"
                        title="Edit template"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete "${selected.name}"?`)) return;
                          try {
                            const deletedName = selected.name;
                            await deleteTemplate(selected.id);
                            setSelectedId("");
                            await refresh();
                            showToast({
                              title: "Template deleted",
                              description: `${deletedName} was removed.`,
                              tone: "success",
                            });
                          } catch (err) {
                            showToast({
                              title: "Template not deleted",
                              description:
                                err instanceof Error ? err.message : "Please try again.",
                              tone: "error",
                            });
                          }
                        }}
                        className="ghost-button grid size-10 place-items-center text-zinc-600 hover:!border-red-500/30 hover:!text-red-400"
                        title="Delete template"
                      >
                        <Trash2 size={15} />
                      </button>
                      <Link
                        href={`/dashboard/gymmi?template=${selected.id}`}
                        className="primary-button flex h-10 items-center gap-2 px-4 text-xs"
                      >
                        <Play size={14} className="fill-black" /> Start
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="p-5">
                  <div className="mb-2 grid grid-cols-[1fr_58px_58px_32px] gap-2 px-1">
                    <span className="eyebrow text-[8px]">Exercise</span>
                    <span className="eyebrow text-center text-[8px]">Sets</span>
                    <span className="eyebrow text-center text-[8px]">Reps</span>
                  </div>
                  <ExerciseEditor exercises={exercises} onChange={setExercises} />
                </div>
              ) : (
                <div className="grid gap-6 p-5 xl:grid-cols-[.8fr_1.2fr]">
                  <div>
                    <div className="eyebrow mb-3">Muscle focus</div>
                    <BodyMap exercises={selected.exercises} />
                  </div>
                  <div>
                    <div className="eyebrow mb-3">Exercise plan</div>
                    <div className="overflow-hidden rounded-2xl border border-zinc-800">
                      <div className="grid grid-cols-[1fr_70px_70px] bg-zinc-950/50 px-4 py-3">
                        {["EXERCISE", "SETS", "REPS"].map((heading) => (
                          <span key={heading} className="eyebrow text-[8px]">{heading}</span>
                        ))}
                      </div>
                      {selected.exercises.map((exercise, index) => (
                        <div
                          key={`${exercise.name}-${index}`}
                          className="grid grid-cols-[1fr_70px_70px] items-center border-t border-zinc-800 px-4 py-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="mono-font text-[9px] text-zinc-700">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="truncate text-xs font-semibold text-zinc-300">{exercise.name}</span>
                          </div>
                          <span className="mono-font text-xs text-zinc-500">{exercise.sets}</span>
                          <span className="mono-font text-xs text-zinc-500">{exercise.reps}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-orange-500/15 bg-orange-500/5 px-4 py-3 text-xs leading-5 text-orange-200/60">
                      Starting opens this routine as a live, fully editable workout card inside Gymmi.
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="Build your first template"
              text="Templates turn good sessions into repeatable training."
            />
          )}
        </section>
      </div>
    </div>
  );
}
