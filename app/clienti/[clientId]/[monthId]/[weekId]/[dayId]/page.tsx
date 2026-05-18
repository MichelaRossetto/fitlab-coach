"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  TrainingDay, WorkoutSection, Exercise, ExerciseLibrary,
  SectionType, SECTION_LABELS, SECTION_ORDER,
  WorkoutSubtype, WORKOUT_SUBTYPE_LABELS, LOAD_OPTIONS,
} from "@/lib/types";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

// ─── Section icons ────────────────────────────────────────────
const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  warmup: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  strength: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h6"/>
    </svg>
  ),
  accessories: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
    </svg>
  ),
  core: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>
    </svg>
  ),
  workout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
};

const SECTION_COLORS: Record<SectionType, string> = {
  warmup: "#16A34A",
  strength: "#C0D738",
  accessories: "#7C3AED",
  core: "#0EA5E9",
  workout: "#EA580C",
};

// ─── Sub-group tag helpers ────────────────────────────────────

function tagNotes(tag: string, userNotes: string): string {
  const base = `#${tag}#`;
  const trimmed = userNotes?.trim() ?? "";
  return trimmed ? `${base} ${trimmed}` : base;
}

const GROUP_TAG_RE = /^#(\w+)#\s*/;

function parseExerciseGroup(notes: string | null): { group: string | null; cleanNotes: string | null } {
  if (!notes) return { group: null, cleanNotes: null };
  const m = notes.match(GROUP_TAG_RE);
  if (!m) return { group: null, cleanNotes: notes };
  const clean = notes.replace(GROUP_TAG_RE, "").trim() || null;
  return { group: m[1], cleanNotes: clean };
}

const GROUP_LABELS: Record<string, string> = {
  cardio: "Cardio",
  mob: "Mobilità",
  att: "Attivazione",
  lower: "Lower Body",
  upper: "Upper Body",
  full: "Full Body",
  bw: "Bodyweight",
  man: "Manubri",
  kb: "Kettlebell",
  bar: "Bilanciere",
  amrap: "AMRAP",
  emom: "EMOM",
  fortime: "For Time",
  cardioliss: "Cardio Liss",
};

// ─── Exercise Row ─────────────────────────────────────────────
interface ExerciseRowProps {
  exercise: Exercise;
  sectionType: SectionType;
  sectionSubtype?: string | null;
  libSuggestions?: string[];
  editing: boolean;
  noteTag?: string | null;
  exerciseNumber?: number;
  onUpdate: (id: string, field: keyof Exercise, value: string) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
}

function ExerciseRow({ exercise, sectionType, sectionSubtype, libSuggestions, editing, noteTag, exerciseNumber, onUpdate, onDelete, onSave }: ExerciseRowProps) {
  // Detect cardio warmup: has reps (minutes) but no sets and no load
  const isCardioWarmup = sectionType === "warmup" && !exercise.sets && !exercise.load;
  // Detect mobilità warmup: has sets + reps but no load
  const isMobilitaWarmup = sectionType === "warmup" && exercise.sets && !exercise.load;

  if (editing) {
    if (isCardioWarmup && !exercise.sets) {
      return (
        <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
          <AutocompleteInput
            value={exercise.name}
            onChange={v => onUpdate(exercise.id, "name", v)}
            suggestions={libSuggestions ?? []}
            strict
            placeholder="Nome esercizio *"
            className="input text-sm font-medium w-full"
          />
          <div>
            <label className="label">Minuti</label>
            <input className="input text-sm" placeholder="10 min" value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1.5" onClick={() => onDelete(exercise.id)}>Elimina</button>
            <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => onSave(exercise.id)}>Salva</button>
          </div>
        </div>
      );
    }
    // Workout editing — form adattato al subtype (no serie per AMRAP/EMOM)
    if (sectionType === "workout") {
      const wkSubtypes: WorkoutSubtype[] = ["amrap", "emom", "fortime", "cardioliss"];
      const sub = (noteTag && wkSubtypes.includes(noteTag as WorkoutSubtype) ? noteTag : sectionSubtype) ?? "amrap";
      return (
        <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
          <AutocompleteInput
            value={exercise.name}
            onChange={v => onUpdate(exercise.id, "name", v)}
            suggestions={libSuggestions ?? []}
            strict
            placeholder="Nome esercizio *"
            className="input text-sm font-medium w-full"
          />
          {sub === "cardioliss" && (
            <div>
              <label className="label">Minuti</label>
              <input className="input text-sm" placeholder="10" value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
            </div>
          )}
          {sub === "fortime" && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Rounds</label>
                <input className="input text-sm" placeholder="3" value={exercise.sets ?? ""} onChange={e => onUpdate(exercise.id, "sets", e.target.value)} />
              </div>
              <div>
                <label className="label">Reps</label>
                <input className="input text-sm" placeholder="15" value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
              </div>
              <div>
                <label className="label">Carico</label>
                <input className="input text-sm" placeholder="20kg" value={exercise.load ?? ""} onChange={e => onUpdate(exercise.id, "load", e.target.value)} />
              </div>
            </div>
          )}
          {sub !== "cardioliss" && sub !== "fortime" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Reps</label>
                <input className="input text-sm" placeholder="10" value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
              </div>
              <div>
                <label className="label">Carico</label>
                <input className="input text-sm" placeholder="20kg" value={exercise.load ?? ""} onChange={e => onUpdate(exercise.id, "load", e.target.value)} />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1.5" onClick={() => onDelete(exercise.id)}>Elimina</button>
            <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => onSave(exercise.id)}>Salva</button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
        <AutocompleteInput
          value={exercise.name}
          onChange={v => onUpdate(exercise.id, "name", v)}
          suggestions={libSuggestions ?? []}
          strict
          placeholder="Nome esercizio *"
          className="input text-sm font-medium w-full"
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

  // Read-only view — inline note editor
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(exercise.notes ?? "");

  const handleSaveNote = () => {
    const full = noteTag ? tagNotes(noteTag, noteText) : (noteText.trim() || null);
    onUpdate(exercise.id, "notes", full ?? "");
    onSave(exercise.id);
    setNoteOpen(false);
  };

  const NoteToggle = () => {
    if (!noteOpen && !exercise.notes) return null;
    return (
      <div className="mt-1.5" onClick={e => e.stopPropagation()}>
        {noteOpen ? (
          <div className="flex gap-2 items-start">
            <textarea
              autoFocus
              rows={2}
              className="input text-xs flex-1 resize-none"
              placeholder="Aggiungi nota..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <button onClick={handleSaveNote} className="text-[10px] font-semibold text-green-600 hover:text-green-700 whitespace-nowrap">Salva</button>
              <button onClick={() => { setNoteText(exercise.notes ?? ""); setNoteOpen(false); }} className="text-[10px] text-gray-400 hover:text-gray-600">Annulla</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setNoteOpen(true)}
            className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✏️ {exercise.notes}
          </button>
        )}
      </div>
    );
  };

  const chips: React.ReactNode[] = [];

  // Workout section — layout inline stile crossfit
  if (sectionType === "workout") {
    const wkSubtypes: WorkoutSubtype[] = ["amrap", "emom", "fortime", "cardioliss"];
    const sub = (noteTag && wkSubtypes.includes(noteTag as WorkoutSubtype) ? noteTag : sectionSubtype) ?? "amrap";

    // Costruisce la riga: "10 Air Squat · 20kg" oppure "3× Deadlift · 10 reps · 80kg"
    const renderInline = () => {
      if (sub === "cardioliss") {
        return (
          <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap items-baseline gap-x-1.5">
            {exercise.reps && <span className="font-bold text-gray-500 dark:text-gray-400">{exercise.reps}</span>}
            <span className="font-medium">{exercise.name}</span>
          </div>
        );
      }
      if (sub === "fortime") {
        return (
          <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap items-baseline gap-x-1.5">
            {exercise.sets && <span className="font-bold text-gray-500 dark:text-gray-400">{exercise.sets}×</span>}
            <span className="font-medium">{exercise.name}</span>
            {exercise.reps && <><span className="text-gray-400">·</span><span className="text-gray-500 dark:text-gray-400">{exercise.reps} reps</span></>}
            {exercise.load && <><span className="text-gray-400">·</span><span className="text-gray-500 dark:text-gray-400">{formatLoad(exercise.load)}</span></>}
          </div>
        );
      }
      // amrap / emom
      return (
        <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap items-baseline gap-x-1.5">
          {exercise.reps && <span className="font-bold text-gray-500 dark:text-gray-400">{exercise.reps}</span>}
          <span className="font-medium">{exercise.name}</span>
          {exercise.load && <><span className="text-gray-400">·</span><span className="text-gray-500 dark:text-gray-400">{formatLoad(exercise.load)}</span></>}
        </div>
      );
    };

    return (
      <div className="px-4 py-2.5 border-b border-gray-100 last:border-0 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
          <div className="flex-1 min-w-0">{renderInline()}</div>
        </div>
        <div className="pl-3.5"><NoteToggle /></div>
      </div>
    );
  }

  if (isCardioWarmup) {
    return (
      <div className="px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</span>
            {exercise.reps && <span className="text-sm text-gray-500 dark:text-gray-400"> · {exercise.reps}</span>}
          </div>
        </div>
        <div className="pl-4"><NoteToggle /></div>
      </div>
    );
  }

  if (isMobilitaWarmup) {
    return (
      <div className="px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</span>
            {exercise.sets && exercise.reps && (
              <span className="text-sm text-gray-500 dark:text-gray-400"> · {exercise.sets}x {exercise.reps} reps</span>
            )}
          </div>
        </div>
        <div className="pl-4"><NoteToggle /></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap items-baseline gap-x-1">
            <span className="font-medium">{exercise.name}</span>
            {(exercise.sets || exercise.reps) && <span className="text-gray-400 dark:text-gray-500">·</span>}
            {exercise.sets && exercise.reps
              ? <span className="text-gray-500 dark:text-gray-400">{exercise.sets}×{exercise.reps}</span>
              : exercise.reps
              ? <span className="text-gray-500 dark:text-gray-400">{exercise.reps}</span>
              : exercise.sets
              ? <span className="text-gray-500 dark:text-gray-400">{exercise.sets} serie</span>
              : null}
            {exercise.load && <><span className="text-gray-400 dark:text-gray-500">·</span><span className="text-gray-500 dark:text-gray-400">{formatLoad(exercise.load)}</span></>}
            {exercise.rest_time && <><span className="text-gray-400 dark:text-gray-500">·</span><span className="text-gray-500 dark:text-gray-400">⏱ {exercise.rest_time} rest</span></>}
          </div>
        </div>
      </div>
      <div className="pl-4"><NoteToggle /></div>
    </div>
  );
}

// ─── Add Exercise Modal ───────────────────────────────────────
function AddExerciseModal({ section, lib, dayLabel, onSave, onCancel }: {
  section: WorkoutSection;
  lib: LibraryMap;
  dayLabel?: string;
  onSave: (data: { name: string; sets?: string; reps?: string; load?: string; rest_time?: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const color = SECTION_COLORS[section.section_type];
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [rest, setRest] = useState("");
  const [warmupType, setWarmupType] = useState<"cardio" | "mobilita" | "attivazione">("cardio");

  const dayFilter = getDayMobilitaFilter(dayLabel ?? "");
  const isFullDay = dayFilter === "FULL";
  const defaultZone: "UPPER" | "LOWER" = dayFilter === "LOWER" ? "LOWER" : "UPPER";
  const [warmupZone, setWarmupZone] = useState<"UPPER" | "LOWER">(defaultZone);
  const defaultStrengthSub = dayFilter === "UPPER" ? "UPPER BODY" : dayFilter === "LOWER" ? "LOWER BODY" : "FULL BODY";
  const [strengthSub, setStrengthSub] = useState<"UPPER BODY" | "LOWER BODY" | "FULL BODY">(defaultStrengthSub as "UPPER BODY" | "LOWER BODY" | "FULL BODY");
  const [accessoriSub, setAccessoriSub] = useState<"bodyweight" | "manubri" | "kettlebell" | "bilanciere">("manubri");
  const firstBlockSubtype = section.section_subtype?.split("+")[0] as WorkoutSubtype | undefined;
  const [workoutSub, setWorkoutSub] = useState<WorkoutSubtype>(firstBlockSubtype ?? "amrap");

  // Default field values by section type
  useEffect(() => {
    if (section.section_type === "warmup") { setSets("2"); setReps("10"); }
    else if (section.section_type === "strength") { setSets("3"); setReps("5"); setRest("120"); }
    else if (section.section_type === "accessories") { setSets("3"); setReps("12"); setRest("60"); }
    else if (section.section_type === "core") { setSets("3"); setReps("15"); setRest("30"); }
  }, [section.section_type]);

  // Reset name when switching sub-category
  useEffect(() => { setName(""); }, [warmupType, warmupZone, strengthSub, accessoriSub, workoutSub]);

  const accLibMap: Record<string, string> = { bodyweight: "BODYWEIGHT", manubri: "MANUBRI", kettlebell: "KETTLEBELL", bilanciere: "BILANCIERE" };
  const strengthLibMap: Record<string, string> = { "UPPER BODY": "UPPER BODY", "LOWER BODY": "LOWER BODY", "FULL BODY": "FULL BODY" };

  const suggestions: string[] = (() => {
    if (section.section_type === "warmup") {
      if (warmupType === "cardio") return getLibNames(lib, "WARMUP", "CARDIO");
      const subcat = warmupType === "mobilita" ? "MOBILITÀ" : "ATTIVAZIONE";
      if (isFullDay) return [...getLibNames(lib, "WARMUP", subcat, "UPPER"), ...getLibNames(lib, "WARMUP", subcat, "LOWER")];
      return getLibNames(lib, "WARMUP", subcat, warmupZone);
    }
    if (section.section_type === "strength")    return getLibNames(lib, "FORZA", strengthLibMap[strengthSub]);
    if (section.section_type === "accessories") return getLibNames(lib, "ACCESSORI", accLibMap[accessoriSub]);
    if (section.section_type === "core")        return getLibNames(lib, "CORE TRAINING", null);
    if (section.section_type === "workout")     return getWorkoutNames(lib);
    return [];
  })();

  const isWorkout = section.section_type === "workout";
  const accLoadType = accessoriSub === "bodyweight" ? "none" : accessoriSub === "bilanciere" ? "free" : "select";

  const handleSave = () => {
    if (!name.trim()) return;
    if (section.section_type === "warmup" && warmupType === "cardio") {
      onSave({ name: name.trim(), reps: reps ? `${reps} min` : "5 min", notes: tagNotes("cardio", "") });
    } else if (section.section_type === "warmup" && warmupType === "attivazione") {
      onSave({ name: name.trim(), sets: sets || "2", reps: reps || "10", notes: tagNotes("att", "") });
    } else if (section.section_type === "warmup") {
      onSave({ name: name.trim(), sets: sets || "2", reps: reps || "10", notes: tagNotes("mob", "") });
    } else if (section.section_type === "strength") {
      const tagMap: Record<string, string> = { "UPPER BODY": "upper", "LOWER BODY": "lower", "FULL BODY": "full" };
      onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: load || undefined, rest_time: rest ? `${rest} sec` : undefined, notes: tagNotes(tagMap[strengthSub], "") });
    } else if (section.section_type === "accessories") {
      const tagMap: Record<string, string> = { bodyweight: "bw", manubri: "man", kettlebell: "kb", bilanciere: "bar" };
      const loadVal = accLoadType === "none" ? undefined : (load && load !== "-" ? load : undefined);
      onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: loadVal, rest_time: rest ? `${rest} sec` : undefined, notes: tagNotes(tagMap[accessoriSub], "") });
    } else if (isWorkout && workoutSub === "cardioliss") {
      onSave({ name: name.trim(), reps: reps ? `${reps} min` : undefined, notes: tagNotes("cardioliss", "") });
    } else if (isWorkout && workoutSub === "fortime") {
      onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: load || undefined, notes: tagNotes("fortime", "") });
    } else if (isWorkout) {
      onSave({ name: name.trim(), reps: reps || undefined, load: load || undefined, notes: tagNotes(workoutSub, "") });
    } else {
      onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: load || undefined, rest_time: rest ? `${rest} sec` : undefined });
    }
  };

  const toggleBtn = <T extends string>(options: readonly T[], active: T, setActive: (v: T) => void, labelFn: (v: T) => string) => (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
      {options.map(t => (
        <button key={t} onClick={() => setActive(t)}
          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${active === t ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400 dark:text-gray-500"}`}
          style={active === t ? { color } : {}}
        >{labelFn(t)}</button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-5 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color }}>
            + {SECTION_LABELS[section.section_type]}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Sub-type selectors */}
        {section.section_type === "warmup" && toggleBtn(["cardio", "mobilita", "attivazione"] as const, warmupType, setWarmupType, t => t === "cardio" ? "Cardio" : t === "mobilita" ? "Mobilità" : "Attivazione")}
        {section.section_type === "warmup" && warmupType !== "cardio" && !isFullDay && toggleBtn(["UPPER", "LOWER"] as const, warmupZone, setWarmupZone, t => t === "UPPER" ? "Upper" : "Lower")}
        {section.section_type === "strength" && toggleBtn(["UPPER BODY", "LOWER BODY", "FULL BODY"] as const, strengthSub, setStrengthSub, t => t === "UPPER BODY" ? "Upper Body" : t === "LOWER BODY" ? "Lower Body" : "Full Body")}
        {section.section_type === "accessories" && toggleBtn(["bodyweight", "manubri", "kettlebell", "bilanciere"] as const, accessoriSub, setAccessoriSub, t => t === "bodyweight" ? "Bodyweight" : t === "manubri" ? "Manubri" : t === "kettlebell" ? "Kettlebell" : "Bilanciere")}
        {section.section_type === "workout" && toggleBtn(["amrap", "emom", "fortime", "cardioliss"] as WorkoutSubtype[], workoutSub, setWorkoutSub, t => WORKOUT_SUBTYPE_LABELS[t])}

        {/* Exercise name */}
        <div>
          <label className="label">Esercizio</label>
          <AutocompleteInput value={name} onChange={setName} suggestions={suggestions} globalSuggestions={getAllLibNames(lib)} strict placeholder="Cerca dalla libreria..." />
        </div>

        {/* Warmup fields */}
        {section.section_type === "warmup" && warmupType === "cardio" && (
          <div><label className="label">Minuti</label>
            <input className="input text-sm text-center w-24" placeholder="5" value={reps} onChange={e => setReps(e.target.value)} />
          </div>
        )}
        {section.section_type === "warmup" && warmupType === "mobilita" && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="2" value={sets} onChange={e => setSets(e.target.value)} /></div>
            <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="10" value={reps} onChange={e => setReps(e.target.value)} /></div>
          </div>
        )}

        {/* Strength fields */}
        {section.section_type === "strength" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
              <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="5" value={reps} onChange={e => setReps(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Carico</label><input className="input text-sm text-center" placeholder="-" value={load} onChange={e => setLoad(e.target.value)} /></div>
              <div><label className="label">Rec. sec</label><input className="input text-sm text-center" placeholder="120" value={rest} onChange={e => setRest(e.target.value)} /></div>
            </div>
          </>
        )}

        {/* Accessories fields */}
        {section.section_type === "accessories" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
              <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="12" value={reps} onChange={e => setReps(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {accLoadType !== "none" && (
                <div>
                  <label className="label">Carico</label>
                  {accLoadType === "select"
                    ? <select className="input text-sm" value={load} onChange={e => setLoad(e.target.value)}>
                        <option value="-">-</option>
                        {LOAD_OPTIONS.map(o => <option key={o} value={`${o} KG`}>{o} KG</option>)}
                      </select>
                    : <input className="input text-sm text-center" placeholder="-" value={load} onChange={e => setLoad(e.target.value)} />
                  }
                </div>
              )}
              <div><label className="label">Rec. sec</label><input className="input text-sm text-center" placeholder="60" value={rest} onChange={e => setRest(e.target.value)} /></div>
            </div>
          </>
        )}

        {/* Core fields */}
        {section.section_type === "core" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
              <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="15" value={reps} onChange={e => setReps(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Carico</label><input className="input text-sm text-center" placeholder="-" value={load} onChange={e => setLoad(e.target.value)} /></div>
              <div><label className="label">Rec. sec</label><input className="input text-sm text-center" placeholder="30" value={rest} onChange={e => setRest(e.target.value)} /></div>
            </div>
          </>
        )}

        {/* Workout fields */}
        {isWorkout && workoutSub === "cardioliss" && (
          <div><label className="label">Minuti</label>
            <input className="input text-sm text-center w-24" placeholder="10" value={reps} onChange={e => setReps(e.target.value)} />
          </div>
        )}
        {isWorkout && workoutSub === "fortime" && (
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Rounds</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
            <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="15" value={reps} onChange={e => setReps(e.target.value)} /></div>
            <div><label className="label">Carico</label><input className="input text-sm text-center" placeholder="20 KG" value={load} onChange={e => setLoad(e.target.value)} /></div>
          </div>
        )}
        {isWorkout && workoutSub !== "cardioliss" && workoutSub !== "fortime" && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="10" value={reps} onChange={e => setReps(e.target.value)} /></div>
            <div><label className="label">Carico</label><input className="input text-sm text-center" placeholder="20 KG" value={load} onChange={e => setLoad(e.target.value)} /></div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 text-sm py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">Annulla</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 text-sm py-2.5 rounded-xl font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: color }}
          >Salva</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Block ────────────────────────────────────────────
interface SectionBlockProps {
  section: WorkoutSection;
  lib: LibraryMap;
  editingExId: string | null;
  onToggleEdit: (id: string) => void;
  onUpdateEx: (id: string, field: keyof Exercise, val: string) => void;
  onDeleteEx: (sectionId: string, exId: string) => void;
  onSaveEx: (sectionId: string, ex: Exercise) => void;
  onAddEx: (sectionId: string) => void;
  onClearSection: (sectionId: string) => void;
}

function SectionBlock({ section, lib, editingExId, onToggleEdit, onUpdateEx, onDeleteEx, onSaveEx, onAddEx, onClearSection }: SectionBlockProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const libSuggestions: string[] = (() => {
    switch (section.section_type) {
      case "warmup":    return [...getLibNames(lib, "WARMUP", "CARDIO"), ...getLibNames(lib, "WARMUP", "MOBILITÀ"), ...getLibNames(lib, "WARMUP", "ATTIVAZIONE")];
      case "strength":  return getLibNames(lib, "FORZA", null);
      case "accessories": return getLibNames(lib, "ACCESSORI", null);
      case "core":      return getLibNames(lib, "CORE TRAINING", null);
      case "workout":   return getWorkoutNames(lib);
    }
  })();
  const color = SECTION_COLORS[section.section_type];
  const exercises = section.exercises ?? [];

  // Mappa subtype → cap time per i sotto-titoli workout (es. { amrap: "15", emom: "12" })
  const capTimeBySubtype: Record<string, string> = {};
  if (section.section_type === "workout" && section.section_subtype) {
    section.section_subtype.split("+").forEach((s, i) => {
      const cap = section.cap_time?.split("+")[i];
      if (cap) capTimeBySubtype[s] = cap;
    });
  }

  const subtypeLabel = section.section_type === "workout" && section.section_subtype
    ? (() => {
        const subtypes = section.section_subtype.split("+");
        const caps = section.cap_time?.split("+") ?? [];
        return subtypes.map((s, i) => {
          const label = WORKOUT_SUBTYPE_LABELS[s as WorkoutSubtype] ?? s;
          const cap = caps[i];
          return cap ? `${label} · ${cap} min` : label;
        }).join("  +  ");
      })()
    : null;

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "20", color }}>
            {SECTION_ICONS[section.section_type]}
          </div>
          <span className="font-bold text-sm text-gray-900 uppercase tracking-wide dark:text-gray-100">
            {SECTION_LABELS[section.section_type]}
          </span>
          {subtypeLabel && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "20", color }}>
              {subtypeLabel}
            </span>
          )}
          <span className="text-xs text-gray-400">{exercises.length} es.</span>
        </div>
        <button
          onClick={() => onAddEx(section.id)}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
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
      ) : (() => {
        const exercisesWithGroups = exercises.map(ex => {
          const { group, cleanNotes } = parseExerciseGroup(ex.notes);
          return { ...ex, _group: group, _cleanNotes: cleanNotes };
        });

        // Per workout: numero esercizio per sotto-gruppo (AMRAP: 1,2,3... EMOM: 1,2,3...)
        const groupCounters: Record<string, number> = {};
        const exercisesWithNumbers = exercisesWithGroups.map(ex => {
          if (section.section_type !== "workout") return { ...ex, _exNum: undefined as number | undefined };
          const g = ex._group ?? "__default__";
          groupCounters[g] = (groupCounters[g] ?? 0) + 1;
          return { ...ex, _exNum: groupCounters[g] };
        });

        return (
          <>
            {exercisesWithNumbers.map((ex, idx) => {
              const showHeader = ex._group !== null &&
                (idx === 0 || ex._group !== exercisesWithNumbers[idx - 1]._group) &&
                section.section_type !== "strength";
              return (
                <React.Fragment key={ex.id}>
                  {showHeader && (
                    <div className="px-4 pt-2 pb-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                        {GROUP_LABELS[ex._group!] ?? ex._group}
                        {ex._group && capTimeBySubtype[ex._group] ? ` · ${capTimeBySubtype[ex._group]} min` : ""}
                      </span>
                    </div>
                  )}
                  <div
                    onClick={() => !editingExId && onToggleEdit(ex.id)}
                    className={editingExId === ex.id ? "" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"}
                  >
                    <ExerciseRow
                      exercise={{ ...ex, notes: ex._cleanNotes }}
                      sectionType={section.section_type}
                      sectionSubtype={section.section_subtype}
                      libSuggestions={libSuggestions}
                      editing={editingExId === ex.id}
                      noteTag={ex._group}
                      exerciseNumber={ex._exNum}
                      onUpdate={onUpdateEx}
                      onDelete={(id) => onDeleteEx(section.id, id)}
                      onSave={(id) => {
                        const found = exercises.find(e => e.id === id);
                        if (found) onSaveEx(section.id, found);
                      }}
                    />
                  </div>
                </React.Fragment>
              );
            })}

            {/* Clear section */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              {confirmClear ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Cancellare tutti gli esercizi?</span>
                  <button
                    onClick={() => { onClearSection(section.id); setConfirmClear(false); }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >Conferma</button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >Annulla</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-[11px] text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Cancella tutti gli esercizi
                </button>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

// ─── Library types ────────────────────────────────────────────
type LibraryMap = Record<string, ExerciseLibrary[]>; // key = "CATEGORY|SUBCATEGORY"

function libKey(category: string, subcategory?: string | null, subSub?: string | null) {
  return `${category}|${subcategory ?? ""}|${subSub ?? ""}`;
}

function getLibNames(lib: LibraryMap, category: string, subcategory?: string | null, subSub?: string | null): string[] {
  return (lib[libKey(category, subcategory, subSub)] ?? []).map(e => e.name);
}

function getAllLibNames(lib: LibraryMap): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entries of Object.values(lib)) {
    for (const e of entries) {
      if (!seen.has(e.name)) { seen.add(e.name); result.push(e.name); }
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
}

// Aggregates ALL exercises from every WORKOUT sub-key (handles any subcategory structure in DB)
function getWorkoutNames(lib: LibraryMap): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const [key, entries] of Object.entries(lib)) {
    if (key.startsWith("WORKOUT|")) {
      for (const e of entries) {
        if (!seen.has(e.name)) { seen.add(e.name); result.push(e.name); }
      }
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
}

// Formatta il carico: aggiunge KG se numero puro, @ se percentuale
function formatLoad(load: string): string {
  if (!load || load === "-") return load;
  if (load.includes("%")) return `@${load}`;
  if (/kg/i.test(load)) return load;
  if (/^\d+([.,]\d+)?$/.test(load.trim())) return `${load} KG`;
  return load;
}

function getRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Bulk Add Modal ───────────────────────────────────────────

// Row types per sub-section
interface CardioRow    { name: string; minutes: string; notes: string }
interface MobilitaRow  { name: string; sets: string; reps: string; notes: string }
interface ForzaRow     { name: string; sets: string; reps: string; load: string; rest: string; notes: string }
interface AccessoriRow { name: string; sets: string; reps: string; load: string; rest: string; notes: string }
interface CoreRow      { name: string; sets: string; reps: string; load: string; rest: string; notes: string }
interface WorkoutRow   { name: string; reps: string; load: string; rounds: string; minutes: string; notes: string }

interface WorkoutBlock {
  subtype: WorkoutSubtype;
  capTime: string;
  rows: WorkoutRow[];
}

interface BulkState {
  warmup: {
    cardio: CardioRow[];
    mobilita: MobilitaRow[];
    attivazione: MobilitaRow[];
  };
  forza: {
    rows: ForzaRow[];
    libSub: string;
    tag: string;
    label: string;
  };
  accessori: {
    bodyweight: AccessoriRow[];
    manubri: AccessoriRow[];
    kettlebell: AccessoriRow[];
    bilanciere: AccessoriRow[];
  };
  core: CoreRow[];
  workout: {
    blocks: WorkoutBlock[]; // 1 or 2 selected workout types
  };
}

const mkCardioRow    = (name = ""): CardioRow    => ({ name, minutes: "5", notes: "" });
const mkMobilitaRow  = (name = ""): MobilitaRow  => ({ name, sets: "2", reps: "10", notes: "" });
const mkForzaRow     = (name = ""): ForzaRow     => ({ name, sets: "3", reps: "5", load: "", rest: "120", notes: "" });
const mkAccessoriRow = (name = ""): AccessoriRow => ({ name, sets: "3", reps: "12", load: "10", rest: "60", notes: "" });
const mkCoreRow      = (name = ""): CoreRow      => ({ name, sets: "3", reps: "15", load: "-", rest: "30", notes: "" });
const mkWorkoutRow   = (name = ""): WorkoutRow   => ({ name, reps: "10", load: "", rounds: "3", minutes: "10", notes: "" });

// Derives "UPPER" | "LOWER" | "FULL" from day label (e.g. "Day 1 · Lower Body")
function getDayMobilitaFilter(dayLabel: string): "UPPER" | "LOWER" | "FULL" | null {
  const l = dayLabel.toLowerCase();
  if (l.includes("upper")) return "UPPER";
  if (l.includes("lower")) return "LOWER";
  if (l.includes("full")) return "FULL";
  return null;
}

function buildInitialState(lib: LibraryMap, dayLabel = ""): BulkState {
  // Pick n random names and pad with empty strings to always reach n rows
  const pickPadded = (cat: string, sub: string | null, n: number, subSub?: string | null): string[] => {
    const names = getRandom(getLibNames(lib, cat, sub, subSub), n);
    return [...names, ...Array(Math.max(0, n - names.length)).fill("")];
  };

  const dayFilter = getDayMobilitaFilter(dayLabel);
  const forzaMap = {
    UPPER: { libSub: "UPPER BODY", tag: "upper", label: "Upper Body" },
    LOWER: { libSub: "LOWER BODY", tag: "lower", label: "Lower Body" },
    FULL:  { libSub: "FULL BODY",  tag: "full",  label: "Full Body"  },
    null:  { libSub: "FULL BODY",  tag: "full",  label: "Full Body"  },
  };
  const forza = forzaMap[dayFilter ?? "null"];

  return {
    warmup: {
      cardio: pickPadded("WARMUP", "CARDIO", 2).map(mkCardioRow),
      mobilita: pickPadded("WARMUP", "MOBILITÀ", 4, dayFilter).map(mkMobilitaRow),
      attivazione: getRandom(getLibNames(lib, "WARMUP", "ATTIVAZIONE", dayFilter), 2).map(mkMobilitaRow),
    },
    forza: {
      rows: pickPadded("FORZA", forza.libSub, 3).map(mkForzaRow),
      libSub: forza.libSub,
      tag: forza.tag,
      label: forza.label,
    },
    accessori: {
      bodyweight: pickPadded("ACCESSORI", "BODYWEIGHT", 1).map(mkAccessoriRow),
      manubri: pickPadded("ACCESSORI", "MANUBRI", 3).map(mkAccessoriRow),
      kettlebell: pickPadded("ACCESSORI", "KETTLEBELL", 3).map(mkAccessoriRow),
      bilanciere: pickPadded("ACCESSORI", "BILANCIERE", 2).map(mkAccessoriRow),
    },
    core: pickPadded("CORE TRAINING", null, 4).map(mkCoreRow),
    workout: {
      blocks: [{
        subtype: "amrap",
        capTime: "15",
        rows: pickPadded("WORKOUT", null, 6).map(mkWorkoutRow),
      }],
    },
  };
}

type ActiveTab = "warmup" | "forza" | "accessori" | "core" | "workout";

const TAB_LABELS: Record<ActiveTab, string> = {
  warmup: "Warm Up",
  forza: "Forza",
  accessori: "Accessori",
  core: "Core",
  workout: "Workout",
};

const TAB_COLORS: Record<ActiveTab, string> = {
  warmup: "#16A34A",
  forza: "#C0D738",
  accessori: "#7C3AED",
  core: "#0EA5E9",
  workout: "#EA580C",
};

interface AutocompleteInputProps {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  globalSuggestions?: string[]; // full library — used when coach is typing
  placeholder?: string;
  className?: string;
  strict?: boolean; // only allow library selections; free text is blocked
}

function BulkNoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={e => e.stopPropagation()}>
      {open ? (
        <div className="flex gap-2 items-center mt-1">
          <input
            autoFocus
            className="input text-xs flex-1"
            placeholder="Nota (opz.)"
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => { if (!value.trim()) setOpen(false); }}
          />
          <button onClick={() => setOpen(false)} className="text-[10px] text-gray-400 hover:text-gray-600 flex-shrink-0">✓</button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-[10px] text-gray-400 hover:text-gray-500 transition-colors mt-1"
        >
          {value.trim() ? `✏️ ${value}` : "+ nota"}
        </button>
      )}
    </div>
  );
}

function AutocompleteInput({ value, onChange, suggestions, globalSuggestions, placeholder, className, strict }: AutocompleteInputProps) {
  const [inputText, setInputText] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  // Sync display when parent resets value externally
  useEffect(() => { setInputText(value); setError(false); }, [value]);

  const isTyping = inputText.trim().length > 0;
  const pool = (isTyping && globalSuggestions) ? globalSuggestions : suggestions;
  const filtered = pool.filter(s => !isTyping || s.toLowerCase().includes(inputText.toLowerCase()));
  const noMatches = strict && isTyping && filtered.length === 0;

  const handleSelect = (name: string) => {
    setInputText(name);
    onChange(name);
    setOpen(false);
    setError(false);
  };

  const handleChange = (text: string) => {
    setInputText(text);
    setError(false);
    if (!strict) onChange(text);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      if (strict && inputText.trim()) {
        const checkList = (isTyping && globalSuggestions) ? globalSuggestions : suggestions;
        const isValid = checkList.some(s => s.toLowerCase() === inputText.toLowerCase());
        if (!isValid) {
          setError(true);
          setTimeout(() => { setInputText(value); setError(false); }, 2500);
        }
      }
    }, 150);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <input
        className={`${className ?? "input text-sm flex-1 w-full"} ${error ? "!border-red-400 dark:!border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
        placeholder={strict ? (placeholder ?? "Seleziona dalla libreria") : (placeholder ?? "Nome esercizio")}
        value={inputText}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
      />
      {error && (
        <p className="text-[10px] text-red-500 mt-0.5 px-1">Non presente in libreria — seleziona dalla lista o aggiungilo prima</p>
      )}
      {open && (filtered.length > 0 || noMatches) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-h-44 overflow-y-auto">
          {filtered.length > 0 ? filtered.slice(0, 100).map(name => (
            <button
              key={name}
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(name); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
            >
              {name}
            </button>
          )) : (
            <div className="px-3 py-3 text-xs text-red-500 dark:text-red-400 flex items-start gap-2">
              <span className="text-base leading-none flex-shrink-0">⚠️</span>
              <span>«{inputText}» non è in libreria.<br/>Aggiungilo prima dalla libreria esercizi.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      className="input text-xs"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="-">-</option>
      {LOAD_OPTIONS.map(o => (
        <option key={o} value={o}>{o} KG</option>
      ))}
    </select>
  );
}

function SubgroupLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <div className="h-px flex-1" style={{ backgroundColor: color + "40" }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <div className="h-px flex-1" style={{ backgroundColor: color + "40" }} />
    </div>
  );
}

function BulkAddModal({ sections, dayLabel, lib, libLoaded, onSave, onCancel }: {
  sections: WorkoutSection[];
  dayLabel: string;
  lib: LibraryMap;
  libLoaded: boolean;
  onSave: (state: BulkState) => Promise<void>;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("warmup");
  const [state, setState] = useState<BulkState>(() => buildInitialState({}, dayLabel));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (libLoaded) setState(buildInitialState(lib, dayLabel));
  }, [libLoaded]);

  const color = TAB_COLORS[activeTab];

  // Count filled rows
  const countFilled = (s: BulkState): number => {
    let n = 0;
    s.warmup.cardio.forEach(r => { if (r.name.trim()) n++; });
    s.warmup.mobilita.forEach(r => { if (r.name.trim()) n++; });
    s.warmup.attivazione.forEach(r => { if (r.name.trim()) n++; });
    s.forza.rows.forEach(r => { if (r.name.trim()) n++; });
    s.accessori.bodyweight.forEach(r => { if (r.name.trim()) n++; });
    s.accessori.manubri.forEach(r => { if (r.name.trim()) n++; });
    s.accessori.kettlebell.forEach(r => { if (r.name.trim()) n++; });
    s.accessori.bilanciere.forEach(r => { if (r.name.trim()) n++; });
    s.core.forEach(r => { if (r.name.trim()) n++; });
    s.workout.blocks.forEach(b => b.rows.forEach(r => { if (r.name.trim()) n++; }));
    return n;
  };

  const totalFilled = countFilled(state);

  // Updaters
  const updW = <K extends keyof BulkState["warmup"]>(sub: K, idx: number, patch: Partial<BulkState["warmup"][K][0]>) =>
    setState(prev => ({
      ...prev,
      warmup: {
        ...prev.warmup,
        [sub]: (prev.warmup[sub] as unknown as Record<string, string>[]).map((r, i) => i === idx ? { ...r, ...patch } : r),
      },
    }));

  const updF = (idx: number, patch: Partial<ForzaRow>) =>
    setState(prev => ({
      ...prev,
      forza: {
        ...prev.forza,
        rows: prev.forza.rows.map((r, i) => i === idx ? { ...r, ...patch } : r),
      },
    }));

  const updA = <K extends keyof BulkState["accessori"]>(sub: K, idx: number, patch: Partial<AccessoriRow>) =>
    setState(prev => ({
      ...prev,
      accessori: {
        ...prev.accessori,
        [sub]: (prev.accessori[sub] as AccessoriRow[]).map((r, i) => i === idx ? { ...r, ...patch } : r),
      },
    }));

  const updC = (idx: number, patch: Partial<CoreRow>) =>
    setState(prev => ({
      ...prev,
      core: prev.core.map((r, i) => i === idx ? { ...r, ...patch } : r),
    }));

  const updWk = (blockIdx: number, rowIdx: number, patch: Partial<WorkoutRow>) =>
    setState(prev => ({
      ...prev,
      workout: {
        blocks: prev.workout.blocks.map((b, bi) =>
          bi === blockIdx ? { ...b, rows: b.rows.map((r, ri) => ri === rowIdx ? { ...r, ...patch } : r) } : b
        ),
      },
    }));

  // Add/remove row helpers
  const addW = (sub: "cardio" | "mobilita" | "attivazione") =>
    setState(prev => ({
      ...prev,
      warmup: { ...prev.warmup, [sub]: [...prev.warmup[sub], sub === "cardio" ? mkCardioRow() : mkMobilitaRow()] },
    }));
  const removeW = (sub: "cardio" | "mobilita" | "attivazione", idx: number) =>
    setState(prev => ({
      ...prev,
      warmup: { ...prev.warmup, [sub]: (prev.warmup[sub] as (CardioRow | MobilitaRow)[]).filter((_, i) => i !== idx) },
    }));

  const addF = () =>
    setState(prev => ({ ...prev, forza: { ...prev.forza, rows: [...prev.forza.rows, mkForzaRow()] } }));
  const removeF = (idx: number) =>
    setState(prev => ({ ...prev, forza: { ...prev.forza, rows: prev.forza.rows.filter((_, i) => i !== idx) } }));

  const addA = (sub: keyof BulkState["accessori"]) =>
    setState(prev => ({
      ...prev,
      accessori: { ...prev.accessori, [sub]: [...(prev.accessori[sub] as AccessoriRow[]), mkAccessoriRow()] },
    }));
  const removeA = (sub: keyof BulkState["accessori"], idx: number) =>
    setState(prev => ({
      ...prev,
      accessori: { ...prev.accessori, [sub]: (prev.accessori[sub] as AccessoriRow[]).filter((_, i) => i !== idx) },
    }));

  const addCoreRow = () =>
    setState(prev => ({ ...prev, core: [...prev.core, mkCoreRow()] }));
  const removeCoreRow = (idx: number) =>
    setState(prev => ({ ...prev, core: prev.core.filter((_, i) => i !== idx) }));

  const addWkRow = (blockIdx: number) =>
    setState(prev => ({
      ...prev,
      workout: {
        blocks: prev.workout.blocks.map((b, bi) =>
          bi === blockIdx ? { ...b, rows: [...b.rows, mkWorkoutRow()] } : b
        ),
      },
    }));
  const removeWkRow = (blockIdx: number, rowIdx: number) =>
    setState(prev => ({
      ...prev,
      workout: {
        blocks: prev.workout.blocks.map((b, bi) =>
          bi === blockIdx ? { ...b, rows: b.rows.filter((_, ri) => ri !== rowIdx) } : b
        ),
      },
    }));

  const WORKOUT_LIB_SUB: Record<WorkoutSubtype, string> = {
    amrap: "AMRAP", emom: "EMOM", fortime: "FOR TIME", cardioliss: "CARDIO LISS",
  };
  const toggleWorkoutBlock = (subtype: WorkoutSubtype) => {
    setState(prev => {
      const existing = prev.workout.blocks.find(b => b.subtype === subtype);
      if (existing) {
        if (prev.workout.blocks.length <= 1) return prev; // keep at least 1
        return { ...prev, workout: { blocks: prev.workout.blocks.filter(b => b.subtype !== subtype) } };
      }
      if (prev.workout.blocks.length >= 2) return prev; // max 2
      const specific = getLibNames(lib, "WORKOUT", WORKOUT_LIB_SUB[subtype]);
      const pool = specific.length ? specific : getWorkoutNames(lib);
      const picked = getRandom(pool, 6);
      const names = [...picked, ...Array(Math.max(0, 6 - picked.length)).fill("")];
      const newBlock: WorkoutBlock = { subtype, capTime: "15", rows: names.map(mkWorkoutRow) };
      return { ...prev, workout: { blocks: [...prev.workout.blocks, newBlock] } };
    });
  };

  const addBtn = (onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5 px-1 py-0.5 transition-colors"
    >
      <span className="text-sm font-medium leading-none">+</span> {label}
    </button>
  );

  const removeBtn = (onClick: () => void) => (
    <button
      onClick={onClick}
      className="text-gray-300 hover:text-red-400 flex-shrink-0 text-lg leading-none transition-colors ml-auto"
      title="Rimuovi"
    >×</button>
  );

  const handleSave = async () => {
    setSaving(true);
    await onSave(state);
    setSaving(false);
  };

  const TABS: ActiveTab[] = ["warmup", "forza", "accessori", "core", "workout"];

  const rowBox = (children: React.ReactNode) => (
    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
      {children}
    </div>
  );

  if (!libLoaded) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="text-sm text-gray-400 animate-pulse">Caricamento libreria...</div>
      </div>
    );
  }

  // Tab contents
  const mobFilter = getDayMobilitaFilter(dayLabel);
  const mobSubLabel = mobFilter ? ` · ${mobFilter.charAt(0) + mobFilter.slice(1).toLowerCase()}` : "";

  const renderWarmup = () => (
    <div className="space-y-1">
      <SubgroupLabel label="Cardio" color={color} />
      {state.warmup.cardio.map((row, i) => (
        <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1">
          <div className="flex gap-2 items-center">
            <AutocompleteInput
              value={row.name}
              onChange={v => updW("cardio", i, { name: v })}
              suggestions={getLibNames(lib, "WARMUP", "CARDIO")}
              globalSuggestions={getAllLibNames(lib)}
              strict
              placeholder="Esercizio cardio"
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                className="input text-xs w-14 text-center"
                value={row.minutes}
                onChange={e => updW("cardio", i, { minutes: e.target.value })}
                placeholder="10"
              />
              <span className="text-xs text-gray-400">min</span>
            </div>
            {removeBtn(() => removeW("cardio", i))}
          </div>
          <BulkNoteField value={row.notes} onChange={v => updW("cardio", i, { notes: v })} />
        </div>
      ))}
      {addBtn(() => addW("cardio"), "aggiungi cardio")}

      <SubgroupLabel label={`Mobilità${mobSubLabel}`} color={color} />
      {state.warmup.mobilita.map((row, i) => (
        <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1">
          <div className="flex gap-2 items-center">
            <AutocompleteInput
              value={row.name}
              onChange={v => updW("mobilita", i, { name: v })}
              suggestions={getLibNames(lib, "WARMUP", "MOBILITÀ", mobFilter)}
              globalSuggestions={getAllLibNames(lib)}
              strict
              placeholder="Esercizio mobilità"
            />
            <div className="flex gap-1 flex-shrink-0">
              <input className="input text-xs w-12 text-center" value={row.sets} onChange={e => updW("mobilita", i, { sets: e.target.value })} placeholder="2" />
              <span className="text-xs text-gray-400 self-center">x</span>
              <input className="input text-xs w-12 text-center" value={row.reps} onChange={e => updW("mobilita", i, { reps: e.target.value })} placeholder="10" />
            </div>
            {removeBtn(() => removeW("mobilita", i))}
          </div>
          <BulkNoteField value={row.notes} onChange={v => updW("mobilita", i, { notes: v })} />
        </div>
      ))}
      {addBtn(() => addW("mobilita"), "aggiungi mobilità")}

      <SubgroupLabel label={`Attivazione${mobSubLabel}`} color={color} />
      {state.warmup.attivazione.map((row, i) => (
        <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1">
          <div className="flex gap-2 items-center">
            <AutocompleteInput
              value={row.name}
              onChange={v => updW("attivazione", i, { name: v })}
              suggestions={mobFilter === "FULL"
                ? [...getLibNames(lib, "WARMUP", "ATTIVAZIONE", "UPPER"), ...getLibNames(lib, "WARMUP", "ATTIVAZIONE", "LOWER")]
                : getLibNames(lib, "WARMUP", "ATTIVAZIONE", mobFilter)}
              globalSuggestions={getAllLibNames(lib)}
              strict
              placeholder="Esercizio attivazione"
            />
            <div className="flex gap-1 flex-shrink-0">
              <input className="input text-xs w-12 text-center" value={row.sets} onChange={e => updW("attivazione", i, { sets: e.target.value })} placeholder="2" />
              <span className="text-xs text-gray-400 self-center">x</span>
              <input className="input text-xs w-12 text-center" value={row.reps} onChange={e => updW("attivazione", i, { reps: e.target.value })} placeholder="10" />
            </div>
            {removeBtn(() => removeW("attivazione", i))}
          </div>
          <BulkNoteField value={row.notes} onChange={v => updW("attivazione", i, { notes: v })} />
        </div>
      ))}
      {addBtn(() => addW("attivazione"), "aggiungi attivazione")}
    </div>
  );

  const renderForza = () => (
    <div className="space-y-1">
      <SubgroupLabel label={state.forza.label} color={color} />
      {state.forza.rows.map((row, i) => (
        <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
          <div className="flex gap-2 items-center">
            <AutocompleteInput
              value={row.name}
              onChange={v => updF(i, { name: v })}
              suggestions={getLibNames(lib, "FORZA", state.forza.libSub)}
              globalSuggestions={getAllLibNames(lib)}
              strict
              placeholder={`Esercizio ${state.forza.label.toLowerCase()}`}
            />
            {removeBtn(() => removeF(i))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div>
              <label className="label">Serie</label>
              <input className="input text-xs text-center" value={row.sets} onChange={e => updF(i, { sets: e.target.value })} placeholder="3" />
            </div>
            <div>
              <label className="label">Reps</label>
              <input className="input text-xs text-center" value={row.reps} onChange={e => updF(i, { reps: e.target.value })} placeholder="5" />
            </div>
            <div>
              <label className="label">Carico</label>
              <input className="input text-xs text-center" value={row.load} onChange={e => updF(i, { load: e.target.value })} placeholder="80%" />
            </div>
            <div>
              <label className="label">Rec. sec</label>
              <input className="input text-xs text-center" value={row.rest} onChange={e => updF(i, { rest: e.target.value })} placeholder="120" />
            </div>
          </div>
          <BulkNoteField value={row.notes} onChange={v => updF(i, { notes: v })} />
        </div>
      ))}
      {addBtn(addF, "aggiungi esercizio")}
    </div>
  );

  const accessoriGroup = (label: string, sub: keyof BulkState["accessori"], libSub: string, loadType: "select" | "free" | "none") => (
    <>
      <SubgroupLabel label={label} color={color} />
      {(state.accessori[sub] as AccessoriRow[]).map((row, i) => (
        <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
          <div className="flex gap-2 items-center">
            <AutocompleteInput
              value={row.name}
              onChange={v => updA(sub, i, { name: v })}
              suggestions={getLibNames(lib, "ACCESSORI", libSub)}
              globalSuggestions={getAllLibNames(lib)}
              strict
              placeholder={`Esercizio ${label.toLowerCase()}`}
            />
            {removeBtn(() => removeA(sub, i))}
          </div>
          <div className={`grid gap-1.5 ${loadType === "none" ? "grid-cols-3" : "grid-cols-4"}`}>
            <div>
              <label className="label">Serie</label>
              <input className="input text-xs text-center" value={row.sets} onChange={e => updA(sub, i, { sets: e.target.value })} placeholder="3" />
            </div>
            <div>
              <label className="label">Reps</label>
              <input className="input text-xs text-center" value={row.reps} onChange={e => updA(sub, i, { reps: e.target.value })} placeholder="12" />
            </div>
            {loadType !== "none" && (
              <div>
                <label className="label">Carico</label>
                {loadType === "select"
                  ? <LoadSelect value={row.load} onChange={v => updA(sub, i, { load: v })} />
                  : <input className="input text-xs text-center" value={row.load} onChange={e => updA(sub, i, { load: e.target.value })} placeholder="Carico" />
                }
              </div>
            )}
            <div>
              <label className="label">Rec. sec</label>
              <input className="input text-xs text-center" value={row.rest} onChange={e => updA(sub, i, { rest: e.target.value })} placeholder="60" />
            </div>
          </div>
          <BulkNoteField value={row.notes} onChange={v => updA(sub, i, { notes: v })} />
        </div>
      ))}
      {addBtn(() => addA(sub), `aggiungi ${label.toLowerCase()}`)}
    </>
  );

  const renderAccessori = () => (
    <div className="space-y-1">
      {accessoriGroup("Bodyweight", "bodyweight", "BODYWEIGHT", "none")}
      {accessoriGroup("Manubri", "manubri", "MANUBRI", "select")}
      {accessoriGroup("Kettlebell", "kettlebell", "KETTLEBELL", "select")}
      {accessoriGroup("Bilanciere", "bilanciere", "BILANCIERE", "free")}
    </div>
  );

  const renderCore = () => (
    <div className="space-y-1">
      {state.core.map((row, i) => (
        <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
          <div className="flex gap-2 items-center">
            <AutocompleteInput
              value={row.name}
              onChange={v => updC(i, { name: v })}
              suggestions={getLibNames(lib, "CORE TRAINING", null)}
              globalSuggestions={getAllLibNames(lib)}
              strict
              placeholder="Esercizio core"
            />
            {removeBtn(() => removeCoreRow(i))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div>
              <label className="label">Serie</label>
              <input className="input text-xs text-center" value={row.sets} onChange={e => updC(i, { sets: e.target.value })} placeholder="3" />
            </div>
            <div>
              <label className="label">Reps</label>
              <input className="input text-xs text-center" value={row.reps} onChange={e => updC(i, { reps: e.target.value })} placeholder="15" />
            </div>
            <div>
              <label className="label">Carico</label>
              <input className="input text-xs text-center" value={row.load} onChange={e => updC(i, { load: e.target.value })} placeholder="-" />
            </div>
            <div>
              <label className="label">Rec. sec</label>
              <input className="input text-xs text-center" value={row.rest} onChange={e => updC(i, { rest: e.target.value })} placeholder="30" />
            </div>
          </div>
          <BulkNoteField value={row.notes} onChange={v => updC(i, { notes: v })} />
        </div>
      ))}
      {addBtn(addCoreRow, "aggiungi esercizio")}
    </div>
  );

  const renderWorkout = () => {
    const { blocks } = state.workout;
    const activeSubtypes = blocks.map(b => b.subtype);

    return (
      <div className="space-y-4">
        {/* Multi-select pill buttons (max 2) */}
        <div>
          <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Seleziona tipo (max 2)</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["amrap", "emom", "fortime", "cardioliss"] as WorkoutSubtype[]).map(t => {
              const isActive = activeSubtypes.includes(t);
              const isDisabled = !isActive && activeSubtypes.length >= 2;
              return (
                <button
                  key={t}
                  onClick={() => toggleWorkoutBlock(t)}
                  disabled={isDisabled}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                    isActive
                      ? "border-transparent text-white"
                      : isDisabled
                      ? "border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed"
                      : "border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400"
                  }`}
                  style={isActive ? { backgroundColor: color } : {}}
                >
                  {WORKOUT_SUBTYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-block rows */}
        {blocks.map((block, blockIdx) => {
          const isCardioliss = block.subtype === "cardioliss";
          return (
            <div key={block.subtype} className="space-y-2">
              {/* Block header with cap time */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                  {WORKOUT_SUBTYPE_LABELS[block.subtype]}
                </span>
                {!isCardioliss && (
                  <div className="flex items-center gap-1 ml-auto">
                    <label className="text-[10px] text-gray-400">Cap:</label>
                    <input
                      className="input text-xs w-16 text-center"
                      value={block.capTime}
                      onChange={e => setState(prev => ({
                        ...prev,
                        workout: {
                          blocks: prev.workout.blocks.map((b, bi) =>
                            bi === blockIdx ? { ...b, capTime: e.target.value } : b
                          ),
                        },
                      }))}
                      placeholder="15"
                    />
                    <span className="text-[10px] text-gray-400">min</span>
                  </div>
                )}
              </div>

              {/* Rows */}
              <div className="space-y-1.5">
                {block.rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                    {isCardioliss ? (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <AutocompleteInput
                            value={row.name}
                            onChange={v => updWk(blockIdx, rowIdx, { name: v })}
                            suggestions={getWorkoutNames(lib)}
                            globalSuggestions={getAllLibNames(lib)}
                            strict
                            placeholder="Esercizio cardio"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input className="input text-xs w-14 text-center" value={row.minutes} onChange={e => updWk(blockIdx, rowIdx, { minutes: e.target.value })} placeholder="10" />
                            <span className="text-xs text-gray-400">min</span>
                          </div>
                          {removeBtn(() => removeWkRow(blockIdx, rowIdx))}
                        </div>
                        <BulkNoteField value={row.notes} onChange={v => updWk(blockIdx, rowIdx, { notes: v })} />
                      </div>
                    ) : block.subtype === "fortime" ? (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center flex-wrap">
                          <input className="input text-xs w-16 text-center flex-shrink-0" value={row.rounds} onChange={e => updWk(blockIdx, rowIdx, { rounds: e.target.value })} placeholder="Rounds" />
                          <AutocompleteInput
                            value={row.name}
                            onChange={v => updWk(blockIdx, rowIdx, { name: v })}
                            suggestions={getWorkoutNames(lib)}
                            globalSuggestions={getAllLibNames(lib)}
                            strict
                            placeholder="Esercizio"
                          />
                          <input className="input text-xs w-16 text-center flex-shrink-0" value={row.reps} onChange={e => updWk(blockIdx, rowIdx, { reps: e.target.value })} placeholder="15 reps" />
                          <input className="input text-xs w-20 text-center flex-shrink-0" value={row.load} onChange={e => updWk(blockIdx, rowIdx, { load: e.target.value })} placeholder="20 KG" />
                          {removeBtn(() => removeWkRow(blockIdx, rowIdx))}
                        </div>
                        <BulkNoteField value={row.notes} onChange={v => updWk(blockIdx, rowIdx, { notes: v })} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <AutocompleteInput
                            value={row.name}
                            onChange={v => updWk(blockIdx, rowIdx, { name: v })}
                            suggestions={getWorkoutNames(lib)}
                            globalSuggestions={getAllLibNames(lib)}
                            strict
                            placeholder="Esercizio"
                          />
                          <input className="input text-xs w-16 text-center flex-shrink-0" value={row.reps} onChange={e => updWk(blockIdx, rowIdx, { reps: e.target.value })} placeholder="10 reps" />
                          <input className="input text-xs w-20 text-center flex-shrink-0" value={row.load} onChange={e => updWk(blockIdx, rowIdx, { load: e.target.value })} placeholder="20 KG" />
                          {removeBtn(() => removeWkRow(blockIdx, rowIdx))}
                        </div>
                        <BulkNoteField value={row.notes} onChange={v => updWk(blockIdx, rowIdx, { notes: v })} />
                      </div>
                    )}
                  </div>
                ))}
                {addBtn(() => addWkRow(blockIdx), "aggiungi esercizio")}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === tab ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400 dark:text-gray-500"
            }`}
            style={activeTab === tab ? { color: TAB_COLORS[tab] } : {}}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-[60vh] overflow-y-auto pr-0.5">
        {activeTab === "warmup" && renderWarmup()}
        {activeTab === "forza" && renderForza()}
        {activeTab === "accessori" && renderAccessori()}
        {activeTab === "core" && renderCore()}
        {activeTab === "workout" && renderWorkout()}
      </div>

      {/* Footer */}
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
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [lib, setLib] = useState<LibraryMap>({});
  const [libLoaded, setLibLoaded] = useState(false);
  const [addModalSection, setAddModalSection] = useState<WorkoutSection | null>(null);

  // Load exercise library once
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("exercise_library").select("*");
      if (!data) { setLibLoaded(true); return; }
      const map: LibraryMap = {};
      (data as ExerciseLibrary[]).forEach(e => {
        const key = libKey(e.category, e.subcategory);
        if (!map[key]) map[key] = [];
        map[key].push(e);
        if (e.sub_subcategory) {
          const key3 = libKey(e.category, e.subcategory, e.sub_subcategory);
          if (!map[key3]) map[key3] = [];
          map[key3].push(e);
        }
        const keyNoSub = libKey(e.category, null);
        if (!map[keyNoSub]) map[keyNoSub] = [];
        if (!map[keyNoSub].find(x => x.id === e.id)) map[keyNoSub].push(e);
      });
      setLib(map);
      setLibLoaded(true);
    };
    load();
  }, []);

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

    // Ensure all 5 sections exist; create missing ones
    const existingTypes = (secs ?? []).map((s: WorkoutSection) => s.section_type);
    const missingSections = SECTION_ORDER.filter(t => !existingTypes.includes(t));

    if (missingSections.length > 0) {
      // Insert one by one so a single failure (e.g. ENUM mismatch for "core") doesn't block the others
      await Promise.allSettled(
        missingSections.map(t =>
          supabase.from("workout_sections").insert({
            day_id: dayId,
            section_type: t,
            order_index: SECTION_ORDER.indexOf(t),
          })
        )
      );

      const { data: secs2 } = await supabase
        .from("workout_sections")
        .select("*, exercises(*)")
        .eq("day_id", dayId)
        .order("order_index");
      setSections(
        SECTION_ORDER
          .map(type => (secs2 ?? []).find((s: WorkoutSection) => s.section_type === type)!)
          .filter(Boolean)
      );
    } else {
      setSections(
        SECTION_ORDER
          .map(type => (secs ?? []).find((s: WorkoutSection) => s.section_type === type)!)
          .filter(Boolean)
      );
    }
    setLoading(false);
  }, [dayId, clientId, weekId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Exercise operations ──────────────────────────────────────
  const handleAddExercise = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) setAddModalSection(section);
  };

  const handleAddExerciseConfirm = async (data: { name: string; sets?: string; reps?: string; load?: string; rest_time?: string; notes?: string }) => {
    if (!addModalSection) return;
    const existingCount = addModalSection.exercises?.length ?? 0;
    const { data: inserted } = await supabase.from("exercises").insert({
      section_id: addModalSection.id,
      name: data.name,
      sets: data.sets ?? null,
      reps: data.reps ?? null,
      load: data.load ?? null,
      rest_time: data.rest_time ?? null,
      notes: data.notes ?? null,
      order_index: existingCount,
    }).select().single();

    if (inserted) {
      setSections(prev => prev.map(s => s.id === addModalSection.id
        ? { ...s, exercises: [...(s.exercises ?? []), inserted] }
        : s
      ));
    }
    setAddModalSection(null);
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

  const handleClearAll = async () => {
    await Promise.all(sections.map(s => supabase.from("exercises").delete().eq("section_id", s.id)));
    setSections(prev => prev.map(s => ({ ...s, exercises: [] })));
    setEditingExId(null);
    setConfirmClearAll(false);
  };

  const handleClearSection = async (sectionId: string) => {
    await supabase.from("exercises").delete().eq("section_id", sectionId);
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, exercises: [] } : s));
    setEditingExId(null);
  };

  const handleToggleEdit = (id: string) => {
    setEditingExId(prev => prev === id ? null : id);
  };

  const handleBulkSave = async (bulkState: BulkState) => {
    const workoutSection = sections.find(s => s.section_type === "workout");
    if (workoutSection) {
      const combinedSubtype = bulkState.workout.blocks.map(b => b.subtype).join("+");
      const capTimeParts = bulkState.workout.blocks.map(b =>
        b.subtype !== "cardioliss" ? (b.capTime || "") : ""
      );
      const capTimeEncoded = capTimeParts.join("+").replace(/^\++$/, "") || null;
      await supabase.from("workout_sections").update({
        section_subtype: combinedSubtype,
        cap_time: capTimeEncoded,
      }).eq("id", workoutSection.id);
    }

    // Build all exercise rows to insert
    interface InsertRow {
      section_id: string;
      name: string;
      sets: string | null;
      reps: string | null;
      load: string | null;
      rest_time: string | null;
      notes: string | null;
      order_index: number;
    }

    const toInsert: InsertRow[] = [];

    const push = (sectionType: SectionType, rows: { name: string; sets?: string; reps?: string; load?: string; rest?: string; notes?: string }[]) => {
      const section = sections.find(s => s.section_type === sectionType);
      if (!section) return;
      const existingCount = section.exercises?.length ?? 0;
      rows.filter(r => r.name.trim()).forEach((r, i) => {
        toInsert.push({
          section_id: section.id,
          name: r.name.trim(),
          sets: r.sets?.trim() || null,
          reps: r.reps?.trim() || null,
          load: r.load?.trim() && r.load.trim() !== "-" ? r.load.trim() : null,
          rest_time: r.rest?.trim() ? `${r.rest.trim()} sec` : null,
          notes: r.notes?.trim() || null,
          order_index: existingCount + i,
        });
      });
    };

    // Warmup: cardio
    const warmupSection = sections.find(s => s.section_type === "warmup");
    if (warmupSection) {
      const warmupRows: InsertRow[] = [];
      let warmupCount = warmupSection.exercises?.length ?? 0;

      bulkState.warmup.cardio.filter(r => r.name.trim()).forEach((r, i) => {
        warmupRows.push({
          section_id: warmupSection.id,
          name: r.name.trim(),
          sets: null,
          reps: r.minutes ? `${r.minutes} min` : null,
          load: null,
          rest_time: null,
          notes: tagNotes("cardio", r.notes ?? ""),
          order_index: warmupCount + i,
        });
      });
      warmupCount += warmupRows.length;

      bulkState.warmup.mobilita.filter(r => r.name.trim()).forEach((r, i) => {
        warmupRows.push({
          section_id: warmupSection.id,
          name: r.name.trim(),
          sets: r.sets?.trim() || null,
          reps: r.reps?.trim() || null,
          load: null,
          rest_time: null,
          notes: tagNotes("mob", r.notes ?? ""),
          order_index: warmupCount + i,
        });
      });
      warmupCount += bulkState.warmup.mobilita.filter(r => r.name.trim()).length;

      bulkState.warmup.attivazione.filter(r => r.name.trim()).forEach((r, i) => {
        warmupRows.push({
          section_id: warmupSection.id,
          name: r.name.trim(),
          sets: r.sets?.trim() || null,
          reps: r.reps?.trim() || null,
          load: null,
          rest_time: null,
          notes: tagNotes("att", r.notes ?? ""),
          order_index: warmupCount + i,
        });
      });
      warmupCount += bulkState.warmup.attivazione.filter(r => r.name.trim()).length;

      toInsert.push(...warmupRows);
    }

    // Forza — solo il gruppo del tipo giornata
    push("strength", bulkState.forza.rows.map(r => ({
      name: r.name, sets: r.sets, reps: r.reps, load: r.load, rest: r.rest,
      notes: tagNotes(bulkState.forza.tag, r.notes ?? ""),
    })));

    // Accessori — MANUBRI/KB need "X KG" suffix, BILANCIERE free text, BODYWEIGHT no load
    const accessoriSection = sections.find(s => s.section_type === "accessories");
    if (accessoriSection) {
      const accRows: InsertRow[] = [];
      let accCount = accessoriSection.exercises?.length ?? 0;

      const pushAcc = (rows: AccessoriRow[], loadSuffix: string | null, groupTag: string) => {
        rows.filter(r => r.name.trim()).forEach((r, i) => {
          const loadVal = loadSuffix && r.load && r.load !== "-"
            ? `${r.load}${loadSuffix}`
            : (!loadSuffix && r.load && r.load !== "-" ? r.load : null);
          accRows.push({
            section_id: accessoriSection.id,
            name: r.name.trim(),
            sets: r.sets?.trim() || null,
            reps: r.reps?.trim() || null,
            load: loadVal,
            rest_time: r.rest ? `${r.rest} sec` : null,
            notes: tagNotes(groupTag, r.notes ?? ""),
            order_index: accCount + accRows.length,
          });
        });
      };

      pushAcc(bulkState.accessori.bodyweight, null, "bw");
      pushAcc(bulkState.accessori.manubri, " KG", "man");
      pushAcc(bulkState.accessori.kettlebell, " KG", "kb");
      // bilanciere: free text
      bulkState.accessori.bilanciere.filter(r => r.name.trim()).forEach(r => {
        accRows.push({
          section_id: accessoriSection.id,
          name: r.name.trim(),
          sets: r.sets?.trim() || null,
          reps: r.reps?.trim() || null,
          load: r.load?.trim() || null,
          rest_time: r.rest ? `${r.rest} sec` : null,
          notes: tagNotes("bar", r.notes ?? ""),
          order_index: accCount + accRows.length,
        });
      });

      toInsert.push(...accRows);
    }

    // Core
    push("core", bulkState.core.map(r => ({ name: r.name, sets: r.sets, reps: r.reps, load: r.load, rest: r.rest, notes: r.notes })));

    // Workout — iterate blocks, tag each exercise with its subtype
    if (workoutSection) {
      let wkCount = workoutSection.exercises?.length ?? 0;
      bulkState.workout.blocks.forEach(block => {
        const isCardioliss = block.subtype === "cardioliss";
        const isForTime = block.subtype === "fortime";
        block.rows.filter(r => r.name.trim()).forEach(r => {
          toInsert.push({
            section_id: workoutSection.id,
            name: r.name.trim(),
            sets: isForTime ? (r.rounds?.trim() || null) : null,
            reps: isCardioliss ? (r.minutes ? `${r.minutes} min` : null) : (r.reps?.trim() || null),
            load: r.load?.trim() || null,
            rest_time: null,
            notes: tagNotes(block.subtype, r.notes ?? ""),
            order_index: wkCount++,
          });
        });
      });
    }

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
        {[...Array(5)].map((_, i) => <div key={i} className="card h-32 bg-gray-100" />)}
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
              : <span className="text-xs text-green-600 font-medium">{totalExercises} es.</span>
            }
          </div>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {totalExercises > 0 && !editingExId && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 dark:bg-blue-900/20 dark:border-blue-900/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-xs text-blue-600 dark:text-blue-400">Tocca un esercizio per modificarlo</span>
          </div>
        )}

        {day.notes && (
          <div className="card p-4 border-l-4" style={{ borderLeftColor: "#C0D738" }}>
            <p className="text-sm text-gray-600 italic dark:text-gray-300">{day.notes}</p>
          </div>
        )}

        {sections.map(section => (
          <SectionBlock
            key={section.id}
            section={section}
            lib={lib}
            editingExId={editingExId}
            onToggleEdit={handleToggleEdit}
            onUpdateEx={handleUpdateExercise}
            onDeleteEx={handleDeleteExercise}
            onSaveEx={handleSaveExercise}
            onAddEx={handleAddExercise}
            onClearSection={handleClearSection}
          />
        ))}

        {/* Cancella tutto il giorno */}
        {totalExercises > 0 && (
          <div className="pb-2 text-center">
            {confirmClearAll ? (
              <div className="card p-4 text-center space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Cancellare tutti gli esercizi del giorno?</p>
                <p className="text-xs text-gray-400">Tutte le sezioni verranno svuotate.</p>
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 text-sm" onClick={() => setConfirmClearAll(false)}>Annulla</button>
                  <button className="btn-danger flex-1 text-sm" onClick={handleClearAll}>Sì, cancella tutto</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="text-xs text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 mx-auto"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Cancella tutti gli esercizi del giorno
              </button>
            )}
          </div>
        )}

        <div className="h-6" />
      </main>

      <Modal open={showBulkAdd} onClose={() => setShowBulkAdd(false)} title="Compila giorno">
        {showBulkAdd && sections.length > 0 && (
          <BulkAddModal
            sections={sections}
            dayLabel={day?.label ?? ""}
            lib={lib}
            libLoaded={libLoaded}
            onSave={handleBulkSave}
            onCancel={() => setShowBulkAdd(false)}
          />
        )}
      </Modal>

      {addModalSection && (
        <AddExerciseModal
          section={addModalSection}
          lib={lib}
          dayLabel={day?.label ?? ""}
          onSave={handleAddExerciseConfirm}
          onCancel={() => setAddModalSection(null)}
        />
      )}
    </div>
  );
}
