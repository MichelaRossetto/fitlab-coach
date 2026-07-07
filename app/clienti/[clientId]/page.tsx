"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Client, TrainingMonth, TrainingWeek, ClientMax, getInitials, MONTH_NAMES,
  DAY_NAMES_SHORT, TIME_SLOTS_MORNING, TIME_SLOTS_AFTERNOON,
  getDefaultDayLabel, PERFORMANCE_EXERCISES,
} from "@/lib/types";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";

// ─── Constants ────────────────────────────────────────────────
const MAX_PER_SLOT = 5;
const MORNING_SLOTS   = ["08:00","09:00","10:00","11:00","12:00","13:00"];
const AFTERNOON_SLOTS = ["16:00","17:00","18:00","19:00"];

// ─── Unified Profile Card ─────────────────────────────────────
function UnifiedProfileCard({ client, clientId, isClientView, returnTo, onClientUpdated }: {
  client: Client;
  clientId: string;
  isClientView: boolean;
  returnTo?: string;
  onClientUpdated: () => void;
}) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<"anagrafica" | "orari" | "massimali" | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  // ── Schedule state ──
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [editSchedule, setEditSchedule] = useState<Record<number, string>>({});
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Maxes state ──
  const [maxes, setMaxes] = useState<Record<string, string>>({});
  const [editMaxes, setEditMaxes] = useState<Record<string, string>>({});
  const [editingMaxes, setEditingMaxes] = useState(false);
  const [loadingMaxes, setLoadingMaxes] = useState(true);
  const [savingMaxes, setSavingMaxes] = useState(false);
  const [highlightExercise, setHighlightExercise] = useState<string | null>(null);
  const autoEditRef = useRef(false);

  // Load schedule
  useEffect(() => {
    window.fetch(`/api/client-schedule?client_id=${clientId}`)
      .then(r => r.json())
      .then((data: {day_of_week: number; time: string}[]) => {
        const map: Record<number, string> = {};
        (data ?? []).forEach(r => { map[r.day_of_week] = r.time; });
        setSchedule(map);
        setLoadingSchedule(false);
      });
  }, [clientId]);

  // Load maxes
  useEffect(() => {
    const load = async () => {
      const res = await window.fetch(`/api/client-maxes?client_id=${clientId}`);
      const data = await res.json();
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: ClientMax) => {
        if (r.weight_kg != null) map[r.exercise_name] = String(r.weight_kg);
      });
      setMaxes(map);
      setLoadingMaxes(false);
      if (autoEditRef.current) {
        setEditMaxes(map);
        setEditingMaxes(true);
        autoEditRef.current = false;
      }
    };
    load();
  }, [clientId]);

  // Auto-open massimali from hash
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.startsWith("#massimali")) {
      setOpenSection("massimali");
      autoEditRef.current = true;
      const parts = window.location.hash.split("-");
      if (parts.length > 1) {
        const exName = decodeURIComponent(parts.slice(1).join("-"));
        setHighlightExercise(exName);
        setTimeout(() => {
          const exId = `max-${exName.toLowerCase().replace(/\s+/g, "-")}`;
          const el = document.getElementById(exId) ?? document.getElementById("massimali");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 350);
      } else {
        setTimeout(() => document.getElementById("massimali")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    }
  }, []);

  // Schedule helpers
  const slotCount = (dow: number, time: string) => availability[`${dow}:${time}`] ?? 0;
  const slotFull  = (dow: number, time: string) => slotCount(dow, time) >= MAX_PER_SLOT;

  const startEditSchedule = async () => {
    setEditSchedule({ ...schedule });
    setSaveError("");
    setEditingSchedule(true);
    setLoadingAvail(true);
    const res = await window.fetch(`/api/slot-availability?exclude_client=${clientId}`);
    const data = await res.json();
    setAvailability(data ?? {});
    setLoadingAvail(false);
  };

  const cancelEditSchedule = () => { setEditingSchedule(false); setSaveError(""); };

  const toggleDay = (day: number) =>
    setEditSchedule(prev => {
      if (prev[day] !== undefined) { const n = { ...prev }; delete n[day]; return n; }
      return { ...prev, [day]: "10:00" };
    });

  const setTime = (day: number, time: string) =>
    setEditSchedule(prev => ({ ...prev, [day]: time }));

  const handleSaveSchedule = async () => {
    setSaveError("");
    setSavingSchedule(true);
    const rows = Object.entries(editSchedule).map(([day, time]) => ({
      client_id: clientId, day_of_week: Number(day), time,
    }));
    await window.fetch("/api/client-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, rows }),
    });
    const saved = { ...editSchedule };
    setSchedule(saved);

    const newScheduledDays = Object.keys(saved).map(Number).sort((a, b) => a - b);
    if (newScheduledDays.length > 0) {
      const now2 = new Date(); now2.setHours(0, 0, 0, 0);
      const todayStr2 = now2.toISOString().split("T")[0];
      const { data: upWeeks } = await supabase
        .from("training_weeks")
        .select("id, date_start, month_id, training_days(id, day_number, day_date), training_months!inner(client_id)")
        .eq("training_months.client_id", clientId)
        .gte("date_start", todayStr2)
        .not("date_start", "is", null);
      if (upWeeks) {
        for (const week of upWeeks as any[]) {
          const weekStart = new Date(week.date_start);
          weekStart.setHours(12, 0, 0, 0);
          for (const day of (week.training_days ?? []) as any[]) {
            if (day.day_number > newScheduledDays.length) continue;
            const offset = newScheduledDays[day.day_number - 1];
            const newDate = new Date(weekStart);
            newDate.setDate(newDate.getDate() + offset);
            const newDateStr = newDate.toISOString().split("T")[0];
            if (day.day_date !== newDateStr) {
              await supabase.from("training_days").update({ day_date: newDateStr }).eq("id", day.id);
            }
          }
        }
      }
    }

    setEditingSchedule(false);
    setSavingSchedule(false);
  };

  // Maxes helpers
  const handleSaveMaxes = async () => {
    setSavingMaxes(true);
    const rows = Object.entries(editMaxes)
      .filter(([, v]) => v !== "" && !isNaN(Number(v)))
      .map(([exercise_name, weight_kg]) => ({
        client_id: clientId,
        exercise_name,
        weight_kg: Number(weight_kg),
        recorded_at: new Date().toISOString().split("T")[0],
      }));
    const cleared = Object.entries(editMaxes).filter(([, v]) => v === "").map(([k]) => k);
    await window.fetch("/api/client-maxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, rows, cleared }),
    });
    const newMaxes = { ...editMaxes };
    cleared.forEach(k => delete newMaxes[k]);
    setMaxes(newMaxes);
    setEditingMaxes(false);
    setSavingMaxes(false);
    if (returnTo) router.push(returnTo);
  };

  const editDays = Object.keys(editSchedule).map(Number).sort((a, b) => a - b);
  const selectedDays = Object.keys(schedule).map(Number).sort((a, b) => a - b);
  const setCount = Object.keys(maxes).length;
  const allExercises = Object.values(PERFORMANCE_EXERCISES).flat();

  return (
    <div id="massimali" className="card overflow-hidden">
      {/* ── Header (always visible) ── */}
      <div className="px-4 py-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{ backgroundColor: "#D4E600", color: "#111" }}>
          {getInitials(client.name, client.surname)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {client.name} {client.surname}
            </h2>
            {!isClientView && (
              <button onClick={() => setShowEdit(true)} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </div>
          <StatusBadge subscriptionEnd={client.subscription_end} isPaused={client.is_paused} />
        </div>
      </div>

      {/* ── Sezione Anagrafica ── */}
      <button
        onClick={() => setOpenSection(s => s === "anagrafica" ? null : "anagrafica")}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Anagrafica</span>
        <svg className={`text-gray-400 transition-transform ${openSection === "anagrafica" ? "rotate-180" : ""}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {openSection === "anagrafica" && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-700">
          {client.email && (
            <div className="flex items-center gap-1.5 pt-2 text-sm text-gray-500 dark:text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {client.phone}
            </div>
          )}
          {client.notes && (
            <p className="text-sm text-gray-400 italic">{client.notes}</p>
          )}
          {!client.email && !client.phone && !client.notes && (
            <p className="pt-2 text-xs text-gray-400 italic">Nessun dato anagrafico</p>
          )}
        </div>
      )}

      {/* ── Sezione Orari ── */}
      <>
        <button
          onClick={() => {
            setOpenSection(s => s === "orari" ? null : "orari");
            if (editingSchedule) { setEditingSchedule(false); setSaveError(""); }
          }}
          className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Orari abituali</span>
            <div className="flex items-center gap-2">
              {selectedDays.length > 0 && openSection !== "orari" && (
                <span className="text-[11px] text-gray-400">
                  {selectedDays.map((d, i) => (
                    <span key={d}>
                      <span style={{ color: "#8a9a00" }}>{DAY_NAMES_SHORT[d]}</span>
                      {i < selectedDays.length - 1 && <span className="text-gray-300 mx-0.5">·</span>}
                    </span>
                  ))}
                </span>
              )}
              <svg className={`text-gray-400 transition-transform ${openSection === "orari" ? "rotate-180" : ""}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </button>

          {openSection === "orari" && !loadingSchedule && (
            <div className="border-t border-gray-100 dark:border-gray-700">
              {!editingSchedule ? (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedDays.length > 0
                        ? selectedDays.map((d, i, arr) => (
                            <span key={d}>
                              <span className="font-medium" style={{ color: "#8a9a00" }}>{DAY_NAMES_SHORT[d]}</span>
                              <span className="ml-1">{schedule[d]}</span>
                              {i < arr.length - 1 && <span className="text-gray-300 mx-1.5">·</span>}
                            </span>
                          ))
                        : <span className="italic text-gray-400">Nessun orario impostato</span>
                      }
                    </span>
                    {!isClientView && (
                      <button onClick={startEditSchedule} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 shrink-0 ml-2">
                        modifica
                      </button>
                    )}
                  </div>
                  {isClientView && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mt-1">
                      Per modificare gli orari contatta la tua coach.
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 space-y-4">
                  <div className="flex gap-1.5">
                    {DAY_NAMES_SHORT.map((name, i) => (
                      <button key={i} onClick={() => toggleDay(i)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={editSchedule[i] !== undefined
                          ? { backgroundColor: "#D4E600", color: "#111" }
                          : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                        }>
                        {name}
                      </button>
                    ))}
                  </div>

                  {editDays.length > 0 && (
                    loadingAvail ? (
                      <div className="text-xs text-gray-400 text-center py-2">Carico disponibilità...</div>
                    ) : (
                      <div className="space-y-4">
                        {editDays.map(day => (
                          <div key={day}>
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                              {DAY_NAMES_SHORT[day]}
                            </div>
                            {[
                              { label: "Mattina", slots: TIME_SLOTS_MORNING },
                              { label: "Pomeriggio", slots: TIME_SLOTS_AFTERNOON },
                            ].map(({ label, slots }) => (
                              <div key={label} className="mb-3">
                                <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-widest">{label}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {slots.map(time => {
                                    const count = slotCount(day, time);
                                    const full = slotFull(day, time);
                                    const selected = editSchedule[day] === time;
                                    const spotsLeft = MAX_PER_SLOT - count;
                                    return (
                                      <button
                                        key={time}
                                        onClick={() => setTime(day, time)}
                                        className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-all border ${
                                          selected
                                            ? "border-transparent font-bold shadow-sm"
                                            : full
                                            ? "border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            : spotsLeft === 1
                                            ? "border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                        style={selected ? { backgroundColor: "#D4E600", color: "#111", borderColor: "transparent" } : {}}
                                      >
                                        {time}
                                        {!selected && full && (
                                          <span className="ml-1 text-[9px] font-bold text-red-400">⚠ {count}/{MAX_PER_SLOT}</span>
                                        )}
                                        {!selected && !full && spotsLeft <= 2 && (
                                          <span className={`ml-1 text-[9px] font-bold ${spotsLeft === 1 ? "text-orange-500" : "text-gray-400"}`}>
                                            {spotsLeft === 1 ? "1 posto" : `${spotsLeft}`}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          Slot in <span className="text-red-400">rosso ⚠</span> = al completo (puoi comunque assegnarlo)
                        </p>
                      </div>
                    )
                  )}

                  {saveError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Errore</p>
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 whitespace-pre-line">{saveError}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1 pb-2">
                    <button onClick={cancelEditSchedule} className="btn-secondary flex-1 text-sm">Annulla</button>
                    <button onClick={handleSaveSchedule} className="btn-primary flex-1 text-sm" disabled={savingSchedule}>
                      {savingSchedule ? "Salvo..." : "Salva"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>

      {/* ── Sezione Massimali ── */}
      <button
        onClick={() => {
          setOpenSection(s => s === "massimali" ? null : "massimali");
          if (editingMaxes) setEditingMaxes(false);
        }}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Massimali</span>
        <div className="flex items-center gap-2">
          {setCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {setCount}/{allExercises.length}
            </span>
          )}
          <svg className={`text-gray-400 transition-transform ${openSection === "massimali" ? "rotate-180" : ""}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {openSection === "massimali" && !loadingMaxes && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 space-y-5">
          {!editingMaxes ? (
            <>
              {Object.entries(PERFORMANCE_EXERCISES).map(([group, exercises]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {exercises.map(ex => {
                      const isHighlighted = highlightExercise && ex.toLowerCase() === highlightExercise.toLowerCase();
                      return (
                        <div key={ex} id={`max-${ex.toLowerCase().replace(/\s+/g, "-")}`} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                          isHighlighted
                            ? "border-lime-400 dark:border-lime-500 bg-lime-50 dark:bg-lime-900/20 ring-1 ring-lime-400"
                            : maxes[ex]
                            ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                            : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                        }`}>
                          <span className={`text-xs font-medium truncate pr-2 ${isHighlighted ? "text-lime-700 dark:text-lime-300 font-bold" : maxes[ex] ? "text-gray-700 dark:text-gray-200" : "text-gray-400"}`}>{ex}</span>
                          {maxes[ex]
                            ? <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{maxes[ex]} kg</span>
                            : <span className="text-xs text-gray-300 flex-shrink-0">—</span>
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditMaxes({ ...maxes }); setEditingMaxes(true); }}
                className="btn-secondary w-full text-sm">
                Modifica massimali
              </button>
            </>
          ) : (
            <>
              {Object.entries(PERFORMANCE_EXERCISES).map(([group, exercises]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group}</p>
                  <div className="space-y-2">
                    {exercises.map(ex => {
                      const isHighlighted = highlightExercise && ex.toLowerCase() === highlightExercise.toLowerCase();
                      return (
                        <div key={ex} className={`flex items-center gap-3 px-2 py-1 rounded-xl transition-colors ${isHighlighted ? "bg-lime-50 dark:bg-lime-900/20 ring-1 ring-lime-400" : ""}`}>
                          <span className={`text-sm flex-1 min-w-0 truncate ${isHighlighted ? "text-lime-700 dark:text-lime-300 font-bold" : "text-gray-600 dark:text-gray-300"}`}>{ex}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="500"
                              placeholder="—"
                              value={editMaxes[ex] ?? ""}
                              onChange={e => setEditMaxes(p => ({ ...p, [ex]: e.target.value }))}
                              className={`input w-20 text-center py-1.5 text-sm ${isHighlighted ? "border-lime-400 ring-1 ring-lime-400 focus:ring-lime-500" : ""}`}
                              autoFocus={!!isHighlighted}
                            />
                            <span className="text-xs text-gray-400 w-5">kg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setEditingMaxes(false); setOpenSection(null); }} className="btn-secondary flex-1 text-sm">Annulla</button>
                <button onClick={handleSaveMaxes} className="btn-primary flex-1 text-sm" disabled={savingMaxes}>
                  {savingMaxes ? "Salvo..." : "Salva"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifica cliente">
        <EditClientForm client={client} onSuccess={() => { setShowEdit(false); onClientUpdated(); }} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}

// ─── Upcoming Sessions Card ───────────────────────────────────
function UpcomingSessionsCard({ clientId, isClientView, clientName }: {
  clientId: string;
  isClientView: boolean;
  clientName: string;
}) {
  const coachView = !isClientView;
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [loadingS, setLoadingS] = useState(true);
  const [sessionList, setSessionList] = useState<{ dayId: string; dayNumber: number; weekId: string; monthId: string; label: string; dateStr: string | null; dayTime: string | null; weekLabel: string; weekDateStart: string | null; status: string | null }[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [reschedulingDayId, setReschedulingDayId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [allSlotCounts, setAllSlotCounts] = useState<Record<string, number>>({});
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const localDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const todayStr = localDateStr(today);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/client-schedule?client_id=${clientId}`);
      const data = await res.json();
      const map: Record<number, string> = {};
      (data ?? []).forEach((r: any) => { map[r.day_of_week] = r.time; });
      setSchedule(map);
      setLoadingS(false);
    };
    load();
  }, [clientId]);

  const loadSessionList = useCallback(async () => {
    setLoadingSessions(true);
    const schedDays = Object.keys(schedule).map(Number).sort((a: number, b: number) => a - b);

    const { data: weeks, error: weeksErr } = await supabase
      .from("training_weeks")
      .select("id, date_start, week_number, month_id, training_months!inner(client_id, label, visible_from)")
      .eq("training_months.client_id", clientId);

    if (weeksErr || !weeks || weeks.length === 0) return;

    const weekIds = (weeks as any[]).map((w: any) => w.id);
    const { data: days, error: daysErr } = await supabase
      .from("training_days")
      .select("id, day_number, day_date, day_time, label, status, week_id")
      .in("week_id", weekIds)
      .order("day_number");

    if (daysErr || !days) return;

    const weekMap: Record<string, any> = {};
    for (const w of weeks as any[]) weekMap[w.id] = w;

    // Mesi bloccati (visible_from futuro o auto-calcolato da settimana1 - 3gg)
    const firstWkDs: Record<string, string> = {};
    for (const w of weeks as any[]) {
      if (!w.date_start) continue;
      if (!firstWkDs[w.month_id] || w.date_start < firstWkDs[w.month_id]) firstWkDs[w.month_id] = w.date_start;
    }
    const lockedMonthIds = new Set<string>();
    for (const w of weeks as any[]) {
      const mo = w["training_months"] as any;
      if (!mo) continue;
      let evf = mo.visible_from as string | null;
      if (!evf && firstWkDs[w.month_id]) {
        const dt = new Date(firstWkDs[w.month_id] + "T12:00:00"); dt.setDate(dt.getDate() - 3);
        evf = dt.toISOString().split("T")[0];
      }
      if (evf && evf > todayStr) lockedMonthIds.add(w.month_id);
    }

    const list: { dayId: string; dayNumber: number; weekId: string; monthId: string; label: string; dateStr: string | null; dayTime: string | null; weekLabel: string; weekDateStart: string | null; status: string | null }[] = [];
    for (const day of days as any[]) {
      const week = weekMap[day.week_id];
      if (!week) continue;
      if (lockedMonthIds.has(week.month_id)) continue;
      const monthLabel = (week["training_months"] as any)?.label ?? "";

      let dateStr: string | null = day.day_date ?? null;
      if (!dateStr && week.date_start && schedDays.length > 0 && day.day_number <= schedDays.length) {
        const ws = new Date(week.date_start); ws.setHours(12, 0, 0, 0);
        ws.setDate(ws.getDate() + schedDays[day.day_number - 1]);
        dateStr = ws.toISOString().split("T")[0];
      }
      // Orario: usa day_time esplicito; fallback all'orario abituale del giorno della settimana
      let dayTime: string | null = day.day_time ? day.day_time.slice(0, 5) : null;
      if (!dayTime && dateStr) {
        const jsDay = new Date(dateStr + "T12:00:00").getDay();
        const dow = jsDay === 0 ? 6 : jsDay - 1; // 0=lun … 4=ven
        dayTime = schedule[dow] ? schedule[dow].slice(0, 5) : null;
      }

      list.push({
        dayId: day.id,
        dayNumber: day.day_number,
        weekId: day.week_id,
        monthId: week.month_id,
        label: day.label,
        dateStr,
        dayTime,
        weekLabel: `${monthLabel} · Sett. ${week.week_number}`,
        weekDateStart: week.date_start ?? null,
        status: day.status ?? null,
      });
    }

    list.sort((a, b) => {
      if (!a.dateStr && !b.dateStr) return 0;
      if (!a.dateStr) return 1;
      if (!b.dateStr) return -1;
      return a.dateStr.localeCompare(b.dateStr);
    });
    setSessionList(list);
    setLoadingSessions(false);
  }, [clientId, schedule]);

  useEffect(() => {
    if (open && !loadingS) loadSessionList();
  }, [open, loadSessionList, loadingS]);

  const checkRescheduleSlot = async (newDate: string) => {
    setRescheduleDate(newDate);
    setRescheduleTime("");
    setAllSlotCounts({});
    if (!newDate) return;
    const res = await window.fetch(`/api/slot-availability?exclude_client=${clientId}&target_date=${newDate}`);
    const counts: Record<string, number> = await res.json();
    setAllSlotCounts(counts);
  };

  const resetReschedule = () => { setReschedulingDayId(null); setRescheduleDate(""); setRescheduleTime(""); setAllSlotCounts({}); setRescheduleError(null); };

  const markAsSaltato = async (dayId: string) => {
    const session = sessionList.find(s => s.dayId === dayId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { status: "skip" };
    if (session?.dateStr) update.day_date = session.dateStr;
    const { error } = await supabase.from("training_days").update(update).eq("id", dayId);
    if (!error) {
      setSessionList(prev => prev.map(s => s.dayId === dayId ? { ...s, status: "skip" } : s));
    }
  };

  const resetSaltato = async (dayId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("training_days").update({ status: null } as any).eq("id", dayId);
    if (!error) {
      setSessionList(prev => prev.map(s => s.dayId === dayId ? { ...s, status: null } : s));
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime || !reschedulingDayId) return;
    setRescheduleSaving(true);
    setRescheduleError(null);

    const targetDayId = reschedulingDayId;
    const session = sessionList.find(s => s.dayId === targetDayId);
    const originalDate = session?.dateStr ?? null;

    let { error: updateErr } = await supabase
      .from("training_days")
      .update({ day_date: rescheduleDate, day_time: rescheduleTime })
      .eq("id", targetDayId);

    if (updateErr) {
      console.warn("Update con day_time fallito, riprovo senza:", updateErr.message);
      const { error: updateErr2 } = await supabase
        .from("training_days")
        .update({ day_date: rescheduleDate })
        .eq("id", targetDayId);
      if (updateErr2) {
        setRescheduleError("Errore salvataggio: " + updateErr2.message);
        setRescheduleSaving(false);
        return;
      }
    }

    // Notifica alla coach solo se è il cliente a spostare
    if (!coachView) {
      const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
      const sessionLabel = session?.label ?? "allenamento";
      const originalTime = session?.dayTime ?? null;
      const toLabel = fmt(rescheduleDate);

      let message: string;
      if (!originalDate) {
        message = `${clientName} ha spostato "${sessionLabel}" a ${toLabel} ore ${rescheduleTime}.`;
      } else if (originalDate === rescheduleDate) {
        // Stesso giorno — solo l'orario è cambiato
        const fromTimePart = originalTime ? ` (prima: ore ${originalTime})` : "";
        message = `${clientName} ha cambiato l'orario di "${sessionLabel}" del ${toLabel}: ora alle ${rescheduleTime}${fromTimePart}.`;
      } else {
        // Giorno diverso
        const fromLabel = fmt(originalDate);
        const fromTime = originalTime ? ` ore ${originalTime}` : "";
        message = `${clientName} ha spostato "${sessionLabel}" da ${fromLabel}${fromTime} a ${toLabel} ore ${rescheduleTime}.`;
      }

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, type: "reschedule", message }),
      });
    }

    resetReschedule();
    await loadSessionList();
    setRescheduleSaving(false);
  };

  const selectedDays = Object.keys(schedule).map(Number).sort((a, b) => a - b);

  const upcomingSessions = sessionList
    .filter(s => s.dateStr && s.dateStr >= todayStr)
    .slice(0, 6);

  const getSessionTime = (s: typeof sessionList[0]) => {
    if (s.dayTime) return s.dayTime;
    if (!s.dateStr) return null;
    const d = new Date(s.dateStr + "T12:00:00");
    const jsDay = d.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    return schedule[dow] ?? null;
  };

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const ABBR = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
    const MON = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    return `${ABBR[dow]} ${d.getDate()} ${MON[d.getMonth()]}`;
  };

  if (loadingS) return null;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Prossimi allenamenti</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {(
            loadingSessions
              ? <div className="px-4 py-4 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="h-3 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
                      <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                  ))}
                </div>
              : upcomingSessions.length === 0
              ? <div className="px-4 py-5 text-sm text-gray-400 text-center italic">Nessun allenamento in programma</div>
              : upcomingSessions.map(session => {
                  const isRescheduling = reschedulingDayId === session.dayId;
                  // Blocca spostamento dopo mezzogiorno del giorno precedente
                  const clientBlocked = !coachView && (() => {
                    if (!session.dateStr) return true;
                    const deadline = new Date(session.dateStr + "T12:00:00");
                    deadline.setDate(deadline.getDate() - 1); // giorno prima a mezzogiorno
                    return new Date() >= deadline;
                  })();
                  const time = getSessionTime(session);
                  const isSessionToday = session.dateStr === todayStr;

                  const dayUrl = `/clienti/${clientId}/${session.monthId}/${session.weekId}/${session.dayId}`;
                  return (
                    <div key={session.dayId} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Link href={dayUrl} className={`text-xs font-semibold w-[90px] shrink-0 hover:underline ${isSessionToday ? "text-lime-500 dark:text-lime-400" : "text-gray-700 dark:text-gray-200"}`}>
                          {session.dateStr ? formatSessionDate(session.dateStr) : "—"}
                        </Link>
                        <Link href={dayUrl} className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                          {session.label}
                        </Link>
                        {time && (
                          <span className="text-[11px] font-bold tabular-nums text-gray-600 dark:text-gray-300 shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                            {time}
                          </span>
                        )}
                        {session.status === "skip" && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">Non presente</span>
                            {!clientBlocked && (
                              <button
                                onClick={() => resetSaltato(session.dayId)}
                                className="text-[11px] font-medium text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 px-2 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Ripristina
                              </button>
                            )}
                          </div>
                        )}
                        {!clientBlocked && session.status !== "skip" && (
                          isRescheduling
                            ? <button onClick={resetReschedule} className="text-gray-400 hover:text-gray-600 shrink-0 text-xs">✕</button>
                            : <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => { setReschedulingDayId(session.dayId); checkRescheduleSlot(session.dateStr ?? ""); }}
                                  className="text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  Sposta
                                </button>
                                <button
                                  onClick={() => markAsSaltato(session.dayId)}
                                  className="text-[11px] font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 px-2 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  Non presente
                                </button>
                              </div>
                        )}
                        {clientBlocked && (
                          <span className="text-[10px] text-gray-400 italic shrink-0">scrivi alla coach</span>
                        )}
                      </div>
                      {isRescheduling && (() => {
                        const newJsDay = rescheduleDate ? new Date(rescheduleDate + "T12:00:00").getDay() : null;
                        const newOurDow = newJsDay !== null ? (newJsDay === 0 ? 6 : newJsDay - 1) : null;
                        const MAX_SLOTS = 5;
                        const allSlots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
                        const slotsFull = rescheduleTime
                          ? (allSlotCounts[`${newOurDow}:${rescheduleTime}`] ?? 0) >= MAX_SLOTS && !coachView
                          : false;
                        return (
                          <div className="px-4 pb-3 space-y-3">
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Nuova data</label>
                              <input
                                type="date"
                                autoFocus
                                value={rescheduleDate}
                                min={coachView ? undefined : localDateStr((() => { const d = new Date(); d.setDate(d.getDate() + (d.getHours() < 12 ? 1 : 2)); return d; })())}
                                className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
                                onChange={e => checkRescheduleSlot(e.target.value)}
                              />
                            </div>
                            {rescheduleDate && newOurDow !== null && (
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1.5">Scegli orario</label>
                                <div className="grid grid-cols-4 gap-1">
                                  {allSlots.map(slot => {
                                    const count = allSlotCounts[`${newOurDow}:${slot}`] ?? 0;
                                    const full = count >= MAX_SLOTS;
                                    const selected = rescheduleTime === slot;
                                    const blocked = full && !coachView;
                                    return (
                                      <button
                                        key={slot}
                                        disabled={blocked}
                                        onClick={() => setRescheduleTime(selected ? "" : slot)}
                                        className="relative py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                        style={selected
                                          ? { backgroundColor: "#D4E600", color: "#111" }
                                          : blocked
                                            ? { backgroundColor: "#1f2937", color: "#4b5563" }
                                            : { backgroundColor: "#374151", color: full ? "#f87171" : count >= MAX_SLOTS - 1 ? "#fb923c" : "#d1d5db" }
                                        }
                                      >
                                        {slot}
                                        <span className="block text-[8px] opacity-70">{count}/{MAX_SLOTS}</span>
                                        {full && coachView && (
                                          <span className="absolute -top-1 -right-1 text-[7px] bg-red-500 text-white rounded-full px-0.5">!</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {rescheduleError && (
                              <div className="text-[10px] text-red-400 text-center">{rescheduleError}</div>
                            )}
                            <button
                              onClick={handleConfirmReschedule}
                              disabled={!rescheduleDate || !rescheduleTime || rescheduleSaving || slotsFull}
                              className="w-full py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                              style={{ backgroundColor: "#D4E600", color: "#111" }}
                            >
                              {rescheduleSaving ? "Salvo..." : "Conferma spostamento"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Client Form ────────────────────────────────────────
function EditClientForm({ client, onSuccess, onCancel }: {
  client: Client; onSuccess: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: client.name, surname: client.surname,
    email: client.email ?? "", phone: client.phone ?? "",
    subscription_end: client.subscription_end ?? "",
    notes: client.notes ?? "",
  });
  const [isPaused, setIsPaused] = useState(!!client.is_paused);
  const [clientType, setClientType] = useState<"PR" | "PT">(client.client_type === "PT" ? "PT" : "PR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.surname.trim()) { setError("Nome e cognome obbligatori"); return; }
    setSaving(true);

    const newEmail = form.email.trim() || null;
    const oldEmail = client.email;

    // Aggiorna tabella clients
    const { error: err } = await supabase.from("clients").update({
      name: form.name.trim(), surname: form.surname.trim(),
      email: newEmail, phone: form.phone.trim() || null,
      subscription_end: form.subscription_end || null,
      notes: form.notes.trim() || null,
      is_paused: isPaused,
      client_type: clientType,
    }).eq("id", client.id);
    if (err) { setSaving(false); setError(err.message); return; }

    // Se l'email è cambiata, aggiorna anche auth.users
    if (oldEmail && newEmail && oldEmail !== newEmail) {
      const res = await window.fetch("/api/update-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldEmail, newEmail }),
      });
      const result = await res.json();
      if (!res.ok) {
        setSaving(false);
        setError("Dati salvati, ma aggiornamento email accesso fallito: " + result.error);
        return;
      }
    }

    setSaving(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Cognome *</label><input className="input" value={form.surname} onChange={set("surname")} /></div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set("email")} /></div>
      <div><label className="label">Telefono</label><input className="input" type="tel" value={form.phone} onChange={set("phone")} /></div>
      <div><label className="label">Scadenza abbonamento</label><input className="input" type="date" value={form.subscription_end} onChange={set("subscription_end")} /></div>
      <div><label className="label">Note</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={set("notes")} /></div>

      {/* Toggle PR/PT */}
      <div>
        <label className="label">Tipo cliente</label>
        <div className="flex gap-2">
          {(["PR", "PT"] as const).map(t => (
            <button key={t} type="button" onClick={() => setClientType(t)}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                clientType === t
                  ? t === "PT"
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                    : "border-[#C0D738] bg-[#f9fce0] text-[#6b7a00]"
                  : "border-gray-200 dark:border-gray-600 text-gray-400"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle pausa */}
      <div>
        <label className="label">Stato allenamento</label>
        <button type="button" onClick={() => setIsPaused(p => !p)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
            isPaused
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-200 dark:border-gray-600 bg-transparent"
          }`}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isPaused ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
          }`}>
            {isPaused && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${isPaused ? "text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300"}`}>
              {isPaused ? "In pausa" : "Attivo"}
            </p>
            <p className="text-xs text-gray-400">{isPaused ? "Non compare nel calendario" : "Regolare, compare nel calendario"}</p>
          </div>
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Salvo..." : "Salva modifiche"}</button>
      </div>
    </form>
  );
}

// ─── New Month Form ───────────────────────────────────────────
function NewMonthForm({ clientId, existingMonths, lastWeekAny, subscriptionEnd, onSuccess, onCancel }: {
  clientId: string; existingMonths: TrainingMonth[]; lastWeekAny: TrainingWeek | null; subscriptionEnd: string | null; onSuccess: () => void; onCancel: () => void;
}) {
  const now = new Date();
  const nextMonth = (() => {
    if (existingMonths.length === 0) return { year: now.getFullYear(), month: now.getMonth() + 1 };
    const latest = existingMonths.reduce((a, b) =>
      a.year !== b.year ? (a.year > b.year ? a : b) : (a.month_num > b.month_num ? a : b)
    );
    return latest.month_num === 12
      ? { year: latest.year + 1, month: 1 }
      : { year: latest.year, month: latest.month_num + 1 };
  })();

  const calcStartDate = () => {
    const nextMonday = (from: Date) => {
      const d = new Date(from);
      const day = d.getDay();
      const daysToMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysToMonday);
      return d;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const c1 = lastWeekAny?.date_end
      ? nextMonday(new Date(new Date(lastWeekAny.date_end).setDate(new Date(lastWeekAny.date_end).getDate() + 1)))
      : null;
    const c2 = subscriptionEnd
      ? nextMonday(new Date(new Date(subscriptionEnd).setDate(new Date(subscriptionEnd).getDate() + 1)))
      : null;
    let start = nextMonday(today);
    if (c1 && c1 >= today && c1 > start) start = c1;
    if (c2 && c2 >= today && c2 > start) start = c2;
    return start.toISOString().split("T")[0];
  };

  const [year, setYear] = useState(nextMonth.year);
  const [month, setMonth] = useState(nextMonth.month);
  const [notes, setNotes] = useState("");
  const [weekCount, setWeekCount] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [startDate, setStartDate] = useState(calcStartDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStartDate(calcStartDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWeekAny, subscriptionEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const { data: newMonth, error: err } = await supabase.from("training_months").insert({
      client_id: clientId, label, year, month_num: month,
      notes: notes.trim() || null,
    }).select().single();
    if (err) { setSaving(false); setError(err.message); return; }

    if (weekCount > 0 && newMonth) {
      const weeksToInsert = [];
      let cur = new Date(startDate);
      for (let i = 0; i < weekCount; i++) {
        const end = new Date(cur);
        end.setDate(end.getDate() + 4);
        weeksToInsert.push({
          month_id: newMonth.id,
          week_number: i + 1,
          date_start: cur.toISOString().split("T")[0],
          date_end: end.toISOString().split("T")[0],
          notes: null,
        });
        cur = new Date(cur);
        cur.setDate(cur.getDate() + 7);
      }
      const { data: createdWeeks } = await supabase.from("training_weeks").insert(weeksToInsert).select();

      if (daysPerWeek > 0 && createdWeeks) {
        const daysToInsert = createdWeeks.flatMap(w =>
          Array.from({ length: daysPerWeek }, (_, j) => ({
            week_id: w.id,
            day_number: j + 1,
            label: getDefaultDayLabel(j + 1, daysPerWeek),
            day_date: null,
            notes: null,
          }))
        );
        await supabase.from("training_days").insert(daysToInsert);
      }
    }

    setSaving(false);
    onSuccess();
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Mese</label>
          <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Anno</label>
          <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div><label className="label">Note (opzionale)</label>
        <textarea className="input resize-none" rows={2} placeholder="Obiettivi del mese..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Auto-generate weeks */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="label mb-0 text-gray-700 dark:text-gray-300">Settimane da creare</label>
          <select className="input w-20 text-center" value={weekCount} onChange={e => setWeekCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {weekCount > 0 && (
          <>
            <div className="flex items-center justify-between">
              <label className="label mb-0 text-gray-700 dark:text-gray-300">Giorni per settimana</label>
              <select className="input w-20 text-center" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">A partire dal (lunedì)</label>
              <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1.5">
                {weekCount} settiman{weekCount === 1 ? "a" : "e"} lun–ven
                {daysPerWeek > 0 ? ` · ${daysPerWeek} giorn${daysPerWeek === 1 ? "o" : "i"}/sett. · ${weekCount * daysPerWeek} giorni totali` : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? "Creo..." : weekCount > 0
            ? `Crea mese + ${weekCount}sett${daysPerWeek > 0 ? ` + ${daysPerWeek}gg/sett` : ""}`
            : "Crea mese"}
        </button>
      </div>
    </form>
  );
}

// ─── Subscription Banner ──────────────────────────────────────
function SubscriptionBanner({ clientId, subscriptionEnd, clientName }: {
  clientId: string;
  subscriptionEnd: string | null;
  clientName: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!subscriptionEnd) return;
    const key = `paid_ack_${clientId}_${subscriptionEnd}`;
    if (localStorage.getItem(key) === "1") setDismissed(true);
  }, [clientId, subscriptionEnd]);

  if (!subscriptionEnd || dismissed) return null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(subscriptionEnd + "T00:00:00");
  const daysLeft = Math.round((expiry.getTime() - today.getTime()) / 86400000);

  if (daysLeft > 5) return null;

  const expired = daysLeft < 0;
  const bannerLabel = expired
    ? `Abbonamento scaduto il ${expiry.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}`
    : daysLeft === 0
    ? "Abbonamento in scadenza oggi"
    : `Abbonamento in scadenza tra ${daysLeft} giorn${daysLeft === 1 ? "o" : "i"} · ${expiry.toLocaleDateString("it-IT", { day: "numeric", month: "long" })}`;

  const handleConfirmPayment = async () => {
    setSending(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        type: "payment",
        message: `${clientName} ha effettuato il pagamento dell'abbonamento (scadenza ${expiry.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}).`,
      }),
    });
    localStorage.setItem(`paid_ack_${clientId}_${subscriptionEnd}`, "1");
    setSending(false);
    setShowConfirm(false);
    setDismissed(true);
  };

  return (
    <>
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-red-500/10 border border-red-400/40 dark:bg-red-500/15">
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/15">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">{bannerLabel}</p>
        <button
          onClick={() => setShowConfirm(true)}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all"
        >
          Pagato
        </button>
      </div>

      {/* Modale conferma */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Conferma pagamento</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Confermi di aver effettuato il bonifico o di aver saldato direttamente in sede con la coach?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1 text-sm"
                disabled={sending}
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={sending}
                className="flex-1 text-sm font-bold py-2.5 rounded-xl text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: "#22c55e" }}
              >
                {sending ? "Invio..." : "Sì, confermo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const returnTo = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("returnTo") ?? undefined : undefined;

  const [client, setClient] = useState<Client | null>(null);
  const [months, setMonths] = useState<TrainingMonth[]>([]);
  const [lastWeekAny, setLastWeekAny] = useState<TrainingWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClientView, setIsClientView] = useState(false);
  const [nextWorkout, setNextWorkout] = useState<{ url: string; date: Date; label: string; isToday: boolean } | null>(null);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
    const [{ data: c }, { data: m }, { data: userData }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("training_months").select("*").eq("client_id", clientId)
        .order("year", { ascending: false }).order("month_num", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setClient(c);
    setMonths(m ?? []);

    // Se l'utente loggato è il cliente stesso → vista sola lettura + dark mode forzata
    if (c && userData.user?.email === c.email) {
      setIsClientView(true);
      document.documentElement.classList.add("dark");
    }

    const { data: allWeeks } = await supabase
      .from("training_weeks")
      .select("*, training_months!inner(client_id)")
      .eq("training_months.client_id", clientId)
      .not("date_end", "is", null)
      .order("date_end", { ascending: false })
      .limit(1);
    setLastWeekAny(allWeeks?.[0] ?? null);

    // ─── Trova il prossimo allenamento (oggi o il primo futuro non saltato) ───
    const monthIds = (m ?? []).map(mo => mo.id);
    if (monthIds.length > 0) {
      // Fetch schedule
      const schedRes = await window.fetch(`/api/client-schedule?client_id=${clientId}`);
      const schedData = await schedRes.json();
      const scheduledDays: number[] = (schedData ?? []).map((r: any) => r.day_of_week);

      // Fetch tutte le settimane con i loro giorni
      const { data: weeksData } = await supabase
        .from("training_weeks")
        .select("id, date_start, month_id, training_days(id, day_number, day_date, status, label)")
        .in("month_id", monthIds)
        .not("date_start", "is", null)
        .order("date_start");

      if (weeksData) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayDs = today.toISOString().split("T")[0];
        let best: { date: Date; url: string; label: string; isToday: boolean } | null = null;

        // Calcola mesi ancora bloccati (visible_from futuro o auto-calcolato da settimana1 - 3gg)
        const monthsMap = new Map((m ?? []).map(mo => [mo.id, mo]));
        const firstWkDs: Record<string, string> = {};
        for (const w of weeksData as any[]) {
          if (!w.date_start) continue;
          if (!firstWkDs[w.month_id] || w.date_start < firstWkDs[w.month_id]) firstWkDs[w.month_id] = w.date_start;
        }
        const lockedMonthIds = new Set<string>();
        for (const [mid, mo] of Array.from(monthsMap)) {
          let evf = mo.visible_from as string | null;
          if (!evf && firstWkDs[mid]) {
            const dt = new Date(firstWkDs[mid] + "T12:00:00"); dt.setDate(dt.getDate() - 3);
            evf = dt.toISOString().split("T")[0];
          }
          if (evf && evf > todayDs) lockedMonthIds.add(mid);
        }

        for (const week of weeksData as any[]) {
          if (lockedMonthIds.has(week.month_id)) continue;
          const weekStart = new Date(week.date_start);
          weekStart.setHours(12, 0, 0, 0);
          const days = [...(week.training_days ?? [])].sort((a: any, b: any) => a.day_number - b.day_number);

          for (const day of days as any[]) {
            if (day.status === "skip" || day.status === "saltato") continue;

            let dayDate: Date | null = null;
            if (day.day_date) {
              dayDate = new Date(day.day_date);
              dayDate.setHours(0, 0, 0, 0);
            } else if (scheduledDays.length > 0 && day.day_number <= scheduledDays.length) {
              dayDate = new Date(weekStart);
              dayDate.setDate(dayDate.getDate() + scheduledDays[day.day_number - 1]);
              dayDate.setHours(0, 0, 0, 0);
            }

            if (!dayDate || dayDate < today) continue;

            if (!best || dayDate < best.date) {
              best = {
                date: dayDate,
                url: `/clienti/${clientId}/${week.month_id}/${week.id}/${day.id}`,
                label: day.label,
                isToday: dayDate.getTime() === today.getTime(),
              };
            }
          }
        }
        setNextWorkout(best);
      }
    }

    } catch (e) {
      console.error("Errore caricamento cliente:", e);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from("clients").delete().eq("id", clientId);
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header backHref="/" title="Caricamento..." />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="card p-5 h-28 bg-gray-100" />
          <div className="card p-5 h-20 bg-gray-100" />
        </div>
      </div>
    </div>
  );

  if (!client) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Cliente non trovato</p>
        <Link href="/" className="btn-primary">Torna alla dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref={isClientView ? undefined : "/"}
        title={`${client.name} ${client.surname}`}
        subtitle={isClientView ? "Il tuo piano" : "Profilo cliente"}
        clientView={isClientView}
        clientId={isClientView ? clientId : undefined}
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Banner scadenza abbonamento */}
        <SubscriptionBanner clientId={clientId} subscriptionEnd={client.subscription_end ?? null} clientName={`${client.name} ${client.surname}`} />

        {/* Unified Profile Card */}
        <UnifiedProfileCard
          client={client}
          clientId={clientId}
          isClientView={isClientView}
          returnTo={returnTo}
          onClientUpdated={fetch}
        />

        {/* ─── Bottone allenamento del giorno ─── */}
        {nextWorkout && (() => {
          const dateLabel = nextWorkout.date.toLocaleDateString("it-IT", {
            weekday: "long", day: "numeric", month: "long",
          });
          return (
            <button
              onClick={() => router.push(nextWorkout.url)}
              className="w-full rounded-2xl overflow-hidden transition-all active:scale-[0.98] shadow-sm hover:shadow-md group"
              style={{ backgroundColor: "#D4E600" }}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icona */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                {/* Testi */}
                <div className="flex-1 text-left min-w-0">
                  <div className="font-bold text-base text-gray-900 leading-tight">
                    {nextWorkout.isToday ? "Allenamento di oggi" : "Prossimo allenamento"}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-0.5 capitalize truncate">
                    {nextWorkout.label} · {dateLabel}
                  </div>
                </div>
                {/* Freccia */}
                <svg className="flex-shrink-0 text-gray-700 group-hover:translate-x-0.5 transition-transform"
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
          );
        })()}

        {/* Prossimi allenamenti */}
        <UpcomingSessionsCard clientId={clientId} isClientView={isClientView} clientName={`${client.name} ${client.surname}`} />

        {/* Months */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Programmi di allenamento</p>
            {!isClientView && (
              <button onClick={() => setShowNewMonth(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Aggiungi mese
              </button>
            )}
          </div>

          {months.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm text-gray-500">Nessun programma ancora.</p>
              <p className="text-sm text-gray-400 mt-1">Crea il primo mese di allenamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {months.map(m => {
                const todayStr = new Date().toISOString().split("T")[0];
                const locked = !!m.visible_from && m.visible_from > todayStr;
                const visibleDateLabel = locked
                  ? new Date(m.visible_from! + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long" })
                  : null;
                return (
                <Link
                  key={m.id}
                  href={`/clienti/${clientId}/${m.id}`}
                  className="card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{m.label}</div>
                    {m.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</div>}
                    {!isClientView && locked && (
                      <div className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Visibile dal {visibleDateLabel}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isClientView && locked && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                    <svg className="text-gray-300 group-hover:text-gray-500 transition-colors"
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottone PayPal — solo vista cliente */}
        {isClientView && client.paypal_link && (
          <div className="pb-2">
            <a
              href={client.paypal_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#003087" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.79 2.1h7.373c2.573 0 4.35.565 5.278 1.68.894 1.073.894 2.48.457 4.128-.018.065-.035.13-.054.196C17.976 11.174 16.02 13 12.26 13H9.833a.859.859 0 0 0-.848.722l-.97 6.115a.641.641 0 0 1-.633.54h-.306z"/>
                <path d="M20.995 7.503c-.018.113-.038.228-.06.345-.994 5.105-4.395 6.872-8.737 6.872H9.833a.859.859 0 0 0-.848.722l-1.272 8.057a.641.641 0 0 0 .633.74h4.44a.752.752 0 0 0 .743-.634l.03-.163.588-3.727.038-.205a.752.752 0 0 1 .743-.634h.468c3.03 0 5.403-1.23 6.097-4.79.29-1.487.14-2.728-.626-3.6a2.99 2.99 0 0 0-.855-.983z"/>
              </svg>
              Paga abbonamento con PayPal
            </a>
          </div>
        )}

        {/* Delete — solo per coach */}
        {!isClientView && (
          <div className="pb-4 text-center">
            {!deleteConfirm ? (
              <button
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                onClick={() => setDeleteConfirm(true)}
              >
                Elimina cliente
              </button>
            ) : (
              <div className="card p-4 border-red-100 text-center space-y-3">
                <p className="text-sm text-red-500 font-medium">Eliminare {client.name} {client.surname}?</p>
                <p className="text-xs text-gray-400">Questa azione è irreversibile e cancella tutti gli allenamenti.</p>
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 text-sm" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                  <button className="btn-danger flex-1 text-sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Eliminando..." : "Sì, elimina"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Modal open={showNewMonth} onClose={() => setShowNewMonth(false)} title="Nuovo mese di allenamento">
        <NewMonthForm clientId={clientId} existingMonths={months}
          lastWeekAny={lastWeekAny} subscriptionEnd={client?.subscription_end ?? null}
          onSuccess={() => { setShowNewMonth(false); fetch(); }} onCancel={() => setShowNewMonth(false)} />
      </Modal>

    </div>
  );
}
