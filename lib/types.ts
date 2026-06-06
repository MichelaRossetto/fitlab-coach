export type ClientType = "PR" | "PT";

export interface Client {
  id: string;
  created_at: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  subscription_end: string | null;
  paypal_link: string | null;
  client_type: ClientType;
  is_paused: boolean | null;
}

export interface TrainingMonth {
  id: string;
  created_at: string;
  client_id: string;
  label: string;
  year: number;
  month_num: number;
  notes: string | null;
}

export interface TrainingWeek {
  id: string;
  created_at: string;
  month_id: string;
  week_number: number;
  date_start: string | null;
  date_end: string | null;
  notes: string | null;
}

export type DayStatus = "pending" | "done" | "skip";

export interface TrainingDay {
  id: string;
  created_at: string;
  week_id: string;
  day_number: number;
  label: string;
  day_date: string | null;
  notes: string | null;
  status: DayStatus | null;
}

export const DAY_STATUS_CONFIG = [
  {
    value: "pending" as DayStatus,
    label: "Da fare",
    activeBg: "#f3f4f6",
    activeColor: "#6b7280",
    inactiveBg: "#fafafa",
    inactiveColor: "#d1d5db",
  },
  {
    value: "done" as DayStatus,
    label: "Completato",
    activeBg: "#dcfce7",
    activeColor: "#16a34a",
    inactiveBg: "#fafafa",
    inactiveColor: "#d1d5db",
  },
  {
    value: "skip" as DayStatus,
    label: "Saltato",
    activeBg: "#fef3c7",
    activeColor: "#d97706",
    inactiveBg: "#fafafa",
    inactiveColor: "#d1d5db",
  },
] as const;

export type SectionType = "warmup" | "strength" | "accessories" | "core" | "workout";

export interface WorkoutSection {
  id: string;
  day_id: string;
  section_type: SectionType;
  order_index: number;
  section_subtype: string | null;
  cap_time: string | null;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  section_id: string;
  name: string;
  sets: string | null;
  reps: string | null;
  load: string | null;
  rest_time: string | null;
  notes: string | null;
  order_index: number;
}

export type SubscriptionStatus = "active" | "expiring" | "expired" | "inactive";

export function getSubscriptionStatus(subscriptionEnd: string | null): SubscriptionStatus {
  if (!subscriptionEnd) return "inactive";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(subscriptionEnd);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 14) return "active";
  if (diffDays >= 0) return "expiring";
  if (diffDays >= -30) return "expired";
  return "inactive"; // scaduto da più di 30 giorni
}

export function getInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

export const SECTION_LABELS: Record<SectionType, string> = {
  warmup: "Warm Up",
  strength: "Forza",
  accessories: "Accessori",
  core: "Core Training",
  workout: "Workout",
};

export const SECTION_ORDER: SectionType[] = ["warmup", "strength", "accessories", "core", "workout"];

export type WarmupSubtype = "cardio" | "mobilita" | "attivazione";
export type WorkoutSubtype = "amrap" | "emom" | "fortime" | "cardioliss";

export const WARMUP_SUBTYPE_LABELS: Record<WarmupSubtype, string> = {
  cardio: "Cardio",
  mobilita: "Mobilità",
  attivazione: "Attivazione",
};

export const WORKOUT_SUBTYPE_LABELS: Record<WorkoutSubtype, string> = {
  amrap: "AMRAP",
  emom: "EMOM",
  fortime: "For Time",
  cardioliss: "Cardio Liss",
};

export const LOAD_OPTIONS = ["2.5", "5", "7.5", "8", "10", "12", "12.5", "15", "16", "17.5", "20", "22.5", "24", "25", "30", "32"];

export interface ExerciseLibrary {
  id: string;
  created_at: string;
  name: string;
  category: string;
  subcategory: string | null;
  sub_subcategory: string | null;
  // Volume unit
  unit_min: boolean;
  unit_cal: boolean;
  unit_rep: boolean;
  default_unit: "min" | "cal" | "rep" | null;
  // Load type
  load_pct: boolean;
  load_rpe: boolean;
  load_kg: boolean;
  default_load: "pct" | "rpe" | "kg" | null;
  // Equipment
  equip_barbell: boolean;
  equip_db: boolean;
  equip_kb: boolean;
  equip_mb: boolean;
  equip_sb: boolean;
  default_equip: "barbell" | "db" | "kb" | "mb" | "sb" | null;
}

export const LIBRARY_CATEGORIES = ["WARMUP", "FORZA", "ACCESSORI", "CORE TRAINING", "WORKOUT"] as const;
export const WARMUP_SUBCATEGORIES = ["CARDIO", "MOBILITÀ", "ATTIVAZIONE"] as const;
export const WARMUP_SUB_SUBCATEGORIES = ["UPPER", "LOWER", "FULL"] as const;
export const FORZA_SUBCATEGORIES = ["LOWER BODY", "UPPER BODY", "FULL BODY"] as const;
export const ACCESSORI_SUBCATEGORIES = ["BODYWEIGHT", "MANUBRI", "KETTLEBELL", "BILANCIERE"] as const;
export const CORE_SUBCATEGORIES = ["ISOMETRICI", "NON ISOMETRICI"] as const;

export const DAY_TYPES = ["Lower Body", "Upper Body", "Full Body"] as const;
export type DayType = typeof DAY_TYPES[number];

export function getDefaultDayLabel(dayNumber: number, totalDays: number): string {
  if (totalDays === 1) return `Day ${dayNumber} · Full Body`;
  if (totalDays === 2) return `Day ${dayNumber} · ${dayNumber === 1 ? "Lower Body" : "Upper Body"}`;
  return `Day ${dayNumber} · ${DAY_TYPES[(dayNumber - 1) % 3]}`;
}

export const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export interface ClientSchedule {
  id: string;
  client_id: string;
  day_of_week: number; // 0=Lun … 5=Sab
  time: string;        // "08:00" etc.
}

export interface ClientMax {
  id: string;
  client_id: string;
  exercise_name: string;
  weight_kg: number | null;
  recorded_at: string;
}

export const PERFORMANCE_EXERCISES: Record<string, string[]> = {
  "Lower Body": ["Back Squat", "Deadlift", "Sumo Deadlift", "Front Squat", "Overhead Squat"],
  "Upper Body": ["Bench Press", "Press", "Push Press"],
  "Full Body":  ["Clean & Jerk", "Power Clean", "Hang Power Snatch", "Hang Power Clean", "Push Jerk", "Thruster"],
};

export const ALL_PERFORMANCE_EXERCISES = Object.values(PERFORMANCE_EXERCISES).flat();

// Child exercises that inherit their max from a parent performance exercise.
// They enable % in LoadInput and show the calculated weight, but are NOT tracked separately.
export const EXERCISE_PARENT_MAP: Record<string, string> = {
  // Back Squat family (Front Squat e Sumo Deadlift hanno massimale proprio)
  "Box Squat":                   "Back Squat",
  // Deadlift family
  "Deadlift da Rialzo":          "Deadlift",
  "Romanian Deadlift":           "Deadlift",
  "Deficit deadlift":            "Deadlift",
  // Bench Press family (solo bilanciere)
  "Floor Press con Bilanciere":  "Bench Press",
  // Press (overhead) family — Push Press ha massimale proprio
  "Strict Press Bilanciere":     "Press",
  "Push Press Bilanciere":       "Push Press",
  // Thruster family
  "Thruster Bilanciere":         "Thruster",
  "Thruster Manubri":            "Thruster",
  // Clean & Jerk family (nome libreria vs nome massimale)
  "Clean and Jerk":              "Clean & Jerk",
};

export const DAY_NAMES_SHORT    = ["Lun", "Mar", "Mer", "Gio", "Ven"];
export const TIME_SLOTS_MORNING   = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "12:45", "13:00", "13:30",
];
export const TIME_SLOTS_AFTERNOON = [
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00",
];
