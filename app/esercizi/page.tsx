"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExerciseLibrary, LIBRARY_CATEGORIES, WARMUP_SUBCATEGORIES, WARMUP_SUB_SUBCATEGORIES, FORZA_SUBCATEGORIES, ACCESSORI_SUBCATEGORIES, CORE_SUBCATEGORIES } from "@/lib/types";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

// ─── Colori per categoria ─────────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  "WARMUP":        "#C0D738",
  "FORZA":         "#F97316",
  "ACCESSORI":     "#8B5CF6",
  "CORE TRAINING": "#EF4444",
  "WORKOUT":       "#3B82F6",
};

// ─── Form aggiunta esercizio ──────────────────────────────────
function AddExerciseForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("WARMUP");
  const [subcategory, setSubcategory] = useState<string>("CARDIO");
  const [subSubcategory, setSubSubcategory] = useState<string>("UPPER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const showSub = category === "WARMUP" || category === "FORZA" || category === "ACCESSORI" || category === "CORE TRAINING";
  const showSubSub = category === "WARMUP" && (subcategory === "MOBILITÀ" || subcategory === "ATTIVAZIONE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Il nome è obbligatorio"); return; }
    setSaving(true);
    const { error: err } = await supabase.from("exercise_library").insert({
      name: name.trim(),
      category,
      subcategory: showSub ? subcategory : null,
      sub_subcategory: showSubSub ? subSubcategory : null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Categoria */}
      <div>
        <label className="label">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {LIBRARY_CATEGORIES.map(c => (
            <button key={c} type="button"
              onClick={() => {
                setCategory(c);
                setSubcategory(c === "WARMUP" ? "CARDIO" : c === "FORZA" ? "LOWER BODY" : c === "ACCESSORI" ? "BODYWEIGHT" : c === "CORE TRAINING" ? "ISOMETRICI" : "");
                setSubSubcategory("UPPER");
              }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${category === c ? "border-transparent text-black" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"}`}
              style={category === c ? { backgroundColor: CATEGORY_COLOR[c] } : {}}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* 2. Sottocategoria (WARMUP o FORZA) */}
      {showSub && (
        <div>
          <label className="label">Sottocategoria</label>
          <div className="flex gap-2 flex-wrap">
            {(category === "WARMUP" ? WARMUP_SUBCATEGORIES : category === "FORZA" ? FORZA_SUBCATEGORIES : category === "ACCESSORI" ? ACCESSORI_SUBCATEGORIES : CORE_SUBCATEGORIES).map(s => (
              <button key={s} type="button"
                onClick={() => { setSubcategory(s); setSubSubcategory("UPPER"); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${subcategory === s ? "border-transparent text-black" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"}`}
                style={subcategory === s ? { backgroundColor: CATEGORY_COLOR[category] } : {}}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Zona (solo MOBILITÀ e ATTIVAZIONE) */}
      {showSubSub && (
        <div>
          <label className="label">Zona</label>
          <div className="flex gap-2">
            {(["UPPER", "LOWER"] as const).map(z => (
              <button key={z} type="button"
                onClick={() => setSubSubcategory(z)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${subSubcategory === z ? "border-transparent text-black" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"}`}
                style={subSubcategory === z ? { backgroundColor: "#C0D738" } : {}}
              >{z}</button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Nome esercizio */}
      <div>
        <label className="label">Nome esercizio *</label>
        <input className="input" placeholder="es. Squat bulgaro" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Salvo..." : "Aggiungi"}</button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EserciziPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});
  const [openZones, setOpenZones] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("exercise_library").select("*").order("category").order("subcategory").order("sub_subcategory").order("name");
    setExercises(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const handleDelete = async (id: string) => {
    await supabase.from("exercise_library").delete().eq("id", id);
    setDeleteId(null);
    fetchExercises();
  };

  const handleUpdate = useCallback((updated: ExerciseLibrary) => {
    setExercises(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const toggleCategory = (cat: string) => setOpenCategories(p => ({ ...p, [cat]: !p[cat] }));
  const toggleSub = (cat: string, sub: string) => setOpenSubs(p => ({ ...p, [`${cat}__${sub}`]: !p[`${cat}__${sub}`] }));
  const toggleZone = (cat: string, sub: string, zone: string) => setOpenZones(p => ({ ...p, [`${cat}__${sub}__${zone}`]: !p[`${cat}__${sub}__${zone}`] }));

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.subcategory ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Apri automaticamente categorie/sottocategorie/zone con risultati quando si cerca
  useEffect(() => {
    if (search.trim()) {
      const cats: Record<string, boolean> = {};
      const subs: Record<string, boolean> = {};
      const zones: Record<string, boolean> = {};
      filtered.forEach(e => {
        cats[e.category] = true;
        if (e.subcategory) subs[`${e.category}__${e.subcategory}`] = true;
        if (e.sub_subcategory) zones[`${e.category}__${e.subcategory}__${e.sub_subcategory}`] = true;
      });
      setOpenCategories(cats);
      setOpenSubs(subs);
      setOpenZones(zones);
    } else {
      setOpenCategories({});
      setOpenSubs({});
      setOpenZones({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]); // solo search: exercises non deve collassare le sezioni aperte

  // Raggruppa: category → subcategory → sub_subcategory → esercizi
  const grouped = LIBRARY_CATEGORIES.reduce((acc, cat) => {
    const catExercises = filtered.filter(e => e.category === cat);
    if (catExercises.length === 0) return acc;

    if (cat === "WARMUP") {
      acc[cat] = WARMUP_SUBCATEGORIES.reduce((subAcc, sub) => {
        const subExercises = catExercises.filter(e => e.subcategory === sub);
        if (sub === "CARDIO") {
          if (subExercises.length > 0) subAcc[sub] = { "_": subExercises };
        } else {
          subAcc[sub] = (["UPPER", "LOWER"] as const).reduce((zoneAcc, zone) => {
            zoneAcc[zone] = subExercises.filter(e => e.sub_subcategory === zone);
            return zoneAcc;
          }, {} as Record<string, ExerciseLibrary[]>);
        }
        return subAcc;
      }, {} as Record<string, Record<string, ExerciseLibrary[]>>);
    } else if (cat === "FORZA") {
      acc[cat] = FORZA_SUBCATEGORIES.reduce((subAcc, sub) => {
        const subExercises = catExercises.filter(e => e.subcategory === sub);
        if (subExercises.length > 0) subAcc[sub] = subExercises;
        return subAcc;
      }, {} as Record<string, ExerciseLibrary[]>);
    } else if (cat === "ACCESSORI") {
      acc[cat] = ACCESSORI_SUBCATEGORIES.reduce((subAcc, sub) => {
        const subExercises = catExercises.filter(e => e.subcategory === sub);
        if (subExercises.length > 0) subAcc[sub] = subExercises;
        return subAcc;
      }, {} as Record<string, ExerciseLibrary[]>);
    } else if (cat === "CORE TRAINING") {
      acc[cat] = CORE_SUBCATEGORIES.reduce((subAcc, sub) => {
        const subExercises = catExercises.filter(e => e.subcategory === sub);
        if (subExercises.length > 0) subAcc[sub] = subExercises;
        return subAcc;
      }, {} as Record<string, ExerciseLibrary[]>);
    } else {
      acc[cat] = { "_": { "_": catExercises } };
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref="/"
        title="Libreria Esercizi"
        right={
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Aggiungi
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="input pl-10" placeholder="Cerca esercizio..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-14 animate-pulse bg-gray-100" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {LIBRARY_CATEGORIES.map(cat => {
              if (!grouped[cat]) return null;
              const color = CATEGORY_COLOR[cat];
              const isOpen = openCategories[cat] === true; // chiuso di default
              const count = filtered.filter(e => e.category === cat).length;

              return (
                <div key={cat} className="card overflow-hidden">
                  {/* Header categoria */}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-gray-900 dark:text-gray-100 tracking-wide">{cat}</span>
                      <span className="text-xs text-gray-400 font-normal">{count}</span>
                    </div>
                    <svg className={`text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {cat === "WARMUP" ? (
                        Object.entries(grouped[cat]).map(([sub, subData]: [string, any]) => {
                          const subKey = `${cat}__${sub}`;
                          const isSubOpen = openSubs[subKey] === true;
                          const subCount = sub === "CARDIO"
                            ? subData["_"].length
                            : Object.values(subData).reduce((a: number, v: any) => a + v.length, 0);
                          return (
                            <div key={sub} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                              <button onClick={() => toggleSub(cat, sub)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black" style={{ backgroundColor: "#C0D738" }}>{sub}</span>
                                  <span className="text-xs text-gray-400">{subCount}</span>
                                </div>
                                <svg className={`text-gray-400 transition-transform ${isSubOpen ? "rotate-90" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                              </button>
                              {isSubOpen && (
                                sub === "CARDIO" ? (
                                  <div className="mx-4 mb-3 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    {subData["_"].map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} onUpdate={handleUpdate} />)}
                                  </div>
                                ) : (
                                  <div className="mx-4 mb-3 space-y-2">
                                    {Object.entries(subData).map(([zone, zoneExs]: [string, any]) => {
                                      const zoneKey = `${cat}__${sub}__${zone}`;
                                      const isZoneOpen = openZones[zoneKey] === true;
                                      return (
                                        <div key={zone} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                          <button onClick={() => toggleZone(cat, sub, zone)}
                                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-300">{zone}</span>
                                              <span className="text-xs text-gray-400">{zoneExs.length}</span>
                                            </div>
                                            <svg className={`text-gray-400 transition-transform ${isZoneOpen ? "rotate-90" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                                          </button>
                                          {isZoneOpen && zoneExs.map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} onUpdate={handleUpdate} />)}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })
                      ) : cat === "FORZA" || cat === "ACCESSORI" || cat === "CORE TRAINING" ? (
                        Object.entries(grouped[cat]).map(([sub, subExs]: [string, any]) => {
                          const subKey = `${cat}__${sub}`;
                          const isSubOpen = openSubs[subKey] === true;
                          const subColor = CATEGORY_COLOR[cat];
                          return (
                            <div key={sub} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                              <button onClick={() => toggleSub(cat, sub)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: subColor }}>{sub}</span>
                                  <span className="text-xs text-gray-400">{subExs.length}</span>
                                </div>
                                <svg className={`text-gray-400 transition-transform ${isSubOpen ? "rotate-90" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                              </button>
                              {isSubOpen && (
                                <div className="mx-4 mb-3 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                  {subExs.map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} onUpdate={handleUpdate} />)}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="mx-4 my-3 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                          {grouped[cat]["_"]["_"].map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} onUpdate={handleUpdate} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal aggiungi */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuovo esercizio">
        <AddExerciseForm onSuccess={() => { setShowAdd(false); fetchExercises(); }} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Modal conferma elimina */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Elimina esercizio">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Sei sicura di voler eliminare questo esercizio dalla libreria?</p>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>Annulla</button>
            <button className="btn-danger flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Elimina</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Flag config ──────────────────────────────────────────────
const UNIT_FLAGS = [
  { key: "unit_min" as const, label: "MIN", defVal: "min" as const },
  { key: "unit_cal" as const, label: "CAL", defVal: "cal" as const },
  { key: "unit_rep" as const, label: "REP", defVal: "rep" as const },
];
const LOAD_FLAGS = [
  { key: "load_pct" as const, label: "%",   defVal: "pct" as const },
  { key: "load_rpe" as const, label: "RPE", defVal: "rpe" as const },
  { key: "load_kg"  as const, label: "KG",  defVal: "kg"  as const },
];
const EQUIP_FLAGS = [
  { key: "equip_barbell" as const, label: "Bilanciere", defVal: "barbell" as const },
  { key: "equip_db"      as const, label: "DB",         defVal: "db"      as const },
  { key: "equip_kb"      as const, label: "KB",         defVal: "kb"      as const },
  { key: "equip_mb"      as const, label: "MB",         defVal: "mb"      as const },
  { key: "equip_sb"      as const, label: "SB",         defVal: "sb"      as const },
];

// Mini-tag nella riga collassata: mostra i flag attivi con ★ sul default
function FlagSummary({ ex }: { ex: ExerciseLibrary }) {
  const unitActive  = UNIT_FLAGS.filter(f => ex[f.key]);
  const loadActive  = LOAD_FLAGS.filter(f => ex[f.key]);
  const equipActive = EQUIP_FLAGS.filter(f => ex[f.key]);
  if (!unitActive.length && !loadActive.length && !equipActive.length) return null;

  const Tag = ({ label, isDefault, color }: { label: string; isDefault: boolean; color: string }) => (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{ backgroundColor: isDefault ? "#F59E0B" : color + "22", color: isDefault ? "#fff" : color }}
    >
      {label}{isDefault && <span style={{ fontSize: "8px" }}>★</span>}
    </span>
  );

  return (
    <div className="flex items-center gap-1 flex-wrap ml-2">
      {unitActive.map(f => (
        <Tag key={f.key} label={f.label} isDefault={ex.default_unit === f.defVal} color="#3B82F6" />
      ))}
      {loadActive.map(f => (
        <Tag key={f.key} label={f.label} isDefault={ex.default_load === f.defVal} color="#10B981" />
      ))}
      {equipActive.map(f => (
        <Tag key={f.key} label={f.label} isDefault={ex.default_equip === f.defVal} color="#8B5CF6" />
      ))}
    </div>
  );
}

// Chip a 3 stati: "off" (grigio) → "on" (colore sezione) → "default" (ambra ★) → "off"
function FlagChip({
  label, state, onColor, onToggle,
}: {
  label: string;
  state: "off" | "on" | "default";
  onColor: string;
  onToggle: () => void;
}) {
  const bg =
    state === "default" ? "#F59E0B" :
    state === "on"      ? onColor   : undefined;

  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      title={state === "off" ? "Click per abilitare" : state === "on" ? "Click per impostare come default" : "Default (click per disabilitare)"}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all select-none ${
        state === "off"
          ? "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
          : "text-white border-transparent"
      }`}
      style={bg ? { backgroundColor: bg } : {}}
    >
      {label}
      {state === "default" && <span style={{ fontSize: "9px" }}>★</span>}
    </button>
  );
}

// ─── Riga esercizio ───────────────────────────────────────────
function ExerciseRow({ ex: initialEx, onDelete, onUpdate }: {
  ex: ExerciseLibrary;
  onDelete: () => void;
  onUpdate: (ex: ExerciseLibrary) => void;
}) {
  const [ex, setEx] = useState(initialEx);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setEx(initialEx); }, [initialEx]);

  const save = async (patch: Partial<ExerciseLibrary>) => {
    const optimistic = { ...ex, ...patch };
    setEx(optimistic);
    const { data } = await supabase
      .from("exercise_library")
      .update(patch)
      .eq("id", ex.id)
      .select()
      .single();
    if (data) { setEx(data); onUpdate(data); }
  };

  // Ciclo 3 stati: off → on → default → off
  const toggleUnit = (key: typeof UNIT_FLAGS[number]["key"], defVal: "min" | "cal" | "rep") => {
    if (!ex[key])                        save({ [key]: true });                              // off → on
    else if (ex.default_unit !== defVal) save({ default_unit: defVal });                    // on  → default
    else                                 save({ [key]: false, default_unit: null });         // default → off
  };
  const toggleLoad = (key: typeof LOAD_FLAGS[number]["key"], defVal: "pct" | "rpe" | "kg") => {
    if (!ex[key])                        save({ [key]: true });
    else if (ex.default_load !== defVal) save({ default_load: defVal });
    else                                 save({ [key]: false, default_load: null });
  };
  const toggleEquip = (key: typeof EQUIP_FLAGS[number]["key"], defVal: "barbell" | "db" | "kb" | "mb" | "sb") => {
    if (!ex[key])                          save({ [key]: true });                               // off → on
    else if (ex.default_equip !== defVal)  save({ default_equip: defVal });                    // on  → default
    else                                   save({ [key]: false, default_equip: null });         // default → off
  };

  return (
    <div className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      {/* Riga collassata */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <svg
          className={`text-gray-300 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{ex.name}</span>
        <FlagSummary ex={ex} />
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-gray-300 hover:text-red-400 transition-colors p-1 ml-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>

      {/* Pannello flag */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
          {/* Sezione VOLUME */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1.5">
              Volume <span className="font-normal text-gray-400 normal-case tracking-normal">· 1 click = abilita · 2 click = default ★</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {UNIT_FLAGS.map(f => (
                <FlagChip
                  key={f.key}
                  label={f.label}
                  state={!ex[f.key] ? "off" : ex.default_unit === f.defVal ? "default" : "on"}
                  onColor="#3B82F6"
                  onToggle={() => toggleUnit(f.key, f.defVal)}
                />
              ))}
            </div>
          </div>

          {/* Sezione CARICO */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1.5">
              Carico <span className="font-normal text-gray-400 normal-case tracking-normal">· 1 click = abilita · 2 click = default ★</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LOAD_FLAGS.map(f => (
                <FlagChip
                  key={f.key}
                  label={f.label}
                  state={!ex[f.key] ? "off" : ex.default_load === f.defVal ? "default" : "on"}
                  onColor="#10B981"
                  onToggle={() => toggleLoad(f.key, f.defVal)}
                />
              ))}
            </div>
          </div>

          {/* Sezione ATTREZZO */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1.5">Attrezzo</p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIP_FLAGS.map(f => (
                <FlagChip
                  key={f.key}
                  label={f.label}
                  state={!ex[f.key] ? "off" : ex.default_equip === f.defVal ? "default" : "on"}
                  onColor="#8B5CF6"
                  onToggle={() => toggleEquip(f.key, f.defVal)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
