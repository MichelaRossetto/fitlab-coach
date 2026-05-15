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

export interface TrainingDay {
  id: string;
  created_at: string;
  week_id: string;
  day_number: number;
  label: string;
  day_date: string | null;
  notes: string | null;
}

export type SectionType = "warmup" | "strength" | "accessories" | "workout";

export interface WorkoutSection {
  id: string;
  day_id: string;
  section_type: SectionType;
  order_index: number;
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

export type SubscriptionStatus = "active" | "expiring" | "expired";

export function getSubscriptionStatus(subscriptionEnd: string | null): SubscriptionStatus {
  if (!subscriptionEnd) return "expired";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(subscriptionEnd);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 14) return "expiring";
  return "active";
}

export function getInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

export const SECTION_LABELS: Record<SectionType, string> = {
  warmup: "Warm Up",
  strength: "Forza",
  accessories: "Accessori",
  workout: "Workout",
};

export const SECTION_ORDER: SectionType[] = ["warmup", "strength", "accessories", "workout"];

export interface ExerciseLibrary {
  id: string;
  created_at: string;
  name: string;
  category: string;
  subcategory: string | null;
  sub_subcategory: string | null;
}

export const LIBRARY_CATEGORIES = ["WARMUP", "FORZA", "ACCESSORI", "CORE TRAINING", "WORKOUT"] as const;
export const WARMUP_SUBCATEGORIES = ["CARDIO", "MOBILITÀ", "ATTIVAZIONE"] as const;
export const WARMUP_SUB_SUBCATEGORIES = ["UPPER", "LOWER", "FULL"] as const;

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

export const DAY_NAMES_SHORT    = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
export const TIME_SLOTS_MORNING   = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
export const TIME_SLOTS_AFTERNOON = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
