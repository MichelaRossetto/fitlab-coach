"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  TrainingDay, WorkoutSection, Exercise,
  SectionType, SECTION_LABELS, SECTION_ORDER,
} from "@/lib/types";
import { Header } from "@/components/Header";

// ─── Section icons ────────────────────────────────────────────
const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  warmup: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  strength: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h6"/></svg>,
  accessories: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>,
  workout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
};

const SECTION_COLORS: Record<SectionType, string> = {
  warmup: "#16A34A",
  strength: "#D4E600",
  accessories: "#7C3AED",
  workout: "#EA580C",
};

// ─── Exercise Row ─────────────────────────────────────────────
interface ExerciseRowProps {
  exercise: Exercise;
  editing: boolean;
  onUpdate: (id: string, field: keyof Exercise, value: string) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
}

function ExerciseRow({ exercise, editing, onUpdate, onDelete, onSave }: ExerciseRowProps) {
  if (editing) {
    return (
      <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
        <input
          className="input text-sm font-medium"
          placeholder="Nome esercizio *"
          value={exercise.name}
          onChange={e => onUpdate(exercise.id, "name", e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">Serie</label>
            <input className="input text-sm" placeholder="4" value={exercise.sets ?? ""} onChange={e => onUpdate(exercise.id, "sets", e.target.value)} />
          </div>
          <div>
            <label className="label">Reps</label>
            <input className="input text-sm" placeholder="10-12" value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
          </div>
          <div>
            <label className="label">Carico</label>
            <input className="input text-sm" placeholder="20kg" value={exercise.load ?? ""} onChange={e => onUpdate(exercise.id, "load", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Recupero</label>
            <input className="input text-sm" placeholder='90"' value={exercise.rest_time ?? ""} onChange={e => onUpdate(exercise.id, "rest_time", e.target.value)} />
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input text-sm" placeholder="es. RPE 7" value={exercise.notes ?? ""} onChange={e => onUpdate(exercise.id, "notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1.5" onClick={() => onDelete(exercise.id)}>Elimina</button>
          <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => onSave(exercise.id)}>Salva</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {exercise.sets && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
              {exercise.sets} serie
            </span>
          )}
          {exercise.reps && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
              {exercise.reps} reps
            </span>
          )}
          {exercise.load && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium dark:bg-gray-700 dark:text-gray-300">
              {exercise.load}
            </span>
          )}
          {exercise.rest_time && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
              ⏱ {exercise.rest_time}
            </span>
          )}
        </div>
        {exercise.notes && (
          <div className="text-xs text-gray-400 italic mt-1">{exercise.notes}</div>
        )}
      </div>
    </div>
  );
}

// ─── Workout Section Block ────────────────────────────────────
interface SectionBlockProps {
  section: WorkoutSection;
  editingExId: string | null;
  onToggleEdit: (id: string) => void;
  onUpdateEx: (id: string, field: keyof Exercise, val: string) => void;
  onDeleteEx: (sectionId: string, exId: string) => void;
  onSaveEx: (sectionId: string, ex: Exercise) => void;
  onAddEx: (sectionId: string) => void;
}

function SectionBlock({ section, editingExId, onToggleEdit, onUpdateEx, onDeleteEx, onSaveEx, onAddEx }: SectionBlockProps) {
  const color = SECTION_COLORS[section.section_type];
  const exercises = section.exercises ?? [];

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "20", color }}>
            {SECTION_ICONS[section.section_type]}
          </div>
          <span className="font-bold text-sm text-gray-900 uppercase tracking-wide dark:text-gray-100">
            {SECTION_LABELS[section.section_type]}
          </span>
          <span className="text-xs text-gray-400">{exercises.length} es.</span>
        </div>
        <button
          onClick={() => onAddEx(section.id)}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: color + "15", color }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
          Aggiungi
        </button>
      </div>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <div className="px-4 py-5 text-center text-sm text-gray-400">
          Nessun esercizio — clicca Aggiungi
        </div>
      ) : (
        exercises.map(ex => (
          <div key={ex.id} onClick={() => !editingExId && onToggleEdit(ex.id)} className={editingExId === ex.id ? "" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"}>
            <ExerciseRow
              exercise={ex}
              editing={editingExId === ex.id}
              onUpdate={onUpdateEx}
              onDelete={(id) => onDeleteEx(section.id, id)}
              onSave={(id) => {
                const ex = exercises.find(e => e.id === id);
                if (ex) onSaveEx(section.id, ex);
              }}
            />
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main Day/Workout Page ────────────────────────────────────
export default function DayPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const monthId = params.monthId as string;
  const weekId = params.weekId as string;
  const dayId = params.dayId as string;

  const [day, setDay] = useState<TrainingDay | null>(null);
  const [sections, setSections] = useState<WorkoutSection[]>([]);
  const [clientName, setClientName] = useState("");
  const [weekLabel, setWeekLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: d }, { data: c }, { data: w }] = await Promise.all([
      supabase.from("training_days").select("*").eq("id", dayId).single(),
      supabase.from("clients").select("name, surname").eq("id", clientId).single(),
      supabase.from("training_weeks").select("week_number").eq("id", weekId).single(),
    ]);
    setDay(d);
    if (c) setClientName(`${c.name} ${c.surname}`);
    if (w) setWeekLabel(`Sett. ${w.week_number}`);

    // Fetch sections + exercises
    const { data: secs } = await supabase
      .from("workout_sections")
      .select("*, exercises(*)")
      .eq("day_id", dayId)
      .order("order_index");

    // Ensure all 4 sections exist; create missing ones
    const existingTypes = (secs ?? []).map((s: WorkoutSection) => s.section_type);
    const missingSections = SECTION_ORDER.filter(t => !existingTypes.includes(t));

    if (missingSections.length > 0) {
      const toInsert = missingSections.map((t, i) => ({
        day_id: dayId,
        section_type: t,
        order_index: SECTION_ORDER.indexOf(t),
      }));
      await supabase.from("workout_sections").insert(toInsert);

      // Re-fetch
      const { data: secs2 } = await supabase
        .from("workout_sections")
        .select("*, exercises(*)")
        .eq("day_id", dayId)
        .order("order_index");
      setSections(
        SECTION_ORDER.map(type =>
          (secs2 ?? []).find((s: WorkoutSection) => s.section_type === type)!
        ).filter(Boolean)
      );
    } else {
      setSections(
        SECTION_ORDER.map(type =>
          (secs ?? []).find((s: WorkoutSection) => s.section_type === type)!
        ).filter(Boolean)
      );
    }
    setLoading(false);
  }, [dayId, clientId, weekId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Exercise operations ──────────────────────────────────────
  const handleAddExercise = async (sectionId: string) => {
    const { data } = await supabase.from("exercises").insert({
      section_id: sectionId,
      name: "Nuovo esercizio",
      order_index: 0,
    }).select().single();

    if (data) {
      setSections(prev => prev.map(s => s.id === sectionId
        ? { ...s, exercises: [...(s.exercises ?? []), data] }
        : s
      ));
      setEditingExId(data.id);
    }
  };

  const handleUpdateExercise = (id: string, field: keyof Exercise, value: string) => {
    setSections(prev => prev.map(s => ({
      ...s,
      exercises: (s.exercises ?? []).map(e =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })));
  };

  const handleSaveExercise = async (sectionId: string, ex: Exercise) => {
    setSaving(true);
    await supabase.from("exercises").update({
      name: ex.name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      load: ex.load ?? null,
      rest_time: ex.rest_time ?? null,
      notes: ex.notes ?? null,
    }).eq("id", ex.id);
    setSaving(false);
    setEditingExId(null);
  };

  const handleDeleteExercise = async (sectionId: string, exId: string) => {
    await supabase.from("exercises").delete().eq("id", exId);
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, exercises: (s.exercises ?? []).filter(e => e.id !== exId) }
      : s
    ));
    setEditingExId(null);
  };

  const handleToggleEdit = (id: string) => {
    setEditingExId(prev => prev === id ? null : id);
  };

  const totalExercises = sections.reduce((acc, s) => acc + (s.exercises?.length ?? 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header backHref={`/clienti/${clientId}/${monthId}/${weekId}`} title="Caricamento..." />
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-32 bg-gray-100" />)}
      </div>
    </div>
  );

  if (!day) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Giorno non trovato</p>
        <Link href={`/clienti/${clientId}/${monthId}/${weekId}`} className="btn-primary">Torna alla settimana</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref={`/clienti/${clientId}/${monthId}/${weekId}`}
        title={day.label}
        subtitle={`${clientName} · ${weekLabel}`}
        right={
          saving ? (
            <span className="text-xs text-amber-600 font-medium animate-pulse">Salvo...</span>
          ) : (
            <span className="text-xs text-green-600 font-medium">{totalExercises} esercizi</span>
          )
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Edit hint */}
        {totalExercises > 0 && !editingExId && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 dark:bg-blue-900/20 dark:border-blue-900/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-xs text-blue-600 dark:text-blue-400">Tocca un esercizio per modificarlo</span>
          </div>
        )}

        {/* Notes */}
        {day.notes && (
          <div className="card p-4 border-l-4" style={{ borderLeftColor: "#D4E600" }}>
            <p className="text-sm text-gray-600 italic dark:text-gray-300">{day.notes}</p>
          </div>
        )}

        {/* Sections */}
        {sections.map(section => (
          <SectionBlock
            key={section.id}
            section={section}
            editingExId={editingExId}
            onToggleEdit={handleToggleEdit}
            onUpdateEx={handleUpdateExercise}
            onDeleteEx={handleDeleteExercise}
            onSaveEx={handleSaveExercise}
            onAddEx={handleAddExercise}
          />
        ))}

        {/* Print / Share hint */}
        <div className="h-6" />
      </main>
    </div>
  );
}
