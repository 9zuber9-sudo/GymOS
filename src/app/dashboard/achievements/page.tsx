"use client";

import Image from "next/image";
import { LockKeyhole, Sparkles, Trophy } from "lucide-react";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { useGymData } from "@/hooks/use-gym-data";
import { streakFor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const { data, loading, error } = useGymData();
  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState label="Polishing your trophies" />;

  const streak = streakFor(data.workouts);
  const completedSets = data.workouts.flatMap((workout) =>
    workout.exercises.flatMap((exercise) =>
      exercise.sets.filter((set) => set.completed),
    ),
  );
  const hasWeightedSet = completedSets.some((set) => set.weight > 0);
  const achievements = [
    {
      id: "first",
      title: "First Rep",
      description: "Complete your first GymOS workout.",
      image: "/assets/achievements/first-workout.png",
      unlocked: data.workouts.length >= 1,
      progress: Math.min(1, data.workouts.length),
      target: 1,
      label: `${Math.min(1, data.workouts.length)} / 1 workout`,
    },
    {
      id: "streak",
      title: "Seven on Fire",
      description: "Train on seven consecutive days.",
      image: "/assets/achievements/streak-7.png",
      unlocked: streak >= 7,
      progress: Math.min(7, streak),
      target: 7,
      label: `${Math.min(7, streak)} / 7 days`,
    },
    {
      id: "strength",
      title: "Iron Signal",
      description: "Record your first completed weighted set.",
      image: "/assets/achievements/strength-pr.png",
      unlocked: hasWeightedSet,
      progress: hasWeightedSet ? 1 : 0,
      target: 1,
      label: hasWeightedSet ? "Record established" : "No weighted set yet",
    },
    {
      id: "consistency",
      title: "Built by Habit",
      description: "Complete ten total workouts.",
      image: "/assets/achievements/consistency.png",
      unlocked: data.workouts.length >= 10,
      progress: Math.min(10, data.workouts.length),
      target: 10,
      label: `${Math.min(10, data.workouts.length)} / 10 workouts`,
    },
  ];
  const unlocked = achievements.filter((item) => item.unlocked).length;

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Earned, never given"
        title="Achievements"
        description="Milestones unlock from your real training data. No fake badges and no manual claiming."
        action={
          <div className="flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/8 px-4 py-2">
            <Trophy size={15} className="text-orange-500" />
            <span className="mono-font text-xs font-bold text-orange-300">
              {unlocked}/{achievements.length} UNLOCKED
            </span>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {achievements.map((achievement, index) => (
          <article
            key={achievement.id}
            className={cn(
              "surface achievement-card group relative overflow-hidden p-5",
              achievement.unlocked
                ? "border-orange-500/25"
                : "grayscale-[.85]",
            )}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {achievement.unlocked && (
              <>
                <div className="achievement-shine pointer-events-none absolute inset-0" />
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-green-500/25 bg-green-500/10 px-2 py-1 text-[8px] font-bold text-green-400">
                  <Sparkles size={9} /> UNLOCKED
                </div>
              </>
            )}
            {!achievement.unlocked && (
              <div className="absolute right-3 top-3 grid size-8 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-600">
                <LockKeyhole size={13} />
              </div>
            )}
            <div
              className={cn(
                "relative mx-auto mt-3 aspect-square w-40 transition duration-500 group-hover:scale-105",
                achievement.unlocked && "achievement-float",
                !achievement.unlocked && "opacity-35",
              )}
            >
              <Image
                src={achievement.image}
                alt={`${achievement.title} achievement badge`}
                fill
                sizes="160px"
                className="object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <div className="eyebrow text-orange-500">GymOS medal</div>
              <h2 className="mt-2 text-lg font-bold">{achievement.title}</h2>
              <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-600">
                {achievement.description}
              </p>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[9px]">
                <span className="text-zinc-600">{achievement.label}</span>
                <span className="mono-font text-zinc-500">
                  {Math.round(
                    (achievement.progress / achievement.target) * 100,
                  )}
                  %
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    achievement.unlocked ? "bg-green-500" : "bg-orange-500",
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (achievement.progress / achievement.target) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
