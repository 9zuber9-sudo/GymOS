"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Search,
  ShieldAlert,
  Target,
  X,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { useGymData } from "@/hooks/use-gym-data";
import {
  exerciseCatalog,
  guideForExercise,
  type ExerciseGuide,
} from "@/lib/exercise-catalog";

type ExerciseRow = {
  name: string;
  sessions: number;
  best: number;
  reps: number;
  guide?: ExerciseGuide;
};

export default function ExercisesPage() {
  const { data, loading, error } = useGymData();
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState("All");
  const [selected, setSelected] = useState<ExerciseGuide | null>(null);

  const exercises = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, ExerciseRow>();
    exerciseCatalog.forEach((guide) => {
      map.set(guide.name.toLowerCase(), {
        name: guide.name,
        sessions: 0,
        best: 0,
        reps: 0,
        guide,
      });
    });
    data.workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const key = exercise.name.toLowerCase();
        const top = [...exercise.sets]
          .filter((set) => set.completed)
          .sort((a, b) => b.weight - a.weight)[0];
        const existing = map.get(key);
        const guide = existing?.guide || guideForExercise(exercise.name);
        if (!existing) {
          map.set(key, {
            name: exercise.name,
            sessions: 1,
            best: top?.weight || 0,
            reps: top?.reps || 0,
            guide,
          });
        } else {
          existing.sessions += 1;
          if (top && top.weight > existing.best) {
            existing.best = top.weight;
            existing.reps = top.reps;
          }
        }
      });
    });
    return Array.from(map.values())
      .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
      .filter((item) => equipment === "All" || item.guide?.equipment.includes(equipment))
      .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
  }, [data, equipment, search]);

  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState label="Building your exercise library" />;

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Technique before load"
        title="Exercises"
        description="Your real exercise history plus concise setup, common mistakes and equipment-friendly substitutions."
        action={
          <Link href="/dashboard/gymmi" className="primary-button flex h-10 items-center gap-2 px-4 text-xs">
            Plan a workout <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an exercise…" className="input h-11 pl-10 pr-3 text-xs" />
          </div>
          <select value={equipment} onChange={(event) => setEquipment(event.target.value)} className="input h-11 px-3 text-xs sm:w-48">
            {["All", "Bodyweight", "Dumbbell", "Barbell", "Cable"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        {exercises.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {exercises.map((exercise) => (
              <button
                key={exercise.name}
                onClick={() => exercise.guide && setSelected(exercise.guide)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4 text-left transition hover:border-orange-500/25 hover:bg-orange-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-orange-500"><Dumbbell size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-300">{exercise.name}</div>
                    <div className="mt-1 text-[10px] text-zinc-600">{exercise.guide?.muscles.join(" · ") || "From your workout history"}</div>
                  </div>
                  <ArrowRight size={13} className="text-zinc-700" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-zinc-800/80 p-2.5">
                    <div className="eyebrow text-[7px]">Sessions</div>
                    <div className="mono-font mt-1 text-xs text-zinc-400">{exercise.sessions}</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800/80 p-2.5">
                    <div className="eyebrow text-[7px]">Best set</div>
                    <div className="mono-font mt-1 text-xs text-zinc-400">{exercise.best ? `${exercise.best}kg × ${exercise.reps}` : "Not logged"}</div>
                  </div>
                </div>
                {!exercise.guide && <div className="mt-3 text-[9px] text-zinc-700">Detailed guide coming as the library grows.</div>}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Dumbbell} title="No exercises found" text="Try another search or equipment filter." />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[85] flex justify-end bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-[#111113] p-5 sm:p-7" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-orange-500 text-black"><Dumbbell size={20} /></div>
              <div className="min-w-0 flex-1">
                <div className="eyebrow text-orange-500">Exercise guide</div>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em]">{selected.name}</h2>
                <p className="mt-1 text-xs text-zinc-600">{selected.equipment}</p>
              </div>
              <button onClick={() => setSelected(null)} className="grid size-9 place-items-center rounded-xl border border-zinc-800 text-zinc-500"><X size={15} /></button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selected.muscles.map((muscle) => <span key={muscle} className="rounded-full border border-orange-500/20 bg-orange-500/8 px-3 py-1.5 text-[10px] font-semibold text-orange-300">{muscle}</span>)}
            </div>

            <section className="surface mt-5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold"><Target size={16} className="text-orange-500" /> How to perform it</div>
              <ol className="mt-4 space-y-3">
                {selected.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-xs leading-5 text-zinc-400">
                    <span className="mono-font grid size-6 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-[9px] text-orange-400">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            <section className="surface mt-4 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert size={16} className="text-orange-500" /> Common mistakes</div>
              <div className="mt-4 space-y-2">
                {selected.mistakes.map((mistake) => <div key={mistake} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-xs text-zinc-500"><X size={13} className="text-red-400" /> {mistake}</div>)}
              </div>
            </section>

            <section className="surface mt-4 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-green-400" /> Alternatives</div>
              <div className="mt-4 grid gap-2">
                {selected.alternatives.map((alternative) => (
                  <Link key={alternative} href={`/dashboard/gymmi?q=${encodeURIComponent(`Replace ${selected.name} with ${alternative} in a suitable workout.`)}`} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-3 text-xs text-zinc-400 hover:border-orange-500/25">
                    {alternative}<ArrowRight size={13} className="text-orange-500" />
                  </Link>
                ))}
              </div>
            </section>
            <p className="mt-5 text-[10px] leading-5 text-zinc-700">Stop if a movement causes sharp or unusual pain. This guide is general education, not medical assessment.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
