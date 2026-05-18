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
  }, [search, exercises]);

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
                                    {subData["_"].map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} />)}
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
                                          {isZoneOpen && zoneExs.map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} />)}
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
                                  {subExs.map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} />)}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="mx-4 my-3 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                          {grouped[cat]["_"]["_"].map((ex: ExerciseLibrary) => <ExerciseRow key={ex.id} ex={ex} onDelete={() => setDeleteId(ex.id)} />)}
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

// ─── Riga esercizio ───────────────────────────────────────────
function ExerciseRow({ ex, onDelete, indent }: { ex: ExerciseLibrary; onDelete: () => void; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${indent ? "px-8" : "px-4"}`}>
      <span className="text-sm text-gray-800 dark:text-gray-200">{ex.name}</span>
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors p-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  );
}
