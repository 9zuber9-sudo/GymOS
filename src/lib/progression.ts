import type { Workout, WorkoutExercise } from "./types";

export type ProgressionTarget = {
  exercise: string;
  previous: string;
  weight: number;
  reps: number;
  reason: string;
  direction: "increase" | "repeat" | "reduce";
};

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function weightStep(name: string) {
  return /squat|deadlift|leg press|hip thrust/i.test(name) ? 5 : 2.5;
}

export function progressionForExercise(
  exercise: WorkoutExercise,
  workouts: Workout[],
): ProgressionTarget | null {
  const previousExercise = workouts
    .flatMap((workout) => workout.exercises)
    .find((item) => normalized(item.name) === normalized(exercise.name));
  if (!previousExercise) return null;

  const completed = previousExercise.sets.filter((set) => set.completed);
  if (!completed.length) return null;

  const workingWeight = Math.max(...completed.map((set) => Number(set.weight) || 0));
  const setsAtWeight = completed.filter((set) => set.weight === workingWeight);
  const minReps = Math.min(...setsAtWeight.map((set) => set.reps));
  const plannedReps = exercise.sets[0]?.reps || minReps;
  const allSetsCompleted = completed.length === previousExercise.sets.length;
  const failureSets = completed.filter((set) => set.toFailure).length;
  const previous = `${workingWeight || "BW"} kg × ${setsAtWeight.map((set) => set.reps).join(", ")}`;

  if (workingWeight <= 0) {
    return {
      exercise: exercise.name,
      previous: previous.replace("BW kg", "Bodyweight"),
      weight: 0,
      reps: allSetsCompleted ? Math.max(plannedReps, minReps + 1) : plannedReps,
      reason: allSetsCompleted
        ? "All bodyweight sets were completed, so add one controlled rep."
        : "Repeat the target and complete every clean set first.",
      direction: allSetsCompleted ? "increase" : "repeat",
    };
  }

  if (!allSetsCompleted || failureSets >= Math.ceil(completed.length / 2)) {
    const reduce = failureSets >= Math.ceil(completed.length / 2);
    return {
      exercise: exercise.name,
      previous,
      weight: reduce ? Math.max(0, workingWeight - weightStep(exercise.name)) : workingWeight,
      reps: plannedReps,
      reason: reduce
        ? "Several sets reached failure; use a small deload and rebuild clean reps."
        : "Some sets were incomplete, so own this load before increasing it.",
      direction: reduce ? "reduce" : "repeat",
    };
  }

  return {
    exercise: exercise.name,
    previous,
    weight: workingWeight + weightStep(exercise.name),
    reps: plannedReps,
    reason: "Every planned set was completed; take the smallest sensible load increase.",
    direction: "increase",
  };
}

export function progressionTargets(exercises: WorkoutExercise[], workouts: Workout[]) {
  return exercises
    .map((exercise) => progressionForExercise(exercise, workouts))
    .filter((target): target is ProgressionTarget => Boolean(target));
}
