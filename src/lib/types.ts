export type SetLog = {
  weight: number;
  reps: number;
  completed: boolean;
  toFailure: boolean;
};

export type WorkoutExercise = {
  name: string;
  sets: SetLog[];
};

export type Workout = {
  id: string;
  user_id?: string;
  focus: string;
  exercises: WorkoutExercise[];
  status: "completed";
  created_at: string;
  completed_at: string;
  duration_seconds: number;
};

export type WeightLog = {
  id: string;
  weight: number;
  logged_at: string;
};

export type NoteCategory =
  | "General"
  | "Workout"
  | "Nutrition"
  | "Motivation"
  | "Goals";

export type Note = {
  id: string;
  content: string;
  category: NoteCategory;
  pinned: boolean;
  created_at: string;
};

export type TemplateExercise = {
  name: string;
  sets: number;
  reps: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  created_at: string;
};

export type GymOSData = {
  workouts: Workout[];
  weightLogs: WeightLog[];
  notes: Note[];
  templates: WorkoutTemplate[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
};

export type WorkoutDraft = {
  focus: string;
  exercises: WorkoutExercise[];
};

export type ActiveWorkout = {
  draft: WorkoutDraft;
  seconds: number;
  updatedAt: string;
};

export type TrainingGoal =
  | "build_muscle"
  | "strength"
  | "fat_loss"
  | "general_fitness";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type TrainingProfile = {
  configured: boolean;
  goal: TrainingGoal;
  experience: ExperienceLevel;
  trainingSpace: "home" | "gym" | "home_and_gym" | "outdoors_or_other";
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  considerations: string;
};

export type ScheduledWorkout = {
  id: string;
  weekday: number;
  title: string;
  time: string;
  enabled: boolean;
};

export type ReadinessCheck = {
  date: string;
  sleep: number;
  energy: number;
  soreness: number;
  availableMinutes: number;
};

export type TrainingSystem = {
  profile: TrainingProfile;
  schedule: ScheduledWorkout[];
  readiness: ReadinessCheck | null;
  remindersEnabled: boolean;
};
