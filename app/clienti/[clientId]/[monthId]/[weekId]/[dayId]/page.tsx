"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  TrainingDay, WorkoutSection, Exercise, ExerciseLibrary,
  SectionType, SECTION_LABELS, SECTION_ORDER, DayStatus,
  WorkoutSubtype, WORKOUT_SUBTYPE_LABELS, LOAD_OPTIONS,
  ALL_PERFORMANCE_EXERCISES,
  EXERCISE_PARENT_MAP,
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
  lib?: LibraryMap;
  editing: boolean;
  noteTag?: string | null;
  exerciseNumber?: number;
  maxes?: Record<string, number>;
  onUpdate: (id: string, field: keyof Exercise, value: string) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
  onToggleEdit: (id: string) => void;
}

const TOOL_SUFFIXES = ["Bar", "DB", "KB", "MB", "SB"] as const;
function parseLoadAndTool(load: string): { rawLoad: string; tool: string } {
  for (const t of TOOL_SUFFIXES) {
    if (load.endsWith(` ${t}`)) return { rawLoad: load.slice(0, -(t.length + 1)), tool: t };
  }
  return { rawLoad: load, tool: "" };
}

function ExerciseRow({ exercise, sectionType, sectionSubtype, libSuggestions, lib, editing, noteTag, exerciseNumber, maxes, onUpdate, onDelete, onSave, onToggleEdit }: ExerciseRowProps) {
  // Detect cardio warmup: reps contiene "min"/"cal" oppure l'esercizio è rep-based senza load
  const isCardioWarmup = sectionType === "warmup" && !exercise.sets && !exercise.load;
  // Detect mobilità warmup: has sets + reps but no load
  const isMobilitaWarmup = sectionType === "warmup" && exercise.sets && !exercise.load;

  // unitMode iniziale: derivato dal valore salvato in reps ("5 min" → "min", "50 cal" → "cal")
  // Il check su "min"/"cal" ha priorità su sets, perché sets può essere residuo di salvataggi precedenti
  const initUnitMode = (() => {
    const r = exercise.reps ?? "";
    if (r.endsWith(" cal") || r === "cal") return "cal" as const;
    if (r.endsWith(" min") || r === "min") return "min" as const;
    if (sectionType === "warmup" && exercise.sets) return "rep" as const;
    // Per sezioni non-warmup: default dalla libreria
    return getVolumeMode(lib ? lookupExercise(lib, exercise.name) : undefined);
  })();
  const [editUnitMode, setEditUnitMode] = useState<"min" | "cal" | "rep">(initUnitMode);

  const rawExLoad = exercise.load ?? "";
  const isInitProg = rawExLoad.includes("|");
  const { rawLoad: initRawLoad, tool: initTool } = parseLoadAndTool(isInitProg ? "" : rawExLoad);
  const [editLoad, setEditLoad] = useState(isInitProg ? "" : initRawLoad);
  const [editTool, setEditTool] = useState<string>(initTool || detectTool(exercise.name));

  // Tool effettivo: stato utente → getDefaultTool dalla libreria (default_equip → primo equip flag) → detectTool dal nome
  const libDefaultTool = getDefaultTool(lib ? lookupExercise(lib, exercise.name) : undefined);
  const effectiveTool = editTool || libDefaultTool;
  const [editProgressive, setEditProgressive] = useState(isInitProg);
  const [editProgLoads, setEditProgLoads] = useState<string[]>(isInitProg ? rawExLoad.split("|") : []);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(exercise.notes ?? "");

  const commitLoad = (rawLoad: string, tool: string) => {
    const effectiveMode = detectLoadMode(rawLoad) ?? "kg";
    const toolImpliedByName = detectTool(exercise.name) === tool;
    const combined = (tool && effectiveMode === "kg" && !toolImpliedByName && rawLoad && rawLoad !== "-")
      ? `${rawLoad} ${tool}`
      : rawLoad;
    onUpdate(exercise.id, "load", combined);
  };

  const toggleEditProgressive = (on: boolean) => {
    if (!on) { setEditProgressive(false); setEditProgLoads([]); commitLoad(editLoad, effectiveTool); return; }
    const n = Math.max(1, parseInt(exercise.sets ?? "3") || 3);
    const base = editLoad && editLoad !== "-" ? editLoad : "80%";
    const loads = Array.from({ length: n }, () => base);
    setEditProgressive(true);
    setEditProgLoads(loads);
    onUpdate(exercise.id, "load", loads.join("|"));
  };

  const updateProgLoad = (si: number, val: string) => {
    const next = editProgLoads.map((l, j) => j === si ? val : l);
    setEditProgLoads(next);
    onUpdate(exercise.id, "load", next.join("|"));
  };

  // Chiamata quando il nome esercizio cambia: resetta load/tool/progressive dai dati libreria
  const resetOnNameChange = (newName: string) => {
    onUpdate(exercise.id, "name", newName);
    const newExLib = lib ? lookupExercise(lib, newName) : undefined;
    const isPerf = !!resolveMaxKey(newName);
    // Solo se troviamo un match esatto in libreria o è un esercizio di performance
    if (!newExLib && !isPerf) return;
    const newTool = getDefaultTool(newExLib) || detectTool(newName);
    // Usa computeLoad — stessa logica delle factory, valida per tutte le sezioni
    const newLoad = computeLoad(newName, newTool, newExLib);
    setEditLoad(newLoad);
    setEditTool(newTool);
    // Commit carico in DB
    const loadMode = detectLoadMode(newLoad) ?? "kg";
    const toolImplied = detectTool(newName) === newTool;
    const combined = (newTool && loadMode === "kg" && !toolImplied && newLoad && newLoad !== "-")
      ? `${newLoad} ${newTool}` : newLoad;
    onUpdate(exercise.id, "load", combined);
    // Reset progressivo se il nuovo esercizio non ha % come carico
    const newHasPct = newExLib ? (newExLib.load_pct || newExLib.default_load === "pct") : isPerf;
    if (editProgressive && !newHasPct) {
      setEditProgressive(false);
      setEditProgLoads([]);
    }
  };

  if (editing) {
    if (sectionType === "warmup" && noteTag === "cardio") {
      const exLib = lib ? lookupExercise(lib, exercise.name) : undefined;
      const hasMin = exLib ? exLib.unit_min : true;
      const hasCal = exLib ? exLib.unit_cal : false;
      const hasRep = exLib ? exLib.unit_rep : false;
      const hasKg  = exLib ? exLib.load_kg  : false;
      const cardioLibTools: string[] = exLib ? [
        ...(exLib.equip_barbell ? ["Bar"] : []),
        ...(exLib.equip_db      ? ["DB"]  : []),
        ...(exLib.equip_kb      ? ["KB"]  : []),
        ...(exLib.equip_mb      ? ["MB"]  : []),
        ...(exLib.equip_sb      ? ["SB"]  : []),
      ] : [];
      const availableUnits = [
        ...(hasMin ? ["min" as const] : []),
        ...(hasCal ? ["cal" as const] : []),
        ...(hasRep ? ["rep" as const] : []),
      ];
      // Assicura che unitMode sia valido per questo esercizio
      const safeMode = availableUnits.includes(editUnitMode) ? editUnitMode : (availableUnits[0] ?? "min");
      const unitLabels: Record<string, string> = { min: "Min", cal: "Cal", rep: "Reps" };
      const isTimeBased = safeMode === "min" || safeMode === "cal";
      // Valore numerico corrente (strip " min" / " cal")
      const currentVal = (exercise.reps ?? "").replace(/ min$| cal$/, "");

      const commitWarmup = (mode: "min" | "cal" | "rep", val?: string, sets?: string, reps?: string, load?: string) => {
        if (mode === "rep") {
          // Se reps contiene " min"/" cal" (valore time-based precedente), usa il default 10
          const existingReps = exercise.reps ?? "";
          const isTimeSaved = existingReps.endsWith(" min") || existingReps.endsWith(" cal");
          onUpdate(exercise.id, "sets",  sets  ?? exercise.sets  ?? "2");
          onUpdate(exercise.id, "reps",  reps  ?? (isTimeSaved ? "10" : existingReps || "10"));
          onUpdate(exercise.id, "load",  load  ?? exercise.load  ?? "");
        } else {
          onUpdate(exercise.id, "sets",  "");
          onUpdate(exercise.id, "load",  "");
          const numVal = val ?? currentVal;
          onUpdate(exercise.id, "reps",  numVal ? `${numVal} ${mode === "cal" ? "cal" : "min"}` : "");
        }
      };

      return (
        <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
          <AutocompleteInput
            value={exercise.name}
            onChange={v => resetOnNameChange(v)}
            suggestions={libSuggestions ?? []}
            globalSuggestions={lib ? getAllLibNames(lib) : undefined}
            strict
            placeholder="Nome esercizio *"
            className="input text-sm font-medium w-full"
          />
          {/* Toggle unità */}
          {availableUnits.length > 1 && (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
              {availableUnits.map(u => (
                <button key={u} onClick={() => { setEditUnitMode(u); commitWarmup(u); }}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${safeMode === u ? "bg-white dark:bg-gray-700 shadow-sm text-green-600" : "text-gray-400 dark:text-gray-500"}`}
                >{unitLabels[u]}</button>
              ))}
            </div>
          )}
          {isTimeBased && (
            <div>
              <label className="label">{safeMode === "cal" ? "Calorie" : "Minuti"}</label>
              <input className="input text-sm text-center w-24" placeholder={safeMode === "cal" ? "50" : "5"}
                value={currentVal}
                onChange={e => commitWarmup(safeMode, e.target.value)} />
            </div>
          )}
          {safeMode === "rep" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="2" value={exercise.sets ?? ""} onChange={e => commitWarmup("rep", undefined, e.target.value)} /></div>
                <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="10" value={(exercise.reps ?? "").replace(/ min$| cal$/, "")} onChange={e => commitWarmup("rep", undefined, undefined, e.target.value)} /></div>
              </div>
              {hasKg && (
                <LoadInput
                  label="Carico"
                  exerciseName={exercise.name}
                  value={editLoad}
                  onChange={v => { setEditLoad(v); commitLoad(v, effectiveTool); }}
                  tool={effectiveTool}
                  onToolChange={t => { setEditTool(t); commitLoad(editLoad, t); }}
                  libEx={exLib}
                />
              )}
            </>
          )}
          <div className="flex gap-2">
            <button className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1.5" onClick={() => onDelete(exercise.id)}>Elimina</button>
            <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1.5 px-2" onClick={() => onToggleEdit(exercise.id)}>Annulla</button>
            <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => onSave(exercise.id)}>Salva</button>
          </div>
        </div>
      );
    }
    // Workout editing — form adattato al subtype (no serie per AMRAP/EMOM)
    if (sectionType === "workout") {
      const wkSubtypes: WorkoutSubtype[] = ["amrap", "emom", "fortime", "cardioliss"];
      const sub = (noteTag && wkSubtypes.includes(noteTag as WorkoutSubtype) ? noteTag : sectionSubtype) ?? "amrap";
      const wkExLib = lib ? lookupExercise(lib, exercise.name) : undefined;
      const wkVm = getVolumeMode(wkExLib);
      const wkHasLoad = wkExLib
        ? !!(wkExLib.load_pct || wkExLib.load_rpe || wkExLib.load_kg)
        : (editLoad !== "-" || !!resolveMaxKey(exercise.name));
      const wkUnitLabel = wkVm === "min" ? "Minuti" : wkVm === "cal" ? "Calorie" : "Reps";
      const wkPlaceholder = wkVm === "min" ? "10" : wkVm === "cal" ? "50" : "10";
      return (
        <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
          <AutocompleteInput
            value={exercise.name}
            onChange={v => resetOnNameChange(v)}
            suggestions={libSuggestions ?? []}
            globalSuggestions={lib ? getAllLibNames(lib) : undefined}
            strict
            placeholder="Nome esercizio *"
            className="input text-sm font-medium w-full"
          />
          {sub === "cardioliss" && (
            <div>
              <label className="label">{wkVm === "cal" ? "Calorie" : "Minuti"}</label>
              <input className="input text-sm" placeholder={wkVm === "cal" ? "50" : "10"} value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
            </div>
          )}
          {sub === "fortime" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Rounds</label>
                  <input className="input text-sm" placeholder="3" value={exercise.sets ?? ""} onChange={e => onUpdate(exercise.id, "sets", e.target.value)} />
                </div>
                <div>
                  <label className="label">{wkUnitLabel}</label>
                  <input className="input text-sm" placeholder={wkPlaceholder} value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
                </div>
              </div>
              {wkHasLoad && (
                <LoadInput label="Carico" exerciseName={exercise.name} value={editLoad}
                  onChange={v => { setEditLoad(v); commitLoad(v, effectiveTool); }}
                  tool={effectiveTool} onToolChange={t => { setEditTool(t); commitLoad(editLoad, t); }}
                  libEx={wkExLib} />
              )}
            </>
          )}
          {sub !== "cardioliss" && sub !== "fortime" && (
            <>
              <div>
                <label className="label">{wkUnitLabel}</label>
                <input className="input text-sm" placeholder={wkPlaceholder} value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
              </div>
              {wkHasLoad && (
                <LoadInput label="Carico" exerciseName={exercise.name} value={editLoad}
                  onChange={v => { setEditLoad(v); commitLoad(v, effectiveTool); }}
                  tool={effectiveTool} onToolChange={t => { setEditTool(t); commitLoad(editLoad, t); }}
                  libEx={wkExLib} />
              )}
            </>
          )}
          <div className="flex gap-2">
            <button className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1.5" onClick={() => onDelete(exercise.id)}>Elimina</button>
            <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1.5 px-2" onClick={() => onToggleEdit(exercise.id)}>Annulla</button>
            <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => onSave(exercise.id)}>Salva</button>
          </div>
        </div>
      );
    }

    const isBodyweight = noteTag === "bw";
    const exLibEdit = lib ? lookupExercise(lib, exercise.name) : undefined;
    const availVm = getAvailableVmModes(exLibEdit);
    // editUnitMode è lo stato già inizializzato dalla libreria/dati salvati — usato come vm attivo
    const activeVm = editUnitMode;
    // Show load: exclude bodyweight; per warmup mostra se libreria ha qualsiasi tipo di carico o esercizio performance
    const exHasAnyLoad = exLibEdit
      ? (exLibEdit.load_pct || exLibEdit.load_rpe || exLibEdit.load_kg)
      : (!!resolveMaxKey(exercise.name) || (exercise.load != null && exercise.load !== "-"));
    const warmupHasLoad = sectionType === "warmup" && exHasAnyLoad;
    const showLoad = (!isBodyweight)
      && (sectionType !== "warmup" || warmupHasLoad)
      && (exLibEdit ? !!(exLibEdit.load_pct || exLibEdit.load_rpe || exLibEdit.load_kg) : true);
    const showRec  = sectionType !== "warmup";

    return (
      <div className="p-3 border-b border-gray-100 last:border-0 space-y-2 bg-amber-50 dark:bg-amber-900/20 dark:border-gray-700">
        <AutocompleteInput
          value={exercise.name}
          onChange={v => {
            resetOnNameChange(v);
            // Reset vm al default libreria quando cambia il nome
            const newLib = lib ? lookupExercise(lib, v) : undefined;
            setEditUnitMode(getVolumeMode(newLib));
          }}
          suggestions={libSuggestions ?? []}
          globalSuggestions={lib ? getAllLibNames(lib) : undefined}
          strict
          placeholder="Nome esercizio *"
          className="input text-sm font-medium w-full"
        />

        {/* Toggle unità se l'esercizio ha più modalità disponibili (es. Assault Bike: min/cal) */}
        {availVm.length > 1 && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
            {availVm.map(m => (
              <button key={m} onClick={() => setEditUnitMode(m)}
                className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${activeVm === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                {m === "min" ? "Minuti" : m === "cal" ? "Calorie" : "Reps"}
              </button>
            ))}
          </div>
        )}

        {/* Volume — library-driven */}
        {activeVm === "rep" ? (
          <div className={`grid gap-2 ${showRec ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <label className="label">Serie</label>
              <input className="input text-sm" placeholder="3" value={exercise.sets ?? ""} onChange={e => onUpdate(exercise.id, "sets", e.target.value)} />
            </div>
            <div>
              <label className="label">Reps</label>
              <input className="input text-sm" placeholder="10" value={exercise.reps ?? ""} onChange={e => onUpdate(exercise.id, "reps", e.target.value)} />
            </div>
            {showRec && (
              <div>
                <label className="label">Rec. sec</label>
                <input className="input text-sm" placeholder="60" value={exercise.rest_time?.replace(" sec", "") ?? ""} onChange={e => onUpdate(exercise.id, "rest_time", e.target.value ? `${e.target.value} sec` : "")} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="label">{activeVm === "min" ? "Minuti" : "Calorie"}</label>
            <input
              className="input text-sm text-center"
              placeholder={activeVm === "min" ? "10" : "50"}
              value={(exercise.reps ?? "").replace(/ (min|cal)$/, "")}
              onChange={e => onUpdate(exercise.id, "reps", e.target.value ? `${e.target.value} ${activeVm}` : "")}
            />
          </div>
        )}

        {/* Carico full-width */}
        {showLoad && !editProgressive && (
          <LoadInput
            label="Carico"
            exerciseName={exercise.name}
            value={editLoad}
            onChange={v => { setEditLoad(v); commitLoad(v, effectiveTool); }}
            tool={effectiveTool}
            onToolChange={t => { setEditTool(t); commitLoad(editLoad, t); }}
            libEx={exLibEdit}
          />
        )}

        {/* Hint massimale — mostra in edit per tutti i sectionType */}
        {showLoad && !editProgressive && maxes && <OneRMHint exerciseName={exercise.name} load={editLoad} maxes={maxes} />}

        {/* Progressivo — per esercizi con % (forza o performance) in qualsiasi sezione */}
        {(sectionType === "strength" || !!(exLibEdit?.load_pct) || !!resolveMaxKey(exercise.name)) && (
          <>
            <label className="flex items-center gap-1 cursor-pointer w-fit">
              <input type="checkbox" checked={editProgressive} onChange={e => toggleEditProgressive(e.target.checked)} className="w-3 h-3 accent-lime-500" />
              <span className="text-[10px] text-gray-400 select-none">Progressivo</span>
            </label>
            {editProgressive && editProgLoads.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Carico per set</p>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(editProgLoads.length, 4)}, 1fr)` }}>
                  {editProgLoads.map((pl, si) => {
                    const key = resolveMaxKey(exercise.name);
                    const max = key && maxes ? maxes[key] : undefined;
                    const hint = max && pl.includes("%") ? calcKgFromPct(pl, max) : null;
                    return (
                      <div key={si}>
                        <label className="label">S{si + 1}</label>
                        <LoadInput exerciseName={exercise.name} value={pl} onChange={v => updateProgLoad(si, v)} libEx={exLibEdit} />
                        {hint && <p className="text-[9px] text-lime-600 dark:text-lime-400 text-center mt-0.5">≈ {hint} kg</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <BulkNoteField value={exercise.notes ?? ""} onChange={v => onUpdate(exercise.id, "notes", v)} />

        <div className="flex gap-2">
          <button className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1.5" onClick={() => onDelete(exercise.id)}>Elimina</button>
          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1.5 px-2" onClick={() => onToggleEdit(exercise.id)}>Annulla</button>
          <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => onSave(exercise.id)}>Salva</button>
        </div>
      </div>
    );
  }

  // Read-only view — inline note editor
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

  const DeleteBtn = () => (
    <button
      onClick={e => { e.stopPropagation(); onDelete(exercise.id); }}
      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      title="Elimina"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );

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
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">{renderInline()}</div>
          <DeleteBtn />
        </div>
        <div className="pl-3.5"><NoteToggle /></div>
      </div>
    );
  }

  if (isCardioWarmup) {
    return (
      <div className="px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</span>
            {exercise.reps && <span className="text-sm text-gray-500 dark:text-gray-400"> · {exercise.reps}</span>}
          </div>
          <DeleteBtn />
        </div>
        <div className="pl-4"><NoteToggle /></div>
      </div>
    );
  }

  if (isMobilitaWarmup) {
    const mobLib = lib ? lookupExercise(lib, exercise.name) : undefined;
    const mobVm = getVolumeMode(mobLib);
    const mobRepsHasUnit = (exercise.reps ?? "").endsWith(" min") || (exercise.reps ?? "").endsWith(" cal");
    const mobDisplayReps = exercise.reps
      ? (mobVm !== "rep" && !mobRepsHasUnit ? `${exercise.reps} ${mobVm}` : exercise.reps)
      : null;
    return (
      <div className="px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</span>
            {mobVm !== "rep" ? (
              mobDisplayReps && <span className="text-sm text-gray-500 dark:text-gray-400"> · {mobDisplayReps}</span>
            ) : (
              exercise.sets && exercise.reps && (
                <span className="text-sm text-gray-500 dark:text-gray-400"> · {exercise.sets}×{exercise.reps}</span>
              )
            )}
          </div>
          <DeleteBtn />
        </div>
        <div className="pl-4"><NoteToggle /></div>
      </div>
    );
  }

  const DeleteBtnInline = () => (
    <button
      onClick={e => { e.stopPropagation(); onDelete(exercise.id); }}
      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
      title="Elimina"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );

  const displayLib = lib ? lookupExercise(lib, exercise.name) : undefined;
  const displayVm  = getVolumeMode(displayLib);
  const isMinCal   = displayVm !== "rep";
  // Aggiunge suffisso unità se manca (retrocompatibilità dati salvati senza "min"/"cal")
  const repsHasUnit = (exercise.reps ?? "").endsWith(" min") || (exercise.reps ?? "").endsWith(" cal");
  const displayReps = exercise.reps
    ? (isMinCal && !repsHasUnit ? `${exercise.reps} ${displayVm}` : exercise.reps)
    : null;
  // Filtra carico "-" (placeholder vuoto) per non mostrarlo nel display
  const hasRealLoad = !!(exercise.load && exercise.load !== "-");

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap items-baseline gap-x-1">
            <span className="font-medium">{exercise.name}</span>
            {isMinCal ? (
              // min/cal: mostra solo reps con unità (es. "10 min" o "50 cal"), no sets né rest né carico vuoto
              <>
                {displayReps && <><span className="text-gray-400 dark:text-gray-500">·</span><span className="text-gray-500 dark:text-gray-400">{displayReps}</span></>}
                {hasRealLoad && <><span className="text-gray-400 dark:text-gray-500">·</span><span className="text-gray-500 dark:text-gray-400">{formatLoad(exercise.load!)}</span></>}
              </>
            ) : (
              // rep: mostra sets×reps, carico, recupero
              <>
                {(exercise.sets || exercise.reps) && <span className="text-gray-400 dark:text-gray-500">·</span>}
                {exercise.sets && exercise.reps
                  ? <span className="text-gray-500 dark:text-gray-400">{exercise.sets}×{exercise.reps}</span>
                  : exercise.reps
                  ? <span className="text-gray-500 dark:text-gray-400">{exercise.reps}</span>
                  : exercise.sets
                  ? <span className="text-gray-500 dark:text-gray-400">{exercise.sets} serie</span>
                  : null}
                {hasRealLoad && <><span className="text-gray-400 dark:text-gray-500">·</span><span className="text-gray-500 dark:text-gray-400">{formatLoad(exercise.load!)}</span></>}
                {exercise.rest_time && <><span className="text-gray-400 dark:text-gray-500">·</span><span className="text-gray-500 dark:text-gray-400">⏱ {exercise.rest_time} rest</span></>}
              </>
            )}
            <DeleteBtnInline />
          </div>
          {maxes && <OneRMHint exerciseName={exercise.name} load={exercise.load ?? ""} maxes={maxes} />}
        </div>
      </div>
      <div className="pl-4"><NoteToggle /></div>
    </div>
  );
}

// ─── Add Exercise Modal ───────────────────────────────────────
function AddExerciseModal({ section, lib, dayLabel, maxes, onSave, onCancel }: {
  section: WorkoutSection;
  lib: LibraryMap;
  dayLabel?: string;
  maxes: Record<string, number>;
  onSave: (data: { name: string; sets?: string; reps?: string; load?: string; rest_time?: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const color = SECTION_COLORS[section.section_type];
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [loadTool, setLoadTool] = useState<string>("");
  const [rest, setRest] = useState("");
  const [progressive, setProgressive] = useState(false);
  const [progressiveLoads, setProgressiveLoads] = useState<string[]>([]);
  const [userNotes, setUserNotes] = useState("");
  const [warmupType, setWarmupType] = useState<"cardio" | "mobilita" | "attivazione">("cardio");
  const [unitMode, setUnitMode] = useState<"min" | "cal" | "rep">("min");
  // vmMode per sezioni non-warmup (strength/accessories/core/workout): aggiornato quando cambia il nome
  const [vmMode, setVmMode] = useState<"rep" | "min" | "cal">("rep");

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

  // Reset name and load when switching sub-category
  useEffect(() => { setName(""); setLoad(""); setLoadTool(""); setProgressive(false); setProgressiveLoads([]); setUserNotes(""); }, [warmupType, warmupZone, strengthSub, accessoriSub, workoutSub]);

  // Aggiorna unitMode al default dell'esercizio selezionato (o al fallback warmupType)
  useEffect(() => {
    if (section.section_type !== "warmup") return;
    const ex = lookupExercise(lib, name);
    const def = ex?.default_unit ?? (warmupType === "cardio" ? "min" : "rep");
    setUnitMode(def as "min" | "cal" | "rep");
  }, [name, warmupType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aggiorna vmMode per sezioni non-warmup quando cambia il nome esercizio
  useEffect(() => {
    if (section.section_type === "warmup") return;
    const exLib = lookupExercise(lib, name);
    setVmMode(getVolumeMode(exLib));
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-set tool from library default_equip, sub-category, or exercise name
  useEffect(() => {
    const exLib = lookupExercise(lib, name);
    const libTool = getDefaultTool(exLib);
    if (section.section_type === "accessories") {
      if (libTool) { setLoadTool(libTool); return; }
      if (accessoriSub === "manubri")    { setLoadTool("DB");  return; }
      if (accessoriSub === "kettlebell") { setLoadTool("KB");  return; }
      if (accessoriSub === "bilanciere") { setLoadTool("Bar"); return; }
      setLoadTool("");
      return;
    }
    if (!resolveMaxKey(name)) {
      setLoadTool(libTool || detectTool(name));
    } else {
      setLoadTool("");
    }
  }, [name, accessoriSub]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize progressiveLoads when sets changes in progressive mode
  useEffect(() => {
    if (!progressive) return;
    const n = Math.max(1, parseInt(sets) || 1);
    setProgressiveLoads(prev => {
      if (n === prev.length) return prev;
      const base = prev[prev.length - 1] || load || "80%";
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill(base)];
      return prev.slice(0, n);
    });
  }, [sets, progressive]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleProgressive = (on: boolean) => {
    if (!on) { setProgressive(false); setProgressiveLoads([]); return; }
    const n = Math.max(1, parseInt(sets) || 3);
    const base = load && load !== "-" ? load : "80%";
    setProgressive(true);
    setProgressiveLoads(Array.from({ length: n }, () => base));
  };

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

  const buildLoad = (rawLoad: string, toolOverride?: string) => {
    const effectiveTool = toolOverride ?? loadTool;
    const baseLoad = progressive && progressiveLoads.length ? progressiveLoads.join("|") : rawLoad;
    const effectiveMode = detectLoadMode(baseLoad) ?? "kg";
    if (!baseLoad || baseLoad === "-") return undefined;
    const toolImpliedByName = detectTool(name.trim()) === effectiveTool;
    if (effectiveTool && effectiveMode === "kg" && !toolImpliedByName) return `${baseLoad} ${effectiveTool}`;
    return baseLoad;
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (section.section_type === "warmup") {
      const tag = warmupType === "cardio" ? "cardio" : warmupType === "attivazione" ? "att" : "mob";
      const exLib = lookupExercise(lib, name);
      const wuKg  = exLib ? exLib.load_kg  : false;
      if (unitMode === "min") {
        onSave({ name: name.trim(), reps: reps ? `${reps} min` : "5 min", notes: tagNotes(tag, userNotes) });
      } else if (unitMode === "cal") {
        onSave({ name: name.trim(), reps: reps ? `${reps} cal` : undefined, notes: tagNotes(tag, userNotes) });
      } else {
        onSave({ name: name.trim(), sets: sets || "2", reps: reps || "10", load: wuKg ? buildLoad(load) : undefined, notes: tagNotes(tag, userNotes) });
      }
    } else if (section.section_type === "strength") {
      const tagMap: Record<string, string> = { "UPPER BODY": "upper", "LOWER BODY": "lower", "FULL BODY": "full" };
      if (vmMode !== "rep") {
        onSave({ name: name.trim(), reps: reps ? `${reps} ${vmMode}` : undefined, load: buildLoad(load), notes: tagNotes(tagMap[strengthSub], userNotes) });
      } else {
        onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: buildLoad(load), rest_time: rest ? `${rest} sec` : undefined, notes: tagNotes(tagMap[strengthSub], userNotes) });
      }
    } else if (section.section_type === "accessories") {
      const tagMap: Record<string, string> = { bodyweight: "bw", manubri: "man", kettlebell: "kb", bilanciere: "bar" };
      const loadVal = accLoadType === "none" ? undefined : buildLoad(load);
      if (vmMode !== "rep") {
        onSave({ name: name.trim(), reps: reps ? `${reps} ${vmMode}` : undefined, load: loadVal, notes: tagNotes(tagMap[accessoriSub], userNotes) });
      } else {
        onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: loadVal, rest_time: rest ? `${rest} sec` : undefined, notes: tagNotes(tagMap[accessoriSub], userNotes) });
      }
    } else if (section.section_type === "core") {
      if (vmMode !== "rep") {
        onSave({ name: name.trim(), reps: reps ? `${reps} ${vmMode}` : undefined, load: buildLoad(load), notes: userNotes.trim() || undefined });
      } else {
        onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: buildLoad(load), rest_time: rest ? `${rest} sec` : undefined, notes: userNotes.trim() || undefined });
      }
    } else if (isWorkout && workoutSub === "cardioliss") {
      onSave({ name: name.trim(), reps: reps ? `${reps} ${vmMode !== "rep" ? vmMode : "min"}` : undefined, notes: tagNotes("cardioliss", userNotes) });
    } else if (isWorkout && workoutSub === "fortime") {
      onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: buildLoad(load), notes: tagNotes("fortime", userNotes) });
    } else if (isWorkout) {
      onSave({ name: name.trim(), reps: reps || undefined, load: buildLoad(load), notes: tagNotes(workoutSub, userNotes) });
    } else {
      onSave({ name: name.trim(), sets: sets || undefined, reps: reps || undefined, load: load || undefined, rest_time: rest ? `${rest} sec` : undefined, notes: userNotes.trim() || undefined });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
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
          <AutocompleteInput
            value={name}
            onChange={v => {
              setName(v);
              const exLib = lookupExercise(lib, v);
              const isPerf = !!resolveMaxKey(v);
              if (exLib || isPerf) {
                const tool = getDefaultTool(exLib) || detectTool(v);
                setLoad(computeLoad(v, tool, exLib));
                setProgressive(false);
                setProgressiveLoads([]);
              }
            }}
            suggestions={suggestions}
            globalSuggestions={getAllLibNames(lib)}
            strict
            placeholder="Cerca dalla libreria..."
          />
        </div>

        {/* Warmup fields — dinamici da flag libreria */}
        {section.section_type === "warmup" && (() => {
          const exLib = lookupExercise(lib, name);
          // Cardio: MIN e CAL sempre disponibili, la libreria imposta solo il default
          // Per mobilità/attivazione: REP sempre, carico/attrezzatura dalla libreria
          const isCardioType = warmupType === "cardio";
          const wuMin = exLib ? exLib.unit_min : isCardioType;   // fallback: MIN per cardio sconosciuto
          const wuCal = exLib ? exLib.unit_cal : false;           // solo da libreria
          const wuRep = exLib ? exLib.unit_rep : !isCardioType;   // fallback: REP per mob/att sconosciuto
          const wuKg  = exLib ? exLib.load_kg  : false;
          const wuDb  = exLib ? exLib.equip_db : false;
          const wuKb  = exLib ? exLib.equip_kb : false;

          // Unità disponibili per il toggle
          const availableUnits = [
            ...(wuMin ? ["min" as const] : []),
            ...(wuCal ? ["cal" as const] : []),
            ...(wuRep ? ["rep" as const] : []),
          ];
          const unitLabels: Record<string, string> = { min: "Min", cal: "Cal", rep: "Reps" };
          const isTimeBased = unitMode === "min" || unitMode === "cal";

          return (
            <>
              {/* Toggle unità (solo se più di una disponibile) */}
              {availableUnits.length > 1 && (
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                  {availableUnits.map(u => (
                    <button key={u} onClick={() => setUnitMode(u)}
                      className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${unitMode === u ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400 dark:text-gray-500"}`}
                      style={unitMode === u ? { color } : {}}
                    >{unitLabels[u]}</button>
                  ))}
                </div>
              )}

              {/* Input tempo (MIN o CAL) */}
              {isTimeBased && (wuMin || wuCal) && (
                <div>
                  <label className="label">{unitMode === "cal" ? "Calorie" : "Minuti"}</label>
                  <input className="input text-sm text-center w-24"
                    placeholder={unitMode === "cal" ? "50" : "5"}
                    value={reps} onChange={e => setReps(e.target.value)} />
                </div>
              )}

              {/* Input serie + reps */}
              {unitMode === "rep" && wuRep && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="2" value={sets} onChange={e => setSets(e.target.value)} /></div>
                  <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="10" value={reps} onChange={e => setReps(e.target.value)} /></div>
                </div>
              )}

              {/* Carico (solo se l'esercizio ha load_kg in libreria e siamo in modalità rep) */}
              {wuKg && unitMode === "rep" && (
                <LoadInput
                  exerciseName={name}
                  value={load}
                  onChange={setLoad}
                  label="Carico"
                  tool={loadTool}
                  onToolChange={setLoadTool}
                  libEx={exLib}
                />
              )}
            </>
          );
        })()}

        {/* Strength fields */}
        {section.section_type === "strength" && (() => {
          const exLib = lookupExercise(lib, name);
          const availVm = getAvailableVmModes(exLib);
          const hasLoad = exLib
            ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg)
            : (!!resolveMaxKey(name) || load !== "-");
          return (
          <>
            {availVm.length > 1 && (
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                {availVm.map(m => (
                  <button key={m} onClick={() => setVmMode(m)}
                    className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${vmMode === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                    {m === "min" ? "Minuti" : m === "cal" ? "Calorie" : "Reps"}
                  </button>
                ))}
              </div>
            )}
            {vmMode === "rep" ? (
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
                <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="5" value={reps} onChange={e => setReps(e.target.value)} /></div>
                <div><label className="label">Rec. sec</label><input className="input text-sm text-center" placeholder="120" value={rest} onChange={e => setRest(e.target.value)} /></div>
              </div>
            ) : (
              <div>
                <label className="label">{vmMode === "min" ? "Minuti" : "Calorie"}</label>
                <input className="input text-sm text-center" placeholder={vmMode === "min" ? "10" : "50"} value={reps} onChange={e => setReps(e.target.value)} />
              </div>
            )}
            {hasLoad && !progressive && (
              <LoadInput exerciseName={name} value={load} onChange={setLoad} label="Carico" tool={loadTool} onToolChange={setLoadTool} libEx={exLib} />
            )}
            <label className="flex items-center gap-1 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={progressive}
                onChange={e => toggleProgressive(e.target.checked)}
                className="w-3 h-3 accent-lime-500"
              />
              <span className="text-[10px] text-gray-400 select-none">Progressivo</span>
            </label>
            {progressive && progressiveLoads.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Carico per set</p>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(progressiveLoads.length, 4)}, 1fr)` }}>
                  {progressiveLoads.map((pl, si) => {
                    const key = resolveMaxKey(name);
                    const max = key ? maxes[key] : undefined;
                    const hint = max && pl.includes("%") ? calcKgFromPct(pl, max) : null;
                    return (
                      <div key={si}>
                        <label className="label">S{si + 1}</label>
                        <LoadInput
                          exerciseName={name}
                          value={pl}
                          onChange={v => setProgressiveLoads(prev => prev.map((x, j) => j === si ? v : x))}
                        />
                        {hint && <p className="text-[9px] text-lime-600 dark:text-lime-400 text-center mt-0.5">≈ {hint} kg</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
          );
        })()}
        {/* hint massimale per forza */}
        {section.section_type === "strength" && !progressive && <OneRMHint exerciseName={name} load={load} maxes={maxes} />}
        {/* OneRMHint per esercizi performance in sezioni non-forza */}
        {section.section_type !== "strength" && !progressive && !!resolveMaxKey(name) && <OneRMHint exerciseName={name} load={load} maxes={maxes} />}

        {/* Accessories fields */}
        {section.section_type === "accessories" && (() => {
          const exLib = lookupExercise(lib, name);
          const availVm = getAvailableVmModes(exLib);
          const hasLoad = exLib ? !!(exLib.load_kg || exLib.load_pct || exLib.load_rpe) : accessoriSub !== "bodyweight";
          const showProg = !!(exLib?.load_pct) || !!resolveMaxKey(name);
          return (
          <>
            {availVm.length > 1 && (
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                {availVm.map(m => (
                  <button key={m} onClick={() => setVmMode(m)}
                    className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${vmMode === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                    {m === "min" ? "Minuti" : m === "cal" ? "Calorie" : "Reps"}
                  </button>
                ))}
              </div>
            )}
            {vmMode === "rep" ? (
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
                <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="12" value={reps} onChange={e => setReps(e.target.value)} /></div>
                <div><label className="label">Rec. sec</label><input className="input text-sm text-center" placeholder="60" value={rest} onChange={e => setRest(e.target.value)} /></div>
              </div>
            ) : (
              <div>
                <label className="label">{vmMode === "min" ? "Minuti" : "Calorie"}</label>
                <input className="input text-sm text-center" placeholder={vmMode === "min" ? "10" : "50"} value={reps} onChange={e => setReps(e.target.value)} />
              </div>
            )}
            {hasLoad && !progressive && <LoadInput exerciseName={name} value={load} onChange={setLoad} label="Carico" tool={loadTool} onToolChange={setLoadTool} libEx={exLib} />}
            {showProg && (
              <label className="flex items-center gap-1 cursor-pointer w-fit">
                <input type="checkbox" checked={progressive} onChange={e => toggleProgressive(e.target.checked)} className="w-3 h-3 accent-lime-500" />
                <span className="text-[10px] text-gray-400 select-none">Progressivo</span>
              </label>
            )}
            {showProg && progressive && progressiveLoads.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Carico per set</p>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(progressiveLoads.length, 4)}, 1fr)` }}>
                  {progressiveLoads.map((pl, si) => {
                    const key = resolveMaxKey(name);
                    const max = key ? maxes[key] : undefined;
                    const hint = max && pl.includes("%") ? calcKgFromPct(pl, max) : null;
                    return (
                      <div key={si}>
                        <label className="label">S{si + 1}</label>
                        <LoadInput exerciseName={name} value={pl} onChange={v => setProgressiveLoads(prev => prev.map((x, j) => j === si ? v : x))} libEx={exLib} />
                        {hint && <p className="text-[9px] text-lime-600 dark:text-lime-400 text-center mt-0.5">≈ {hint} kg</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!progressive && <OneRMHint exerciseName={name} load={load} maxes={maxes} />}
          </>
          );
        })()}

        {/* Core fields */}
        {section.section_type === "core" && (() => {
          const exLib = lookupExercise(lib, name);
          const availVm = getAvailableVmModes(exLib);
          const hasLoad = exLib ? !!(exLib.load_kg || exLib.load_pct || exLib.load_rpe) : true;
          const showProg = !!(exLib?.load_pct) || !!resolveMaxKey(name);
          return (
          <>
            {availVm.length > 1 && (
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                {availVm.map(m => (
                  <button key={m} onClick={() => setVmMode(m)}
                    className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${vmMode === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                    {m === "min" ? "Minuti" : m === "cal" ? "Calorie" : "Reps"}
                  </button>
                ))}
              </div>
            )}
            {vmMode === "rep" ? (
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Serie</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
                <div><label className="label">Reps</label><input className="input text-sm text-center" placeholder="15" value={reps} onChange={e => setReps(e.target.value)} /></div>
                <div><label className="label">Rec. sec</label><input className="input text-sm text-center" placeholder="30" value={rest} onChange={e => setRest(e.target.value)} /></div>
              </div>
            ) : (
              <div>
                <label className="label">{vmMode === "min" ? "Minuti" : "Calorie"}</label>
                <input className="input text-sm text-center" placeholder={vmMode === "min" ? "10" : "50"} value={reps} onChange={e => setReps(e.target.value)} />
              </div>
            )}
            {hasLoad && !progressive && <LoadInput exerciseName={name} value={load} onChange={setLoad} label="Carico" tool={loadTool} onToolChange={setLoadTool} libEx={exLib} />}
            {showProg && (
              <label className="flex items-center gap-1 cursor-pointer w-fit">
                <input type="checkbox" checked={progressive} onChange={e => toggleProgressive(e.target.checked)} className="w-3 h-3 accent-lime-500" />
                <span className="text-[10px] text-gray-400 select-none">Progressivo</span>
              </label>
            )}
            {showProg && progressive && progressiveLoads.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Carico per set</p>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(progressiveLoads.length, 4)}, 1fr)` }}>
                  {progressiveLoads.map((pl, si) => {
                    const key = resolveMaxKey(name);
                    const max = key ? maxes[key] : undefined;
                    const hint = max && pl.includes("%") ? calcKgFromPct(pl, max) : null;
                    return (
                      <div key={si}>
                        <label className="label">S{si + 1}</label>
                        <LoadInput exerciseName={name} value={pl} onChange={v => setProgressiveLoads(prev => prev.map((x, j) => j === si ? v : x))} libEx={exLib} />
                        {hint && <p className="text-[9px] text-lime-600 dark:text-lime-400 text-center mt-0.5">≈ {hint} kg</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!progressive && <OneRMHint exerciseName={name} load={load} maxes={maxes} />}
          </>
          );
        })()}

        {/* Workout fields */}
        {isWorkout && workoutSub === "cardioliss" && (() => {
          const exLib = lookupExercise(lib, name);
          const availVm = getAvailableVmModes(exLib).filter(m => m !== "rep") as ("min" | "cal")[];
          return (
            <>
              {availVm.length > 1 && (
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                  {availVm.map(m => (
                    <button key={m} onClick={() => setVmMode(m)}
                      className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${vmMode === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                      {m === "min" ? "Minuti" : "Calorie"}
                    </button>
                  ))}
                </div>
              )}
              <div><label className="label">{vmMode === "cal" ? "Calorie" : "Minuti"}</label>
                <input className="input text-sm text-center w-24" placeholder={vmMode === "cal" ? "50" : "10"} value={reps} onChange={e => setReps(e.target.value)} />
              </div>
            </>
          );
        })()}
        {isWorkout && workoutSub === "fortime" && (() => {
          const exLib = lookupExercise(lib, name);
          const wkVm = getVolumeMode(exLib);
          const wkHasLoad = exLib ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg) : (load !== "-" || !!resolveMaxKey(name));
          return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Rounds</label><input className="input text-sm text-center" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} /></div>
              <div>
                <label className="label">{wkVm === "min" ? "Minuti" : wkVm === "cal" ? "Calorie" : "Reps"}</label>
                <input className="input text-sm text-center" placeholder={wkVm === "min" ? "10" : wkVm === "cal" ? "50" : "15"} value={reps} onChange={e => setReps(e.target.value)} />
              </div>
            </div>
            {wkHasLoad && <LoadInput exerciseName={name} value={load} onChange={setLoad} label="Carico" tool={loadTool} onToolChange={setLoadTool} libEx={exLib} />}
          </>
          );
        })()}
        {isWorkout && workoutSub !== "cardioliss" && workoutSub !== "fortime" && (() => {
          const exLib = lookupExercise(lib, name);
          const wkVm = getVolumeMode(exLib);
          const wkHasLoad = exLib ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg) : (load !== "-" || !!resolveMaxKey(name));
          return (
          <>
            <div>
              <label className="label">{wkVm === "min" ? "Minuti" : wkVm === "cal" ? "Calorie" : "Reps"}</label>
              <input className="input text-sm text-center" placeholder={wkVm === "min" ? "10" : wkVm === "cal" ? "50" : "10"} value={reps} onChange={e => setReps(e.target.value)} />
            </div>
            {wkHasLoad && <LoadInput exerciseName={name} value={load} onChange={setLoad} label="Carico" tool={loadTool} onToolChange={setLoadTool} libEx={exLib} />}
          </>
          );
        })()}

        <BulkNoteField value={userNotes} onChange={setUserNotes} />

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
  maxes: Record<string, number>;
  onToggleEdit: (id: string) => void;
  onUpdateEx: (id: string, field: keyof Exercise, val: string) => void;
  onDeleteEx: (sectionId: string, exId: string) => void;
  onSaveEx: (sectionId: string, ex: Exercise) => void;
  onAddEx: (sectionId: string) => void;
  onClearSection: (sectionId: string) => void;
  readOnly?: boolean;
}

function SectionBlock({ section, lib, editingExId, maxes, onToggleEdit, onUpdateEx, onDeleteEx, onSaveEx, onAddEx, onClearSection, readOnly }: SectionBlockProps) {
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
  // Mappa subtype → rounds (dal campo sets del primo esercizio del gruppo fortime)
  const roundsBySubtype: Record<string, string> = {};
  if (section.section_type === "workout") {
    (section.exercises ?? []).forEach(ex => {
      const { group } = parseExerciseGroup(ex.notes);
      if (group === "fortime" && ex.sets && !roundsBySubtype["fortime"]) {
        roundsBySubtype["fortime"] = ex.sets;
      }
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
        {!readOnly && (
          <button
            onClick={() => onAddEx(section.id)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ backgroundColor: color + "15", color }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            Aggiungi esercizi per categoria
          </button>
        )}
      </div>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <div className="px-4 py-5 text-center text-sm text-gray-400">
          {readOnly ? "Nessun esercizio" : "Nessun esercizio — clicca Aggiungi esercizi per categoria"}
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
                        {ex._group === "fortime" && roundsBySubtype["fortime"] ? ` · ${roundsBySubtype["fortime"]} rounds` : ""}
                        {ex._group && capTimeBySubtype[ex._group] ? ` · cap ${capTimeBySubtype[ex._group]} min` : ""}
                      </span>
                    </div>
                  )}
                  <div
                    onClick={() => !readOnly && !editingExId && onToggleEdit(ex.id)}
                    className={!readOnly && editingExId !== ex.id ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" : ""}
                  >
                    <ExerciseRow
                      exercise={{ ...ex, notes: ex._cleanNotes }}
                      sectionType={section.section_type}
                      sectionSubtype={section.section_subtype}
                      libSuggestions={libSuggestions}
                      lib={lib}
                      editing={editingExId === ex.id}
                      noteTag={ex._group}
                      exerciseNumber={ex._exNum}
                      maxes={maxes}
                      onUpdate={onUpdateEx}
                      onDelete={(id) => onDeleteEx(section.id, id)}
                      onSave={(id) => {
                        const found = exercises.find(e => e.id === id);
                        if (found) onSaveEx(section.id, found);
                      }}
                      onToggleEdit={onToggleEdit}
                    />
                  </div>
                </React.Fragment>
              );
            })}

            {/* Clear section */}
            {!readOnly && <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
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
            </div>}
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

// Cerca un esercizio per nome nella libreria e restituisce l'oggetto completo (con flag)
function lookupExercise(lib: LibraryMap, name: string): ExerciseLibrary | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  for (const entries of Object.values(lib)) {
    const found = entries.find(e => e.name.toLowerCase() === lower);
    if (found) return found;
  }
  return undefined;
}

// Formatta il carico: aggiunge KG se numero puro, @ se percentuale; gestisce progressivi con | e tool DB/KB/MB/SB/Bar
function formatLoad(load: string): string {
  if (!load || load === "-") return load;
  const toolMatch = load.match(/\s+(DB|KB|MB|SB|Bar)$/i);
  const loadPart = toolMatch ? load.slice(0, -toolMatch[0].length) : load;
  const toolSuffix = toolMatch ? ` (${toolMatch[1].toUpperCase()})` : "";
  if (loadPart.includes("|")) {
    return loadPart.split("|").map(l => formatLoadSingle(l)).join(" → ") + toolSuffix;
  }
  return formatLoadSingle(loadPart) + toolSuffix;
}
function formatLoadSingle(load: string): string {
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
interface CardioRow    { name: string; minutes: string; unitMode: "min" | "cal" | "rep"; sets: string; reps: string; load: string; tool: string; notes: string }
interface MobilitaRow  { name: string; sets: string; reps: string; load: string; tool: string; notes: string }
interface ForzaRow     { name: string; sets: string; reps: string; load: string; rest: string; notes: string; progressive: boolean; loads: string[]; tool: string; unitMode: "rep" | "min" | "cal" }
interface AccessoriRow { name: string; sets: string; reps: string; load: string; rest: string; notes: string; tool: string; unitMode: "rep" | "min" | "cal" }
interface CoreRow      { name: string; sets: string; reps: string; load: string; rest: string; notes: string; tool: string; unitMode: "rep" | "min" | "cal" }
interface WorkoutRow   { name: string; reps: string; load: string; rounds: string; minutes: string; notes: string; tool: string }

interface WorkoutBlock {
  subtype: WorkoutSubtype;
  capTime: string;
  rounds: string;
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
    blocks: WorkoutBlock[]; // 1, 2 or 3 selected workout types
  };
}

const mkCardioRow    = (name = "", unitMode: "min" | "cal" | "rep" = "min", tool: string = ""): CardioRow =>
  ({ name, minutes: "5", unitMode, sets: "2", reps: "10", load: defaultLoadForTool(tool), tool, notes: "" });
const defaultLoadForTool = (tool: string): string =>
  tool === "DB" ? "10" : tool === "KB" ? "12" : tool === "MB" ? "4" : tool === "SB" ? "10" : "-";

// Returns the default tool string from ExerciseLibrary, using default_equip first, then first available equip flag
function getDefaultTool(exLib: ExerciseLibrary | undefined): string {
  if (!exLib) return "";
  if (exLib.default_equip) {
    const m: Record<string, string> = { barbell: "Bar", db: "DB", kb: "KB", mb: "MB", sb: "SB" };
    return m[exLib.default_equip] ?? "";
  }
  if (exLib.equip_barbell) return "Bar";
  if (exLib.equip_db)      return "DB";
  if (exLib.equip_kb)      return "KB";
  if (exLib.equip_mb)      return "MB";
  if (exLib.equip_sb)      return "SB";
  return "";
}

// Returns all available tool strings from ExerciseLibrary equip flags
function getAvailableTools(exLib: ExerciseLibrary | undefined): string[] {
  if (!exLib) return [];
  return [
    ...(exLib.equip_barbell ? ["Bar"] : []),
    ...(exLib.equip_db      ? ["DB"]  : []),
    ...(exLib.equip_kb      ? ["KB"]  : []),
    ...(exLib.equip_mb      ? ["MB"]  : []),
    ...(exLib.equip_sb      ? ["SB"]  : []),
  ];
}

// Determina la modalità volume di un esercizio dalla libreria:
// "min" → mostra campo Minuti | "cal" → Calorie | "rep" → Serie/Reps/Rec (default)
function getVolumeMode(exLib?: ExerciseLibrary): "rep" | "min" | "cal" {
  if (!exLib) return "rep";
  if (exLib.default_unit === "min") return "min";
  if (exLib.default_unit === "cal") return "cal";
  if (exLib.default_unit === "rep") return "rep";
  if (exLib.unit_min && !exLib.unit_rep) return "min";
  if (exLib.unit_cal && !exLib.unit_rep) return "cal";
  return "rep";
}
// Restituisce tutte le modalità volume disponibili per un esercizio (es. Assault Bike → ["min","cal"])
function getAvailableVmModes(exLib?: ExerciseLibrary): ("rep" | "min" | "cal")[] {
  if (!exLib) return ["rep"];
  const modes: ("rep" | "min" | "cal")[] = [];
  if (exLib.unit_min) modes.push("min");
  if (exLib.unit_cal) modes.push("cal");
  if (exLib.unit_rep) modes.push("rep");
  return modes.length > 0 ? modes : ["rep"];
}

// Logica unificata per il carico default — uguale per tutte le sezioni
// Controlla tutti i flag libreria (pct → rpe → kg) poi fallback su resolveMaxKey
function computeLoad(name: string, tool: string, exLib?: ExerciseLibrary): string {
  if (exLib) {
    if (exLib.default_load === "pct") return "80%";
    if (exLib.default_load === "rpe") return "RPE 7";
    if (exLib.load_pct) return "80%";
    if (exLib.load_rpe) return "RPE 7";
    if (exLib.load_kg)  return defaultLoadForTool(tool);
    return "-";
  }
  // Fallback: esercizi performance non trovati in libreria
  if (resolveMaxKey(name)) return "80%";
  return defaultLoadForTool(tool);
}

// lib-aware factory helpers — tutte usano computeLoad
const mkMobilitaRow = (name = "", exLib?: ExerciseLibrary): MobilitaRow => {
  const tool = getDefaultTool(exLib) || detectTool(name);
  return { name, sets: "2", reps: "10", load: computeLoad(name, tool, exLib), tool, notes: "" };
};
const mkForzaRow = (name = "", exLib?: ExerciseLibrary): ForzaRow => {
  const tool = getDefaultTool(exLib) || detectTool(name);
  const vm = getVolumeMode(exLib);
  return { name, sets: vm === "rep" ? "3" : "", reps: vm === "min" ? "10 min" : vm === "cal" ? "50 cal" : "5", load: computeLoad(name, tool, exLib), rest: vm === "rep" ? "120" : "", notes: "", progressive: false, loads: [], tool, unitMode: vm };
};
const mkAccessoriRow = (name = "", tool: string = "", exLib?: ExerciseLibrary): AccessoriRow => {
  const effectiveTool = tool || getDefaultTool(exLib) || detectTool(name);
  const vm = getVolumeMode(exLib);
  return {
    name,
    sets: vm === "rep" ? "3" : "",
    reps: vm === "min" ? "10 min" : vm === "cal" ? "50 cal" : "12",
    load: computeLoad(name, effectiveTool, exLib),
    rest: vm === "rep" ? "60" : "",
    notes: "",
    tool: effectiveTool,
    unitMode: vm,
  };
};
const mkCoreRow = (name = "", exLib?: ExerciseLibrary): CoreRow => {
  const tool = getDefaultTool(exLib) || detectTool(name);
  const vm = getVolumeMode(exLib);
  return {
    name,
    sets: vm === "rep" ? "3" : "",
    reps: vm === "min" ? "10 min" : vm === "cal" ? "50 cal" : "15",
    load: computeLoad(name, tool, exLib),
    rest: vm === "rep" ? "30" : "",
    notes: "",
    tool,
    unitMode: vm,
  };
};
const mkWorkoutRow = (name = "", exLib?: ExerciseLibrary): WorkoutRow => {
  const tool = getDefaultTool(exLib) || detectTool(name);
  return { name, reps: "10", load: computeLoad(name, tool, exLib), rounds: "3", minutes: "10", notes: "", tool };
};

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
      cardio: pickPadded("WARMUP", "CARDIO", 2).map(name => {
        const ex = lib[libKey("WARMUP", "CARDIO")]?.find(e => e.name === name);
        const unitMode = (ex?.default_unit ?? "min") as "min" | "cal" | "rep";
        const tool = getDefaultTool(ex) || detectTool(name);
        return mkCardioRow(name, unitMode, tool);
      }),
      mobilita: pickPadded("WARMUP", "MOBILITÀ", 4, dayFilter).map(n => mkMobilitaRow(n, lookupExercise(lib, n))),
      attivazione: getRandom(getLibNames(lib, "WARMUP", "ATTIVAZIONE", dayFilter), 2).map(n => mkMobilitaRow(n, lookupExercise(lib, n))),
    },
    forza: {
      rows: pickPadded("FORZA", forza.libSub, 3).map(n => mkForzaRow(n, lookupExercise(lib, n))),
      libSub: forza.libSub,
      tag: forza.tag,
      label: forza.label,
    },
    accessori: {
      bodyweight: pickPadded("ACCESSORI", "BODYWEIGHT", 1).map(n => mkAccessoriRow(n, getDefaultTool(lookupExercise(lib, n)))),
      manubri:    pickPadded("ACCESSORI", "MANUBRI",    3).map(n => mkAccessoriRow(n, getDefaultTool(lookupExercise(lib, n)) || "DB")),
      kettlebell: pickPadded("ACCESSORI", "KETTLEBELL", 3).map(n => mkAccessoriRow(n, getDefaultTool(lookupExercise(lib, n)) || "KB")),
      bilanciere: pickPadded("ACCESSORI", "BILANCIERE", 2).map(n => mkAccessoriRow(n, getDefaultTool(lookupExercise(lib, n)) || "Bar")),
    },
    core: pickPadded("CORE TRAINING", null, 4).map(n => mkCoreRow(n, lookupExercise(lib, n))),
    workout: (() => {
      const allWk = getLibNames(lib, "WORKOUT", null);
      const pickWk = (sub: string, n: number) => {
        const specific = getLibNames(lib, "WORKOUT", sub);
        const pool = specific.length ? specific : allWk;
        const picked = getRandom(pool, n);
        return [...picked, ...Array(Math.max(0, n - picked.length)).fill("")].map(n => mkWorkoutRow(n, lookupExercise(lib, n)));
      };
      return {
        blocks: [],
      };
    })(),
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
    setOpen(true);
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
        } else if (inputText !== value) {
          // Testo valido ma cambiato senza selezionare dal dropdown → aggiorna state
          onChange(inputText);
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

// ─── ExerciseFields ───────────────────────────────────────────
// Componente unico per volume + carico + hint massimali.
// Usato in BulkAdd, AddExerciseModal e ExerciseRow.
// Tutta la logica libreria vive qui — nessuna duplicazione.
interface ExerciseFieldsProps {
  name: string;
  exLib?: ExerciseLibrary;
  sets?: string;
  reps?: string;
  rest?: string;
  load: string;
  tool: string;
  unitMode?: "rep" | "min" | "cal";
  maxes: Record<string, number>;
  showSets?: boolean;
  showRest?: boolean;
  setsPlaceholder?: string;
  repsPlaceholder?: string;
  restPlaceholder?: string;
  onChange: (updates: Partial<{ sets: string; reps: string; rest: string; load: string; tool: string; unitMode: "rep" | "min" | "cal" }>) => void;
}
function ExerciseFields({
  name, exLib, sets = "", reps = "", rest = "", load, tool, unitMode,
  maxes, showSets = true, showRest = true,
  setsPlaceholder = "3", repsPlaceholder = "10", restPlaceholder = "60",
  onChange,
}: ExerciseFieldsProps) {
  const availVm = getAvailableVmModes(exLib);
  const vm = unitMode ?? getVolumeMode(exLib);
  const hasLoad = exLib
    ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg)
    : (load !== "-" || tool !== "" || !!resolveMaxKey(name));
  const rawReps = reps?.replace(/ (min|cal)$/, "") ?? "";
  const colCount = (vm === "rep") ? [showSets, true, showRest].filter(Boolean).length : 1;

  return (
    <>
      {/* Toggle unità se disponibili più modalità (es. Assault Bike: min/cal) */}
      {availVm.length > 1 && (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
          {availVm.map(m => (
            <button key={m} onClick={() => onChange({
              unitMode: m,
              sets: m === "rep" ? (sets || setsPlaceholder) : "",
              reps: m === "min" ? `${repsPlaceholder} min` : m === "cal" ? `${repsPlaceholder} cal` : repsPlaceholder,
              rest: m === "rep" ? (rest || restPlaceholder) : "",
            })}
              className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${vm === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
              {m === "min" ? "Minuti" : m === "cal" ? "Calorie" : "Reps"}
            </button>
          ))}
        </div>
      )}
      {vm === "rep" ? (
        <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
          {showSets && (
            <div>
              <label className="label">Serie</label>
              <input className="input text-xs text-center" value={sets} onChange={e => onChange({ sets: e.target.value })} placeholder={setsPlaceholder} />
            </div>
          )}
          <div>
            <label className="label">Reps</label>
            <input className="input text-xs text-center" value={reps} onChange={e => onChange({ reps: e.target.value })} placeholder={repsPlaceholder} />
          </div>
          {showRest && (
            <div>
              <label className="label">Rec. sec</label>
              <input className="input text-xs text-center" value={rest} onChange={e => onChange({ rest: e.target.value })} placeholder={restPlaceholder} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="label">{vm === "min" ? "Minuti" : "Calorie"}</label>
          <input
            className="input text-xs text-center"
            value={rawReps}
            onChange={e => onChange({ reps: e.target.value ? `${e.target.value} ${vm}` : "" })}
            placeholder={vm === "min" ? "10" : "50"}
          />
        </div>
      )}
      {hasLoad && (
        <LoadInput
          label="Carico"
          exerciseName={name}
          value={load}
          onChange={v => onChange({ load: v })}
          tool={tool}
          onToolChange={t => onChange({ tool: t })}
          libEx={exLib}
        />
      )}
      {hasLoad && <OneRMHint exerciseName={name} load={load} maxes={maxes} />}
    </>
  );
}

type LoadMode = "pct" | "rpe" | "kg";
const PCT_OPTIONS = ["55%", "60%", "65%", "70%", "75%", "80%", "85%", "90%", "95%", "100%", "105%"];
const RPE_OPTIONS = ["1","2","3","4","5","6","7","8","9","10"].map(n => `RPE ${n}`);

function detectLoadMode(load: string): LoadMode | null {
  if (!load || load === "-") return null; // no explicit value set
  if (load.includes("%")) return "pct";
  if (/^rpe\s/i.test(load)) return "rpe";
  return "kg";
}

function LoadInput({
  exerciseName = "",
  value,
  onChange,
  label,
  tool,
  onToolChange,
  kgOnly = false,
  tools,
  libEx,
}: {
  exerciseName?: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  tool?: string;
  onToolChange?: (t: string) => void;
  kgOnly?: boolean;
  tools?: string[];
  libEx?: ExerciseLibrary; // se presente, sovrascrive tutta la logica hardcoded
}) {
  // Se libEx disponibile → usa flag libreria; altrimenti fallback legacy
  const canPct = libEx ? libEx.load_pct : (!kgOnly && resolveMaxKey(exerciseName) !== null);
  const canRpe = libEx ? libEx.load_rpe : !kgOnly;
  const canKg  = libEx ? libEx.load_kg  : true;

  // Modes disponibili
  const modes: LoadMode[] = libEx
    ? [...(canPct ? ["pct" as const] : []), ...(canKg ? ["kg" as const] : []), ...(canRpe ? ["rpe" as const] : [])]
    : kgOnly ? ["kg"] : canPct ? ["pct", "kg", "rpe"] : ["kg", "rpe"];

  const defaultMode: LoadMode = libEx
    ? (libEx.default_load === "pct" ? "pct" : libEx.default_load === "rpe" ? "rpe" : "kg")
    : (canPct ? "pct" : "kg");

  // Sync load mode when exercise name / libEx changes
  useEffect(() => {
    if (!value || value === "-") {
      if (defaultMode === "pct") onChange("80%");
      else if (defaultMode === "rpe") onChange("RPE 7");
    } else if (value.includes("%") && !canPct) {
      onChange("-");
    } else if (/^rpe\s/i.test(value) && !canRpe) {
      onChange("-");
    }
  }, [exerciseName, libEx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mode: LoadMode = detectLoadMode(value) ?? defaultMode;
  const displayValue = value && value !== "-"
    ? value
    : mode === "pct" ? "80%" : mode === "rpe" ? "RPE 7" : "-";

  const switchMode = (m: LoadMode) => {
    // onToolChange va chiamato PRIMA di onChange: altrimenti il handler onToolChange
    // usa la closure stale di editLoad e sovrascrive il valore appena impostato da onChange
    if (m === "pct") { onToolChange?.(""); onChange("80%"); }
    else if (m === "rpe") { onToolChange?.(""); onChange("RPE 7"); }
    else {
      // kg mode — imposta un valore numerico valido (non "-") così detectLoadMode lo riconosce come "kg"
      const kgDefault = defaultLoadForTool(tool ?? "");
      onChange(kgDefault !== "-" ? kgDefault : "20");
    }
  };

  // Tool disponibili: dalla libreria se libEx presente, altrimenti tools prop o ["DB","KB"]
  const effectiveTools = libEx ? getAvailableTools(libEx) : (tools ?? []);

  return (
    <div className="space-y-0.5">
      {/* Label + mode pills + DB/KB on same row */}
      <div className="flex items-center justify-between gap-1">
        {label && <span className="label mb-0 leading-none shrink-0">{label}</span>}
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex gap-0.5">
            {modes.map(m => {
              const lbl = m === "pct" ? "%" : m === "kg" ? "KG" : "RPE";
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors leading-none ${
                    active
                      ? "bg-lime-400/20 text-lime-700 dark:text-lime-400"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
          {/* Tool toggle — dalla libreria se disponibile, sempre visibile se l'esercizio ha attrezzi */}
          {onToolChange && effectiveTools.length > 0 && (
            <>
              <span className="text-[8px] text-gray-600 dark:text-gray-500 select-none">·</span>
              <div className="flex gap-0.5">
                {effectiveTools.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onToolChange(tool === t ? "" : t)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors leading-none ${
                      tool === t
                        ? "bg-indigo-400/20 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {mode === "pct" ? (
        <select className="input text-xs text-center" value={displayValue} onChange={e => onChange(e.target.value)}>
          {PCT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : mode === "rpe" ? (
        <select className="input text-xs text-center" value={displayValue} onChange={e => onChange(e.target.value)}>
          {RPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <select className="input text-xs text-center" value={displayValue} onChange={e => onChange(e.target.value)}>
          <option value="-">-</option>
          {LOAD_OPTIONS.map(o => <option key={o} value={o}>{o} kg</option>)}
        </select>
      )}
    </div>
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

function calcKgFromPct(pctStr: string, maxKg: number): string {
  const pct = parseFloat(pctStr.replace("%", "").trim());
  if (isNaN(pct) || pct <= 0) return "—";
  const kg = (pct / 100) * maxKg;
  return (Math.round(kg * 2) / 2).toFixed(1);
}

// Detects default tool (DB/KB) from exercise name keywords.
function detectTool(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("manubri") || n.includes("manubrio") || n.includes("bulgarian") || /\bdb\b/.test(n)) return "DB";
  if (/\bkb\b/.test(n)) return "KB";
  return "";
}

// Returns the performance exercise name whose max applies to the given exercise.
// For direct exercises (e.g. "Back Squat") returns itself; for child exercises (e.g. "Box Squat")
// returns the parent name (e.g. "Back Squat"); returns null if no max applies.
function resolveMaxKey(exerciseName: string): string | null {
  const name = exerciseName.trim().toLowerCase();
  const direct = ALL_PERFORMANCE_EXERCISES.find(e => e.toLowerCase() === name);
  if (direct) return direct;
  const childKey = Object.keys(EXERCISE_PARENT_MAP).find(k => k.toLowerCase() === name);
  if (childKey) return EXERCISE_PARENT_MAP[childKey];
  return null;
}

function OneRMHint({ exerciseName, load, maxes }: {
  exerciseName: string;
  load: string;
  maxes: Record<string, number>;
}) {
  const key = resolveMaxKey(exerciseName);
  if (!key) return null;
  const max = maxes[key];

  // Performance exercise but load is not in % (e.g. stored as "-" or kg)
  // Show a nudge so the coach knows this exercise has a max
  if (!load.includes("%")) {
    if (!load || load === "-") {
      if (!max) {
        return (
          <div className="flex items-center gap-1 px-0.5 mt-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <span className="text-[11px] text-gray-400 italic">Massimale non inserito per {key}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 px-0.5 mt-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C0D738" strokeWidth="2.5"><path d="M6 4v16M18 4v16M3 8h4m10 0h4M3 16h4m10 0h4M7 12h10"/></svg>
          <span className="text-[11px] text-gray-400">{key} max <strong className="text-gray-500 dark:text-gray-300">{max} kg</strong> — imposta % per calcolare il carico</span>
        </div>
      );
    }
    return null;
  }

  // Progressive loads: "70%|75%|80%"
  if (load.includes("|")) {
    const parts = load.split("|").filter(l => l.includes("%"));
    if (!max) {
      return (
        <div className="flex items-center gap-1 px-0.5 mt-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          <span className="text-[11px] text-gray-400 italic">Massimale non inserito per {key}</span>
        </div>
      );
    }
    const kgs = parts.map(l => calcKgFromPct(l, max));
    return (
      <div className="flex items-center gap-1.5 px-0.5 mt-0.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C0D738" strokeWidth="2.5"><path d="M6 4v16M18 4v16M3 8h4m10 0h4M3 16h4m10 0h4M7 12h10"/></svg>
        <span className="text-[11px] text-gray-400">{key} max <strong className="text-gray-500 dark:text-gray-300">{max} kg</strong> →</span>
        <span className="text-[11px] font-bold" style={{ color: "#C0D738" }}>≈ {kgs.join(" → ")} kg</span>
      </div>
    );
  }

  // Single load
  if (max) {
    const kg = calcKgFromPct(load, max);
    return (
      <div className="flex items-center gap-1.5 px-0.5 mt-0.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C0D738" strokeWidth="2.5"><path d="M6 4v16M18 4v16M3 8h4m10 0h4M3 16h4m10 0h4M7 12h10"/></svg>
        <span className="text-[11px] text-gray-400">{key} max <strong className="text-gray-500 dark:text-gray-300">{max} kg</strong> →</span>
        <span className="text-[11px] font-bold" style={{ color: "#C0D738" }}>≈ {kg} kg</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-0.5 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
      <span className="text-[11px] text-gray-400 italic">Massimale non inserito per {key}</span>
    </div>
  );
}

function BulkAddModal({ sections, dayLabel, lib, libLoaded, maxes, onSave, onCancel }: {
  sections: WorkoutSection[];
  dayLabel: string;
  lib: LibraryMap;
  libLoaded: boolean;
  maxes: Record<string, number>;
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
        rows: prev.forza.rows.map((r, i) => {
          if (i !== idx) return r;
          const next = { ...r, ...patch };
          // Auto-set tool when exercise name changes
          if ("name" in patch) {
            next.tool = resolveMaxKey(next.name) ? "" : detectTool(next.name);
          }
          // Resize loads array when sets changes in progressive mode
          if (next.progressive && "sets" in patch) {
            const n = Math.max(1, parseInt(next.sets) || 1);
            const base = next.loads[next.loads.length - 1] || next.load || "80%";
            if (n > next.loads.length) {
              next.loads = [...next.loads, ...Array(n - next.loads.length).fill(base)];
            } else {
              next.loads = next.loads.slice(0, n);
            }
          }
          return next;
        }),
      },
    }));

  const updA = <K extends keyof BulkState["accessori"]>(sub: K, idx: number, patch: Partial<AccessoriRow>) =>
    setState(prev => ({
      ...prev,
      accessori: {
        ...prev.accessori,
        [sub]: (prev.accessori[sub] as AccessoriRow[]).map((r, i) => {
          if (i !== idx) return r;
          const next = { ...r, ...patch };
          if ("name" in patch) {
            const detected = detectTool(next.name);
            if (detected) next.tool = detected; // name keyword wins; otherwise keep sub-type default
          }
          return next;
        }),
      },
    }));

  const updC = (idx: number, patch: Partial<CoreRow>) =>
    setState(prev => ({
      ...prev,
      core: prev.core.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        if ("name" in patch) next.tool = detectTool(next.name);
        return next;
      }),
    }));

  const updWk = (blockIdx: number, rowIdx: number, patch: Partial<WorkoutRow>) =>
    setState(prev => ({
      ...prev,
      workout: {
        blocks: prev.workout.blocks.map((b, bi) =>
          bi === blockIdx ? {
            ...b, rows: b.rows.map((r, ri) => {
              if (ri !== rowIdx) return r;
              const next = { ...r, ...patch };
              if ("name" in patch) next.tool = detectTool(next.name);
              return next;
            })
          } : b
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

  const toggleProgressive = (idx: number, on: boolean) =>
    setState(prev => ({
      ...prev,
      forza: {
        ...prev.forza,
        rows: prev.forza.rows.map((r, i) => {
          if (i !== idx) return r;
          if (!on) return { ...r, progressive: false, loads: [] };
          const n = Math.max(1, parseInt(r.sets) || 3);
          const base = r.load && r.load !== "-" ? r.load : "80%";
          return { ...r, progressive: true, loads: Array.from({ length: n }, () => base) };
        }),
      },
    }));

  const updFLoad = (rowIdx: number, setIdx: number, val: string) =>
    setState(prev => ({
      ...prev,
      forza: {
        ...prev.forza,
        rows: prev.forza.rows.map((r, i) =>
          i === rowIdx ? { ...r, loads: r.loads.map((l, j) => j === setIdx ? val : l) } : r
        ),
      },
    }));

  const addF = () =>
    setState(prev => ({ ...prev, forza: { ...prev.forza, rows: [...prev.forza.rows, mkForzaRow()] } }));
  const removeF = (idx: number) =>
    setState(prev => ({ ...prev, forza: { ...prev.forza, rows: prev.forza.rows.filter((_, i) => i !== idx) } }));

  const addA = (sub: keyof BulkState["accessori"]) => {
    const defaultTool: string = sub === "manubri" ? "DB" : sub === "kettlebell" ? "KB" : sub === "bilanciere" ? "Bar" : "";
    setState(prev => ({
      ...prev,
      accessori: { ...prev.accessori, [sub]: [...(prev.accessori[sub] as AccessoriRow[]), mkAccessoriRow("", defaultTool)] },
    }));
  };
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
        return { ...prev, workout: { blocks: prev.workout.blocks.filter(b => b.subtype !== subtype) } };
      }
      if (prev.workout.blocks.length >= 4) return prev; // max 4
      const isLiss = subtype === "cardioliss";
      const specific = getLibNames(lib, "WORKOUT", WORKOUT_LIB_SUB[subtype]);
      // Cardio LISS: cerca esercizi con "liss" nel nome in tutta la libreria (non solo sottocategoria)
      const allWorkout = getWorkoutNames(lib);
      const lissPool = isLiss
        ? getAllLibNames(lib).filter(n => n.toLowerCase().includes("liss"))
        : [];
      const pool = isLiss
        ? (lissPool.length ? lissPool : (specific.length ? specific : allWorkout))
        : (specific.length ? specific : allWorkout);
      const count = isLiss ? 3 : 6;
      const picked = getRandom(pool, count);
      const names = [...picked, ...Array(Math.max(0, count - picked.length)).fill("")];
      const newBlock: WorkoutBlock = { subtype, capTime: "15", rounds: "3", rows: names.map(n => mkWorkoutRow(n, lookupExercise(lib, n))) };
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
      {state.warmup.cardio.map((row, i) => {
        const exLib = lookupExercise(lib, row.name);
        // Se l'esercizio è in libreria → usa i suoi flag esatti
        // Se non è in libreria → fallback cardio = solo MIN
        const hasMin  = exLib ? exLib.unit_min : true;
        const hasCal  = exLib ? exLib.unit_cal : false;
        const hasRep  = exLib ? exLib.unit_rep : false;
        const hasKg   = exLib ? exLib.load_kg   : false;
        const hasDb   = exLib ? exLib.equip_db      : false;
        const hasKb   = exLib ? exLib.equip_kb      : false;
        const hasBar  = exLib ? exLib.equip_barbell : false;
        const hasMb   = exLib ? exLib.equip_mb      : false;
        const hasSb   = exLib ? exLib.equip_sb      : false;
        const cardioTools = getAvailableTools(exLib);
        const available = [
          ...(hasMin ? ["min" as const] : []),
          ...(hasCal ? ["cal" as const] : []),
          ...(hasRep ? ["rep" as const] : []),
        ];
        const unitLabels: Record<string, string> = { min: "MIN", cal: "CAL", rep: "REP" };
        const mode = row.unitMode;
        const showLoad = hasKg && mode === "rep";
        return (
          <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
            <div className="flex gap-2 items-center">
              <AutocompleteInput
                value={row.name}
                onChange={v => {
                  const ex = lookupExercise(lib, v);
                  const def = (ex?.default_unit ?? "min") as "min" | "cal" | "rep";
                  const t: string = getDefaultTool(ex) || detectTool(v);
                  updW("cardio", i, { name: v, unitMode: def, tool: t, load: defaultLoadForTool(t) });
                }}
                suggestions={getLibNames(lib, "WARMUP", "CARDIO")}
                globalSuggestions={getAllLibNames(lib)}
                strict
                placeholder="Esercizio cardio"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Toggle unità dinamico */}
                {available.length > 1 && (
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-[10px] font-semibold">
                    {available.map(u => (
                      <button key={u}
                        onClick={() => updW("cardio", i, { unitMode: u })}
                        className={`px-1.5 py-1 transition-colors ${mode === u ? "text-white" : "text-gray-400"}`}
                        style={mode === u ? { backgroundColor: color } : {}}
                      >{unitLabels[u]}</button>
                    ))}
                  </div>
                )}
                {/* MIN o CAL */}
                {(mode === "min" || mode === "cal") && (
                  <>
                    <input className="input text-xs w-14 text-center"
                      value={row.minutes}
                      onChange={e => updW("cardio", i, { minutes: e.target.value })}
                      placeholder={mode === "cal" ? "200" : "10"} />
                    <span className="text-xs text-gray-400">{mode === "cal" ? "cal" : "min"}</span>
                  </>
                )}
                {/* SERIE x REPS */}
                {mode === "rep" && (
                  <>
                    <input className="input text-xs w-12 text-center" value={row.sets} onChange={e => updW("cardio", i, { sets: e.target.value })} placeholder="2" />
                    <span className="text-xs text-gray-400 self-center">x</span>
                    <input className="input text-xs w-12 text-center" value={row.reps} onChange={e => updW("cardio", i, { reps: e.target.value })} placeholder="10" />
                  </>
                )}
              </div>
              {removeBtn(() => removeW("cardio", i))}
            </div>
            {/* Carico + attrezzo (solo in modalità REP e se l'esercizio ha load_kg) */}
            {showLoad && (
              <LoadInput
                exerciseName={row.name}
                value={row.load}
                onChange={v => updW("cardio", i, { load: v })}
                label="Carico"
                tool={row.tool}
                onToolChange={t => updW("cardio", i, { tool: t })}
                libEx={exLib}
              />
            )}
            {showLoad && <OneRMHint exerciseName={row.name} load={row.load} maxes={maxes} />}
            <BulkNoteField value={row.notes} onChange={v => updW("cardio", i, { notes: v })} />
          </div>
        );
      })}
      {addBtn(() => addW("cardio"), "aggiungi cardio")}

      <SubgroupLabel label={`Mobilità${mobSubLabel}`} color={color} />
      {state.warmup.mobilita.map((row, i) => {
        const exLib = lookupExercise(lib, row.name);
        const vm = getVolumeMode(exLib);
        const hasLoad = exLib
          ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg)
          : (row.load !== "-" || row.tool !== "" || !!resolveMaxKey(row.name));
        return (
          <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1">
            <div className="flex gap-2 items-center">
              <AutocompleteInput
                value={row.name}
                onChange={v => {
                  const ex = lookupExercise(lib, v);
                  const tool = getDefaultTool(ex) || detectTool(v);
                  const load = computeLoad(v, tool, ex);
                  const newVm = getVolumeMode(ex);
                  updW("mobilita", i, {
                    name: v, tool, load,
                    sets: newVm === "rep" ? "2" : "",
                    reps: newVm === "min" ? "10" : newVm === "cal" ? "50" : "10",
                  });
                }}
                suggestions={getLibNames(lib, "WARMUP", "MOBILITÀ", mobFilter)}
                globalSuggestions={getAllLibNames(lib)}
                strict
                placeholder="Esercizio mobilità"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                {vm === "rep" ? (
                  <>
                    <input className="input text-xs w-12 text-center" value={row.sets} onChange={e => updW("mobilita", i, { sets: e.target.value })} placeholder="2" />
                    <span className="text-xs text-gray-400 self-center">x</span>
                    <input className="input text-xs w-12 text-center" value={row.reps} onChange={e => updW("mobilita", i, { reps: e.target.value })} placeholder="10" />
                  </>
                ) : (
                  <>
                    <input className="input text-xs w-14 text-center" value={row.reps} onChange={e => updW("mobilita", i, { reps: e.target.value })} placeholder={vm === "min" ? "10" : "50"} />
                    <span className="text-xs text-gray-400">{vm === "min" ? "min" : "cal"}</span>
                  </>
                )}
              </div>
              {removeBtn(() => removeW("mobilita", i))}
            </div>
            {hasLoad && (
              <LoadInput label="Carico" exerciseName={row.name} value={row.load}
                onChange={v => updW("mobilita", i, { load: v })} tool={row.tool}
                onToolChange={t => updW("mobilita", i, { tool: t })} libEx={exLib} />
            )}
            {hasLoad && <OneRMHint exerciseName={row.name} load={row.load} maxes={maxes} />}
            <BulkNoteField value={row.notes} onChange={v => updW("mobilita", i, { notes: v })} />
          </div>
        );
      })}
      {addBtn(() => addW("mobilita"), "aggiungi mobilità")}

      <SubgroupLabel label={`Attivazione${mobSubLabel}`} color={color} />
      {state.warmup.attivazione.map((row, i) => {
        const exLib = lookupExercise(lib, row.name);
        const vm = getVolumeMode(exLib);
        const hasLoad = exLib
          ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg)
          : (row.load !== "-" || row.tool !== "" || !!resolveMaxKey(row.name));
        return (
          <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1">
            <div className="flex gap-2 items-center">
              <AutocompleteInput
                value={row.name}
                onChange={v => {
                  const ex = lookupExercise(lib, v);
                  const tool = getDefaultTool(ex) || detectTool(v);
                  const load = computeLoad(v, tool, ex);
                  const newVm = getVolumeMode(ex);
                  updW("attivazione", i, {
                    name: v, tool, load,
                    sets: newVm === "rep" ? "2" : "",
                    reps: newVm === "min" ? "10" : newVm === "cal" ? "50" : "10",
                  });
                }}
                suggestions={mobFilter === "FULL"
                  ? [...getLibNames(lib, "WARMUP", "ATTIVAZIONE", "UPPER"), ...getLibNames(lib, "WARMUP", "ATTIVAZIONE", "LOWER")]
                  : getLibNames(lib, "WARMUP", "ATTIVAZIONE", mobFilter)}
                globalSuggestions={getAllLibNames(lib)}
                strict
                placeholder="Esercizio attivazione"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                {vm === "rep" ? (
                  <>
                    <input className="input text-xs w-12 text-center" value={row.sets} onChange={e => updW("attivazione", i, { sets: e.target.value })} placeholder="2" />
                    <span className="text-xs text-gray-400 self-center">x</span>
                    <input className="input text-xs w-12 text-center" value={row.reps} onChange={e => updW("attivazione", i, { reps: e.target.value })} placeholder="10" />
                  </>
                ) : (
                  <>
                    <input className="input text-xs w-14 text-center" value={row.reps} onChange={e => updW("attivazione", i, { reps: e.target.value })} placeholder={vm === "min" ? "10" : "50"} />
                    <span className="text-xs text-gray-400">{vm === "min" ? "min" : "cal"}</span>
                  </>
                )}
              </div>
              {removeBtn(() => removeW("attivazione", i))}
            </div>
            {hasLoad && (
              <LoadInput label="Carico" exerciseName={row.name} value={row.load}
                onChange={v => updW("attivazione", i, { load: v })} tool={row.tool}
                onToolChange={t => updW("attivazione", i, { tool: t })} libEx={exLib} />
            )}
            {hasLoad && <OneRMHint exerciseName={row.name} load={row.load} maxes={maxes} />}
            <BulkNoteField value={row.notes} onChange={v => updW("attivazione", i, { notes: v })} />
          </div>
        );
      })}
      {addBtn(() => addW("attivazione"), "aggiungi attivazione")}
    </div>
  );

  const renderForza = () => (
    <div className="space-y-1">
      <SubgroupLabel label={state.forza.label} color={color} />
      {state.forza.rows.map((row, i) => {
        const exLib = lookupExercise(lib, row.name);
        const availVm = getAvailableVmModes(exLib);
        const vm = row.unitMode ?? getVolumeMode(exLib);
        const hasLoad = exLib
          ? !!(exLib.load_pct || exLib.load_rpe || exLib.load_kg)
          : (row.load !== "-" || row.tool !== "" || !!resolveMaxKey(row.name));
        return (
          <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
            <div className="flex gap-2 items-center">
              <AutocompleteInput
                value={row.name}
                onChange={v => {
                  const ex = lookupExercise(lib, v);
                  const tool = getDefaultTool(ex) || detectTool(v);
                  const load = computeLoad(v, tool, ex);
                  const newVm = getVolumeMode(ex);
                  updF(i, {
                    name: v, tool, load, unitMode: newVm,
                    sets: newVm === "rep" ? "3" : "",
                    reps: newVm === "min" ? "10 min" : newVm === "cal" ? "50 cal" : "5",
                    rest: newVm === "rep" ? "120" : "",
                  });
                }}
                suggestions={getLibNames(lib, "FORZA", state.forza.libSub)}
                globalSuggestions={getAllLibNames(lib)}
                strict
                placeholder={`Esercizio ${state.forza.label.toLowerCase()}`}
              />
              {removeBtn(() => removeF(i))}
            </div>
            {/* Toggle unità se disponibili più modalità */}
            {availVm.length > 1 && (
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                {availVm.map(m => (
                  <button key={m} onClick={() => updF(i, { unitMode: m, sets: m === "rep" ? "3" : "", reps: m === "min" ? "10 min" : m === "cal" ? "50 cal" : "5", rest: m === "rep" ? "120" : "" })}
                    className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-colors ${vm === m ? "bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                    {m === "min" ? "Minuti" : m === "cal" ? "Calorie" : "Reps"}
                  </button>
                ))}
              </div>
            )}
            {/* Volume — library-driven */}
            {vm === "rep" ? (
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="label">Serie</label>
                  <input className="input text-xs text-center" value={row.sets} onChange={e => updF(i, { sets: e.target.value })} placeholder="3" />
                </div>
                <div>
                  <label className="label">Reps</label>
                  <input className="input text-xs text-center" value={row.reps} onChange={e => updF(i, { reps: e.target.value })} placeholder="5" />
                </div>
                <div>
                  <label className="label">Rec. sec</label>
                  <input className="input text-xs text-center" value={row.rest} onChange={e => updF(i, { rest: e.target.value })} placeholder="120" />
                </div>
              </div>
            ) : (
              <div>
                <label className="label">{vm === "min" ? "Minuti" : "Calorie"}</label>
                <input
                  className="input text-xs text-center"
                  value={row.reps?.replace(/ (min|cal)$/, "") ?? ""}
                  onChange={e => updF(i, { reps: e.target.value ? `${e.target.value} ${vm}` : "" })}
                  placeholder={vm === "min" ? "10" : "50"}
                />
              </div>
            )}
            {/* CARICO — library-driven, solo se ha carico */}
            {hasLoad && !row.progressive && (
              <LoadInput
                label="Carico"
                exerciseName={row.name}
                value={row.load}
                onChange={v => updF(i, { load: v })}
                tool={row.tool}
                onToolChange={v => updF(i, { tool: v })}
                libEx={exLib}
              />
            )}
            {/* Progressive — solo per esercizi rep */}
            {vm === "rep" && (
              <label className="flex items-center gap-1 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={row.progressive}
                  onChange={e => toggleProgressive(i, e.target.checked)}
                  className="w-3 h-3 accent-lime-500"
                />
                <span className="text-[10px] text-gray-400 select-none">Progressivo</span>
              </label>
            )}
            {/* Per-set loads when progressive */}
            {row.progressive && row.loads.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Carico per set</p>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(row.loads.length, 4)}, 1fr)` }}>
                  {row.loads.map((load, si) => {
                    const key = resolveMaxKey(row.name);
                    const max = key ? maxes[key] : undefined;
                    const hint = max && load.includes("%") ? calcKgFromPct(load, max) : null;
                    return (
                      <div key={si}>
                        <label className="label">S{si + 1}</label>
                        <LoadInput exerciseName={row.name} value={load} onChange={v => updFLoad(i, si, v)} libEx={exLib} />
                        {hint && <p className="text-[9px] text-lime-600 dark:text-lime-400 text-center mt-0.5">≈ {hint} kg</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {hasLoad && !row.progressive && <OneRMHint exerciseName={row.name} load={row.load} maxes={maxes} />}
            <BulkNoteField value={row.notes} onChange={v => updF(i, { notes: v })} />
          </div>
        );
      })}
      {addBtn(addF, "aggiungi esercizio")}
    </div>
  );

  const accessoriGroup = (label: string, sub: keyof BulkState["accessori"], libSub: string) => (
    <>
      <SubgroupLabel label={label} color={color} />
      {(state.accessori[sub] as AccessoriRow[]).map((row, i) => {
        const exLib = lookupExercise(lib, row.name);
        return (
          <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
            <div className="flex gap-2 items-center">
              <AutocompleteInput
                value={row.name}
                onChange={v => {
                  const ex = lookupExercise(lib, v);
                  const tool = getDefaultTool(ex) || detectTool(v);
                  const load = computeLoad(v, tool, ex);
                  const newVm = getVolumeMode(ex);
                  updA(sub, i, {
                    name: v, tool, load, unitMode: newVm,
                    sets: newVm === "rep" ? "3" : "",
                    reps: newVm === "min" ? "10 min" : newVm === "cal" ? "50 cal" : "12",
                    rest: newVm === "rep" ? "60" : "",
                  });
                }}
                suggestions={getLibNames(lib, "ACCESSORI", libSub)}
                globalSuggestions={getAllLibNames(lib)}
                strict
                placeholder={`Esercizio ${label.toLowerCase()}`}
              />
              {removeBtn(() => removeA(sub, i))}
            </div>
            <ExerciseFields
              name={row.name} exLib={exLib}
              sets={row.sets} reps={row.reps} rest={row.rest}
              load={row.load} tool={row.tool}
              unitMode={row.unitMode}
              maxes={maxes}
              setsPlaceholder="3" repsPlaceholder="12" restPlaceholder="60"
              onChange={updates => updA(sub, i, updates)}
            />
            <BulkNoteField value={row.notes} onChange={v => updA(sub, i, { notes: v })} />
          </div>
        );
      })}
      {addBtn(() => addA(sub), `aggiungi ${label.toLowerCase()}`)}
    </>
  );

  const renderAccessori = () => (
    <div className="space-y-1">
      {accessoriGroup("Bodyweight", "bodyweight", "BODYWEIGHT")}
      {accessoriGroup("Manubri", "manubri", "MANUBRI")}
      {accessoriGroup("Kettlebell", "kettlebell", "KETTLEBELL")}
      {accessoriGroup("Bilanciere", "bilanciere", "BILANCIERE")}
    </div>
  );

  const renderCore = () => (
    <div className="space-y-1">
      {state.core.map((row, i) => {
        const exLib = lookupExercise(lib, row.name);
        return (
          <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-1.5">
            <div className="flex gap-2 items-center">
              <AutocompleteInput
                value={row.name}
                onChange={v => {
                  const ex = lookupExercise(lib, v);
                  const tool = getDefaultTool(ex) || detectTool(v);
                  const load = computeLoad(v, tool, ex);
                  const newVm = getVolumeMode(ex);
                  updC(i, {
                    name: v, tool, load, unitMode: newVm,
                    sets: newVm === "rep" ? "3" : "",
                    reps: newVm === "min" ? "10 min" : newVm === "cal" ? "50 cal" : "15",
                    rest: newVm === "rep" ? "30" : "",
                  });
                }}
                suggestions={getLibNames(lib, "CORE TRAINING", null)}
                globalSuggestions={getAllLibNames(lib)}
                strict
                placeholder="Esercizio core"
              />
              {removeBtn(() => removeCoreRow(i))}
            </div>
            <ExerciseFields
              name={row.name} exLib={exLib}
              sets={row.sets} reps={row.reps} rest={row.rest}
              load={row.load} tool={row.tool}
              unitMode={row.unitMode}
              maxes={maxes}
              setsPlaceholder="3" repsPlaceholder="15" restPlaceholder="30"
              onChange={updates => updC(i, updates)}
            />
            <BulkNoteField value={row.notes} onChange={v => updC(i, { notes: v })} />
          </div>
        );
      })}
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
          <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Seleziona tipo (nessuno = niente workout)</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["amrap", "emom", "fortime", "cardioliss"] as WorkoutSubtype[]).map(t => {
              const isActive = activeSubtypes.includes(t);
              const isDisabled = !isActive && activeSubtypes.length >= 4;
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

        {/* Messaggio nessun workout */}
        {blocks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">Nessun workout selezionato — il giorno non avrà sezione workout.</p>
        )}

        {/* Per-block rows */}
        {blocks.map((block, blockIdx) => {
          const isCardioliss = block.subtype === "cardioliss";
          return (
            <div key={block.subtype} className="space-y-2">
              {/* Block header with rounds (fortime only) + cap time */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                  {WORKOUT_SUBTYPE_LABELS[block.subtype]}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  {block.subtype === "fortime" && (
                    <div className="flex items-center gap-1">
                      <input
                        className="input text-xs w-12 text-center"
                        value={block.rounds}
                        onChange={e => setState(prev => ({
                          ...prev,
                          workout: { blocks: prev.workout.blocks.map((b, bi) => bi === blockIdx ? { ...b, rounds: e.target.value } : b) },
                        }))}
                        placeholder="3"
                      />
                      <span className="text-[10px] text-gray-400">rounds</span>
                    </div>
                  )}
                  {!isCardioliss && (
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-gray-400">Cap:</label>
                      <input
                        className="input text-xs w-14 text-center"
                        value={block.capTime}
                        onChange={e => setState(prev => ({
                          ...prev,
                          workout: { blocks: prev.workout.blocks.map((b, bi) => bi === blockIdx ? { ...b, capTime: e.target.value } : b) },
                        }))}
                        placeholder="15"
                      />
                      <span className="text-[10px] text-gray-400">min</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-1.5">
                {block.rows.map((row, rowIdx) => {
                  const wkExLib = lookupExercise(lib, row.name);
                  const wkVm = getVolumeMode(wkExLib);
                  const wkHasLoad = wkExLib
                    ? !!(wkExLib.load_pct || wkExLib.load_rpe || wkExLib.load_kg)
                    : (row.load !== "-" || row.tool !== "" || !!resolveMaxKey(row.name));
                  const wkUnitLabel = wkVm === "min" ? "min" : wkVm === "cal" ? "cal" : "reps";
                  const wkPlaceholder = wkVm === "min" ? "10" : wkVm === "cal" ? "50" : "10";
                  return (
                  <div key={rowIdx} className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                    {isCardioliss ? (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <AutocompleteInput
                            value={row.name}
                            onChange={v => {
                              const ex = lookupExercise(lib, v);
                              const tool = getDefaultTool(ex) || detectTool(v);
                              const load = computeLoad(v, tool, ex);
                              updWk(blockIdx, rowIdx, { name: v, tool, load });
                            }}
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
                      <div className="space-y-1.5">
                        <div className="flex gap-2 items-center flex-wrap">
                          <AutocompleteInput
                            value={row.name}
                            onChange={v => {
                              const ex = lookupExercise(lib, v);
                              const tool = getDefaultTool(ex) || detectTool(v);
                              const load = computeLoad(v, tool, ex);
                              const newVm = getVolumeMode(ex);
                              updWk(blockIdx, rowIdx, {
                                name: v, tool, load,
                                reps: newVm === "min" ? "10" : newVm === "cal" ? "50" : "15",
                              });
                            }}
                            suggestions={getWorkoutNames(lib)}
                            globalSuggestions={getAllLibNames(lib)}
                            strict
                            placeholder="Esercizio"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input className="input text-xs w-14 text-center" value={row.reps} onChange={e => updWk(blockIdx, rowIdx, { reps: e.target.value })} placeholder={wkPlaceholder} />
                            <span className="text-xs text-gray-400">{wkUnitLabel}</span>
                          </div>
                          {removeBtn(() => removeWkRow(blockIdx, rowIdx))}
                        </div>
                        {wkHasLoad && <LoadInput exerciseName={row.name} value={row.load} onChange={v => updWk(blockIdx, rowIdx, { load: v })} label="Carico" tool={row.tool} onToolChange={t => updWk(blockIdx, rowIdx, { tool: t })} libEx={wkExLib} />}
                        {wkHasLoad && <OneRMHint exerciseName={row.name} load={row.load} maxes={maxes} />}
                        <BulkNoteField value={row.notes} onChange={v => updWk(blockIdx, rowIdx, { notes: v })} />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <AutocompleteInput
                            value={row.name}
                            onChange={v => {
                              const ex = lookupExercise(lib, v);
                              const tool = getDefaultTool(ex) || detectTool(v);
                              const load = computeLoad(v, tool, ex);
                              const newVm = getVolumeMode(ex);
                              updWk(blockIdx, rowIdx, {
                                name: v, tool, load,
                                reps: newVm === "min" ? "10" : newVm === "cal" ? "50" : "10",
                              });
                            }}
                            suggestions={getWorkoutNames(lib)}
                            globalSuggestions={getAllLibNames(lib)}
                            strict
                            placeholder="Esercizio"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input className="input text-xs w-14 text-center" value={row.reps} onChange={e => updWk(blockIdx, rowIdx, { reps: e.target.value })} placeholder={wkPlaceholder} />
                            <span className="text-xs text-gray-400">{wkUnitLabel}</span>
                          </div>
                          {removeBtn(() => removeWkRow(blockIdx, rowIdx))}
                        </div>
                        {wkHasLoad && <LoadInput exerciseName={row.name} value={row.load} onChange={v => updWk(blockIdx, rowIdx, { load: v })} label="Carico" tool={row.tool} onToolChange={t => updWk(blockIdx, rowIdx, { tool: t })} libEx={wkExLib} />}
                        {wkHasLoad && <OneRMHint exerciseName={row.name} load={row.load} maxes={maxes} />}
                        <BulkNoteField value={row.notes} onChange={v => updWk(blockIdx, rowIdx, { notes: v })} />
                      </div>
                    )}
                  </div>
                  );
                })}
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
  const [weekDateStart, setWeekDateStart] = useState<string | null>(null);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [isClientView, setIsClientView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const clearAllRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirmClearAll) clearAllRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [confirmClearAll]);
  const [lib, setLib] = useState<LibraryMap>({});
  const [libLoaded, setLibLoaded] = useState(false);
  const [maxes, setMaxes] = useState<Record<string, number>>({});
  const [addModalSection, setAddModalSection] = useState<WorkoutSection | null>(null);

  // Load exercise library + client maxes once
  useEffect(() => {
    fetch(`/api/client-maxes?client_id=${clientId}`)
      .then(r => r.json())
      .then((data: { exercise_name: string; weight_kg: number | null }[]) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach(r => {
          if (r.weight_kg != null) map[r.exercise_name] = r.weight_kg;
        });
        setMaxes(map);
      });
  }, [clientId]);

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
    const [{ data: d }, { data: c }, { data: w }, { data: userData }, schedRes] = await Promise.all([
      supabase.from("training_days").select("*").eq("id", dayId).single(),
      supabase.from("clients").select("name, surname, email").eq("id", clientId).single(),
      supabase.from("training_weeks").select("week_number, date_start").eq("id", weekId).single(),
      supabase.auth.getUser(),
      fetch(`/api/client-schedule?client_id=${clientId}`),
    ]);
    setDay(d);
    if (c) {
      setClientName(`${c.name} ${c.surname}`);
      if (c.email === userData.user?.email) {
        setIsClientView(true);
        document.documentElement.classList.add("dark");
      }
    }
    if (w) {
      setWeekLabel(`Sett. ${w.week_number}`);
      setWeekDateStart(w.date_start ?? null);
    }
    const schedData = schedRes.ok ? await schedRes.json() : [];
    setScheduledDays((schedData ?? []).map((r: any) => r.day_of_week).sort((a: number, b: number) => a - b));

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
    // Library-driven: esercizi min/cal non devono avere sets né rest_time
    const exLib = lib ? lookupExercise(lib, ex.name) : undefined;
    const vm = getVolumeMode(exLib);
    const isMinCal = vm !== "rep";
    const setsVal     = isMinCal ? null : (ex.sets ?? null);
    const restTimeVal = isMinCal ? null : (ex.rest_time ?? null);
    // Aggiorna anche lo stato locale per coerenza nel display
    if (isMinCal && (ex.sets || ex.rest_time)) {
      setSections(prev => prev.map(s => ({
        ...s,
        exercises: (s.exercises ?? []).map(e =>
          e.id === ex.id ? { ...e, sets: null, rest_time: null } : e
        ),
      })));
    }
    await supabase.from("exercises").update({
      name: ex.name,
      sets: setsVal,
      reps: ex.reps ?? null,
      load: ex.load ?? null,
      rest_time: restTimeVal,
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

  const handleSetStatus = async (status: DayStatus) => {
    if (!day) return;
    const newStatus = day.status === status ? "pending" : status;
    await supabase.from("training_days").update({ status: newStatus }).eq("id", day.id);
    setDay(prev => prev ? { ...prev, status: newStatus } : prev);
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

    // Cancella tutti gli esercizi esistenti in tutte le sezioni (sovrascrittura)
    await Promise.all(sections.map(s => supabase.from("exercises").delete().eq("section_id", s.id)));

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
      rows.filter(r => r.name.trim()).forEach((r, i) => {
        toInsert.push({
          section_id: section.id,
          name: r.name.trim(),
          sets: r.sets?.trim() || null,
          reps: r.reps?.trim() || null,
          load: r.load?.trim() && r.load.trim() !== "-" ? r.load.trim() : null,
          rest_time: r.rest?.trim() ? `${r.rest.trim()} sec` : null,
          notes: r.notes?.trim() || null,
          order_index: i,
        });
      });
    };

    // Warmup: cardio
    const warmupSection = sections.find(s => s.section_type === "warmup");
    if (warmupSection) {
      const warmupRows: InsertRow[] = [];
      let warmupCount = 0;

      bulkState.warmup.cardio.filter(r => r.name.trim()).forEach((r, i) => {
        warmupRows.push({
          section_id: warmupSection.id,
          name: r.name.trim(),
          sets: r.unitMode === "rep" ? (r.sets || null) : null,
          reps: r.unitMode === "rep"
            ? (r.reps || null)
            : r.minutes ? `${r.minutes} ${r.unitMode === "cal" ? "cal" : "min"}` : null,
          load: r.unitMode === "rep" && r.load && r.load !== "-" ? (() => {
            const toolImplied = detectTool(r.name) === r.tool;
            return r.tool && !toolImplied ? `${r.load} ${r.tool}` : r.load;
          })() : null,
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
    push("strength", bulkState.forza.rows.map(r => {
      const baseLoad = r.progressive && r.loads.length ? r.loads.join("|") : r.load;
      const effectiveMode = detectLoadMode(baseLoad) ?? "kg";
      // Only append tool if name doesn't already imply it (e.g. "Manubri" in name → no "DB" suffix)
      const toolImpliedByName = detectTool(r.name) === r.tool;
      const finalLoad = (r.tool && effectiveMode === "kg" && !toolImpliedByName) ? `${baseLoad} ${r.tool}` : baseLoad;
      return {
        name: r.name, sets: r.sets, reps: r.reps,
        load: finalLoad,
        rest: r.rest,
        notes: tagNotes(bulkState.forza.tag, r.notes ?? ""),
      };
    }));

    // Accessori
    const accessoriSection = sections.find(s => s.section_type === "accessories");
    if (accessoriSection) {
      const accRows: InsertRow[] = [];

      const buildAccLoad = (r: AccessoriRow) => {
        if (!r.load || r.load === "-") return null;
        const toolImpliedByName = detectTool(r.name) === r.tool;
        if (r.tool && !toolImpliedByName) return `${r.load} ${r.tool}`;
        return r.load;
      };

      const pushAcc = (rows: AccessoriRow[], groupTag: string, includeLoad = true) => {
        rows.filter(r => r.name.trim()).forEach(r => {
          accRows.push({
            section_id: accessoriSection.id,
            name: r.name.trim(),
            sets: r.sets?.trim() || null,
            reps: r.reps?.trim() || null,
            load: includeLoad ? buildAccLoad(r) : null,
            rest_time: r.rest ? `${r.rest} sec` : null,
            notes: tagNotes(groupTag, r.notes ?? ""),
            order_index: accRows.length,
          });
        });
      };

      pushAcc(bulkState.accessori.bodyweight, "bw", false);
      pushAcc(bulkState.accessori.manubri, "man");
      pushAcc(bulkState.accessori.kettlebell, "kb");
      pushAcc(bulkState.accessori.bilanciere, "bar");

      toInsert.push(...accRows);
    }

    // Core
    push("core", bulkState.core.map(r => {
      const toolImpliedByName = detectTool(r.name) === r.tool;
      const load = (!r.load || r.load === "-") ? undefined
        : (r.tool && !toolImpliedByName) ? `${r.load} ${r.tool}` : r.load;
      return { name: r.name, sets: r.sets, reps: r.reps, load, rest: r.rest, notes: r.notes };
    }));

    // Workout — iterate blocks, tag each exercise with its subtype
    if (workoutSection) {
      let wkCount = 0;
      bulkState.workout.blocks.forEach(block => {
        const isCardioliss = block.subtype === "cardioliss";
        const isForTime = block.subtype === "fortime";
        block.rows.filter(r => r.name.trim()).forEach(r => {
          const toolImpliedByName = detectTool(r.name) === r.tool;
          const rawLoad = r.load?.trim();
          const load = (!rawLoad || rawLoad === "-") ? null
            : (r.tool && !toolImpliedByName) ? `${rawLoad} ${r.tool}` : rawLoad;
          toInsert.push({
            section_id: workoutSection.id,
            name: r.name.trim(),
            sets: isForTime ? (block.rounds?.trim() || null) : null,
            reps: isCardioliss ? (r.minutes ? `${r.minutes} min` : null) : (r.reps?.trim() || null),
            load,
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

  const formatDayDate = (d: Date | null) => {
    if (!d) return null;
    return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  };

  const resolvedDayDate = (() => {
    if (day?.day_date) return new Date(day.day_date);
    if (weekDateStart && scheduledDays.length > 0 && day) {
      const idx = day.day_number - 1;
      if (idx < scheduledDays.length) {
        const start = new Date(weekDateStart);
        start.setHours(12, 0, 0, 0);
        start.setDate(start.getDate() + scheduledDays[idx]);
        return start;
      }
    }
    return null;
  })();

  const dayDateLabel = formatDayDate(resolvedDayDate);

  const handlePrintPDF = () => {
    const sectionOrder: SectionType[] = ["warmup", "strength", "accessories", "core", "workout"];
    const sectionLabels: Record<SectionType, string> = {
      warmup: "Warm Up", strength: "Forza", accessories: "Accessori",
      core: "Core Training", workout: "Workout",
    };
    const filled = sectionOrder
      .map(t => sections.find(s => s.section_type === t))
      .filter(s => s && (s.exercises?.length ?? 0) > 0) as WorkoutSection[];

    const rowsHtml = (exs: Exercise[]) => exs.map(ex => {
      const parts: string[] = [];
      if (ex.sets && ex.reps) parts.push(`${ex.sets} × ${ex.reps}`);
      else if (ex.reps) parts.push(ex.reps);
      if (ex.load && ex.load !== "-") parts.push(ex.load);
      if (ex.rest_time) parts.push(`⏱ ${ex.rest_time}`);
      const { cleanNotes } = parseExerciseGroup(ex.notes);
      return `<tr>
        <td style="padding:6px 10px;font-weight:600;color:#111">${ex.name}</td>
        <td style="padding:6px 10px;color:#444;white-space:nowrap">${parts.join(" · ") || "—"}</td>
        <td style="padding:6px 10px;color:#888;font-size:12px">${cleanNotes ?? ""}</td>
      </tr>`;
    }).join("");

    const sectionsHtml = filled.map(s => `
      <div style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8a9a00;margin-bottom:8px">
          ${sectionLabels[s.section_type]}
        </div>
        <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden">
          <tbody>${rowsHtml(s.exercises ?? [])}</tbody>
        </table>
      </div>`).join("");

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${day!.label} — ${clientName}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; max-width: 700px; margin: 0 auto; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        p  { font-size: 13px; color: #666; margin: 0 0 24px; }
        tr:nth-child(even) { background: #f0f0f0; }
        td { border: none; }
        @media print { body { padding: 16px; } }
      </style>
    </head><body>
      <h1>${day!.label}</h1>
      <p>${clientName} · ${weekLabel}${dayDateLabel ? ` · ${dayDateLabel}` : ""}</p>
      ${sectionsHtml}
    </body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

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
        subtitle={`${clientName} · ${weekLabel}${dayDateLabel ? ` · ${dayDateLabel}` : ""}`}
        clientView={isClientView}
        right={
          <div className="flex items-center gap-2">
            {!isClientView && (
              <button
                onClick={() => setShowBulkAdd(true)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Precompila giornata
              </button>
            )}
            {totalExercises > 0 && (
              <button
                onClick={handlePrintPDF}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                title="Stampa / Salva PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
              </button>
            )}
            {saving
              ? <span className="text-xs text-amber-600 font-medium animate-pulse">Salvo...</span>
              : <span className="text-xs text-green-600 font-medium">{totalExercises} es.</span>
            }
          </div>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {!isClientView && totalExercises > 0 && !editingExId && (
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
            maxes={maxes}
            onToggleEdit={handleToggleEdit}
            onUpdateEx={handleUpdateExercise}
            onDeleteEx={handleDeleteExercise}
            onSaveEx={handleSaveExercise}
            onAddEx={handleAddExercise}
            onClearSection={handleClearSection}
            readOnly={isClientView}
          />
        ))}

        {/* Cancella tutto il giorno */}
        {!isClientView && totalExercises > 0 && (
          <div className="pb-2 text-center">
            {confirmClearAll ? (
              <div ref={clearAllRef} className="card p-4 text-center space-y-3">
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

        {/* Status buttons — visibili sempre (coach e cliente) */}
        {day && (
          <div className="flex flex-col items-center gap-2 mt-5 mb-2">
            {/* Bottone principale — Completa */}
            <button
              onClick={() => handleSetStatus("done")}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98] ${
                day.status === "done"
                  ? "bg-green-500 text-white shadow-green-200 dark:shadow-green-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {day.status === "done" ? "Giornata completata ✓" : "Completa giornata"}
            </button>

            {/* Bottone secondario — Salta */}
            <button
              onClick={() => handleSetStatus("skip")}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                day.status === "skip"
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-500"
                  : "text-gray-400 dark:text-gray-600 hover:text-orange-400 dark:hover:text-orange-400"
              }`}
            >
              {day.status === "skip" ? "✕ Saltata" : "Salta giornata"}
            </button>
          </div>
        )}

        <div className="h-6" />
      </main>

      <Modal open={showBulkAdd} onClose={() => setShowBulkAdd(false)} title="Precompila giornata">
        {showBulkAdd && sections.length > 0 && (
          <BulkAddModal
            sections={sections}
            dayLabel={day?.label ?? ""}
            lib={lib}
            libLoaded={libLoaded}
            maxes={maxes}
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
          maxes={maxes}
          onSave={handleAddExerciseConfirm}
          onCancel={() => setAddModalSection(null)}
        />
      )}
    </div>
  );
}
