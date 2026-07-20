export type ExerciseGuide = {
  name: string;
  muscles: string[];
  equipment: string;
  steps: string[];
  mistakes: string[];
  alternatives: string[];
};

export const exerciseCatalog: ExerciseGuide[] = [
  {
    name: "Barbell Bench Press",
    muscles: ["Chest", "Triceps", "Front delts"],
    equipment: "Barbell + bench",
    steps: ["Set shoulder blades back and down.", "Lower the bar with control to mid-chest.", "Press while keeping feet planted."],
    mistakes: ["Elbows flared straight out", "Bouncing the bar", "Losing upper-back tension"],
    alternatives: ["Dumbbell Bench Press", "Push-Up", "Machine Chest Press"],
  },
  {
    name: "Back Squat",
    muscles: ["Quads", "Glutes", "Core"],
    equipment: "Barbell + rack",
    steps: ["Brace before unracking.", "Sit between the hips with knees tracking toes.", "Drive the floor away without losing balance."],
    mistakes: ["Heels lifting", "Knees collapsing inward", "Rushing depth beyond control"],
    alternatives: ["Goblet Squat", "Leg Press", "Bodyweight Squat"],
  },
  {
    name: "Romanian Deadlift",
    muscles: ["Hamstrings", "Glutes", "Back"],
    equipment: "Barbell or dumbbells",
    steps: ["Keep a soft knee bend.", "Push hips back while the load stays close.", "Stop when hamstrings limit the hinge, then stand tall."],
    mistakes: ["Turning it into a squat", "Rounding the lower back", "Letting the load drift forward"],
    alternatives: ["Dumbbell RDL", "Hip Hinge", "Cable Pull-Through"],
  },
  {
    name: "Lat Pulldown",
    muscles: ["Lats", "Upper back", "Biceps"],
    equipment: "Cable machine",
    steps: ["Set ribs down and chest tall.", "Pull elbows toward your sides.", "Control the full return overhead."],
    mistakes: ["Swinging backward", "Pulling behind the neck", "Shrugging each rep"],
    alternatives: ["Assisted Pull-Up", "Band Pulldown", "One-Arm Cable Pulldown"],
  },
  {
    name: "Overhead Press",
    muscles: ["Shoulders", "Triceps", "Upper chest"],
    equipment: "Barbell or dumbbells",
    steps: ["Brace glutes and core.", "Press from upper chest without leaning back.", "Finish with the load stacked over shoulders."],
    mistakes: ["Overarching the lower back", "Pressing around the face", "Loose wrists"],
    alternatives: ["Dumbbell Shoulder Press", "Landmine Press", "Pike Push-Up"],
  },
  {
    name: "Seated Cable Row",
    muscles: ["Mid back", "Lats", "Biceps"],
    equipment: "Cable machine",
    steps: ["Start tall with long arms.", "Pull elbows back without shrugging.", "Pause, then return under control."],
    mistakes: ["Rocking the torso", "Leading with the chin", "Shortening the return"],
    alternatives: ["Chest Supported Row", "One-Arm Dumbbell Row", "Band Row"],
  },
  {
    name: "Walking Lunges",
    muscles: ["Quads", "Glutes", "Hamstrings"],
    equipment: "Bodyweight or dumbbells",
    steps: ["Take a stable step forward.", "Lower both knees under control.", "Push through the whole front foot."],
    mistakes: ["Steps too narrow", "Front heel lifting", "Slamming the rear knee"],
    alternatives: ["Reverse Lunge", "Split Squat", "Step-Up"],
  },
  {
    name: "Push-Up",
    muscles: ["Chest", "Triceps", "Core"],
    equipment: "Bodyweight",
    steps: ["Make a straight line from head to heel.", "Lower chest between the hands.", "Press away while keeping the trunk rigid."],
    mistakes: ["Hips sagging", "Half reps", "Hands too far forward"],
    alternatives: ["Incline Push-Up", "Knee Push-Up", "Dumbbell Bench Press"],
  },
  {
    name: "Dumbbell Curl",
    muscles: ["Biceps", "Forearms"],
    equipment: "Dumbbells",
    steps: ["Keep upper arms quiet.", "Curl without swinging.", "Lower fully under control."],
    mistakes: ["Using hip momentum", "Elbows drifting forward", "Dropping the eccentric"],
    alternatives: ["Cable Curl", "Band Curl", "Hammer Curl"],
  },
  {
    name: "Plank",
    muscles: ["Core", "Glutes", "Shoulders"],
    equipment: "Bodyweight",
    steps: ["Stack elbows under shoulders.", "Squeeze glutes and brace as if preparing for a punch.", "Breathe without losing position."],
    mistakes: ["Hips sagging", "Holding breath", "Looking too far forward"],
    alternatives: ["Dead Bug", "Side Plank", "Bird Dog"],
  },
];

export function guideForExercise(name: string) {
  const exact = exerciseCatalog.find(
    (exercise) => exercise.name.toLowerCase() === name.toLowerCase(),
  );
  if (exact) return exact;
  return exerciseCatalog.find(
    (exercise) =>
      name.toLowerCase().includes(exercise.name.toLowerCase()) ||
      exercise.name.toLowerCase().includes(name.toLowerCase()),
  );
}
