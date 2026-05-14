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
import { Modal } from "@/components/Modal";

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

// ─── Bulk Add Modal ───────────────────────────────────────────
type BulkRow = { name: string; sets: string; reps: string; load: string; rest_time: string; notes: string };
const emptyRow = (): BulkRow => ({ name: "", sets: "", reps: "", load: "", rest_time: "", notes: "" });

function BulkAddModal({ sections, onSave, onCancel }: {
  sections: WorkoutSection[];
  onSave: (data: Record<string, BulkRow[]>) => Promise<void>;
  onCancel: () => void;
}) {
  const [data, setData] = useState<Record<string, BulkRow[]>>(() =>
    Object.fromEntries(sections.map(s => [s.id, [emptyRow()]]))
  );
  const [activeTab, setActiveTab] = useState<SectionType>(sections[0]?.section_type ?? "warmup");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [focusedField, setFocusedField] = useState<{ sectionId: string; idx: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: exData } = await supabase
        .from("exercises")
        .select("name, workout_sections!inner(section_type)");
      if (!exData) return;
      const byType: Record<string, Set<string>> = {};
      exData.forEach((ex: any) => {
        const type = ex.workout_sections?.section_type;
        if (!type || !ex.name?.trim()) return;
        if (!byType[type]) byType[type] = new Set();
        byType[type].add(ex.name.trim());
      });
      const bySectionId: Record<string, string[]> = {};
      sections.forEach(s => {
        bySectionId[s.id] = Array.from(byType[s.section_type] ?? []).sort();
      });
      setSuggestions(bySectionId);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRow = (sectionId: string) =>
    setData(prev => ({ ...prev, [sectionId]: [...prev[sectionId], emptyRow()] }));

  const updateRow = (sectionId: string, idx: number, field: keyof BulkRow, value: string) =>
    setData(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map((r, i) => i === idx ? { ...r, [field]: value } : r),
    }));

  const removeRow = (sectionId: string, idx: number) =>
    setData(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter((_, i) => i !== idx).length > 0
        ? prev[sectionId].filter((_, i) => i !== idx)
        : [emptyRow()],
    }));

  const totalFilled = Object.values(data).reduce((acc, rows) =>
    acc + rows.filter(r => r.name.trim()).length, 0
  );

  const handleSave = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  const activeSection = sections.find(s => s.section_type === activeTab);

  const getFiltered = (sectionId: string, query: string) => {
    const all = suggestions[sectionId] ?? [];
    if (!query.trim()) return all;
    return all.filter(n => n.toLowerCase().includes(query.toLowerCase()));
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
        {sections.map(s => {
          const count = (data[s.id] ?? []).filter(r => r.name.trim()).length;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveTab(s.section_type); setFocusedField(null); }}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === s.section_type
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-400 dark:text-gray-500"
              }`}
              style={activeTab === s.section_type ? { color: SECTION_COLORS[s.section_type] } : {}}
            >
              {SECTION_LABELS[s.section_type]}
              {count > 0 && <span className="ml-1 text-[10px] font-bold opacity-80">{count}</span>}
            </button>
          );
        })}
      </div>

      {activeSection && (
        <div className="space-y-2">
          {(data[activeSection.id] ?? []).map((row, idx) => {
            const isFocused = focusedField?.sectionId === activeSection.id && focusedField?.idx === idx;
            const filtered = isFocused ? getFiltered(activeSection.id, row.name) : [];
            const color = SECTION_COLORS[activeSection.section_type];
            return (
              <div key={idx} className="space-y-1.5 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                <div className="flex gap-2 items-center">
                  <input
                    className="input text-sm flex-1"
                    placeholder="Nome esercizio"
                    value={row.name}
                    onChange={e => updateRow(activeSection.id, idx, "name", e.target.value)}
                    onFocus={() => setFocusedField({ sectionId: activeSection.id, idx })}
                    onBlur={() => setTimeout(() => setFocusedField(null), 150)}
                  />
                  <button onClick={() => removeRow(activeSection.id, idx)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {isFocused && filtered.length > 0 && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800 max-h-44 overflow-y-auto">
                    {filtered.map(name => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault();
                          updateRow(activeSection.id, idx, "name", name);
                          setFocusedField(null);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-gray-800 dark:text-gray-200">{name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5">
                  <input className="input text-xs text-center" placeholder="Serie" value={row.sets} onChange={e => updateRow(activeSection.id, idx, "sets", e.target.value)} />
                  <input className="input text-xs text-center" placeholder="Reps" value={row.reps} onChange={e => updateRow(activeSection.id, idx, "reps", e.target.value)} />
                  <input className="input text-xs text-center" placeholder="Carico" value={row.load} onChange={e => updateRow(activeSection.id, idx, "load", e.target.value)} />
                  <input className="input text-xs text-center" placeholder='Rec."' value={row.rest_time} onChange={e => updateRow(activeSection.id, idx, "rest_time", e.target.value)} />
                </div>
                <input className="input text-xs" placeholder="Note (opz.)" value={row.notes} onChange={e => updateRow(activeSection.id, idx, "notes", e.target.value)} />
              </div>
            );
          })}
          <button
            onClick={() => addRow(activeSection.id)}
            className="w-full py-2 rounded-xl border-2 border-dashed text-xs font-medium transition-colors"
            style={{ borderColor: SECTION_COLORS[activeSection.section_type] + "50", color: SECTION_COLORS[activeSection.section_type] }}
          >
            + Aggiungi esercizio
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        <button className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button
          className="btn-primary flex-1"
          onClick={handleSave}
          disabled={saving || totalFilled === 0}
        >
          {saving ? "Salvo..." : totalFilled > 0 ? `Salva ${totalFilled} esercizi` : "Salva"}
        </button>
      </div>
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
  const [showBulkAdd, setShowBulkAdd] = useState(false);

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

  const handleBulkSave = async (data: Record<string, BulkRow[]>) => {
    const toInsert = sections.flatMap(section => {
      const rows = data[section.id] ?? [];
      const existingCount = section.exercises?.length ?? 0;
      return rows
        .filter(r => r.name.trim())
        .map((r, i) => ({
          section_id: section.id,
          name: r.name.trim(),
          sets: r.sets.trim() || null,
          reps: r.reps.trim() || null,
          load: r.load.trim() || null,
          rest_time: r.rest_time.trim() || null,
          notes: r.notes.trim() || null,
          order_index: existingCount + i,
        }));
    });
    if (toInsert.length > 0) {
      await supabase.from("exercises").insert(toInsert);
      await fetchAll();
    }
    setShowBulkAdd(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkAdd(true)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Compila
            </button>
            {saving
              ? <span className="text-xs text-amber-600 font-medium animate-pulse">Salvo...</span>
              : <span className="text-xs text-green-600 font-medium">{totalExercises} esercizi</span>
            }
          </div>
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

        <div className="h-6" />
      </main>

      <Modal open={showBulkAdd} onClose={() => setShowBulkAdd(false)} title="Compila giorno">
        {showBulkAdd && sections.length > 0 && (
          <BulkAddModal
            sections={sections}
            onSave={handleBulkSave}
            onCancel={() => setShowBulkAdd(false)}
          />
        )}
      </Modal>
    </div>
  );
}
