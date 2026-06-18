"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TrainingMonth, TrainingWeek } from "@/lib/types";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

// ─── New Week Form ────────────────────────────────────────────
function NewWeekForm({ monthId, existingCount, lastWeek, subscriptionEnd, onSuccess, onCancel }: {
  monthId: string; existingCount: number; lastWeek: TrainingWeek | null; subscriptionEnd: string | null; onSuccess: () => void; onCancel: () => void;
}) {
  const [weekNum, setWeekNum] = useState(existingCount + 1);
  const calcNextDates = () => {
    const nextMonday = (from: Date) => {
      const d = new Date(from);
      const day = d.getDay();
      const daysToMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysToMonday);
      return d;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Candidate 1: giorno dopo l'ultima settimana
    const c1 = lastWeek?.date_end
      ? nextMonday(new Date(new Date(lastWeek.date_end).setDate(new Date(lastWeek.date_end).getDate() + 1)))
      : null;

    // Candidate 2: giorno dopo la scadenza abbonamento
    const c2 = subscriptionEnd
      ? nextMonday(new Date(new Date(subscriptionEnd).setDate(new Date(subscriptionEnd).getDate() + 1)))
      : null;

    // Prendi la data più recente tra i candidati, mai nel passato
    let start = nextMonday(today);
    if (c1 && c1 >= today && c1 > start) start = c1;
    if (c2 && c2 >= today && c2 > start) start = c2;

    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };
  const next = calcNextDates();
  const [dateStart, setDateStart] = useState(next.start);
  const [dateEnd, setDateEnd] = useState(next.end);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from("training_weeks").insert({
      month_id: monthId, week_number: weekNum,
      date_start: dateStart || null, date_end: dateEnd || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Numero settimana</label>
        <select className="input" value={weekNum} onChange={e => setWeekNum(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Settimana {n}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Dal</label><input className="input" type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div>
        <div><label className="label">Al</label><input className="input" type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div>
      </div>
      <div>
        <label className="label">Note</label>
        <textarea className="input resize-none" rows={2} placeholder="Focus della settimana..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Creo..." : "Crea settimana"}</button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MonthPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const monthId = params.monthId as string;

  const [month, setMonth] = useState<TrainingMonth | null>(null);
  const [weeks, setWeeks] = useState<TrainingWeek[]>([]);
  const [lastWeekAny, setLastWeekAny] = useState<TrainingWeek | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [isClientView, setIsClientView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewWeek, setShowNewWeek] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [editDateStart, setEditDateStart] = useState("");
  const [editDateEnd, setEditDateEnd] = useState("");
  const [savingWeek, setSavingWeek] = useState(false);
  // ── Descrizione mese (visibile sotto il nome) ─────────────────
  const [editingDesc, setEditingDesc] = useState(false);
  const [descText, setDescText] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  // ── Note coach ────────────────────────────────────────────────
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  // ── Visibilità mese ───────────────────────────────────────────
  const [editingVf, setEditingVf] = useState(false);
  const [vfDraft, setVfDraft] = useState("");
  const [savingVf, setSavingVf] = useState(false);
  const [weekDays, setWeekDays] = useState<Record<string, { id: string; day_number: number; label: string | null }[]>>({});
  const [savingNotes, setSavingNotes] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [{ data: m }, { data: w }, { data: c }, { data: userData }] = await Promise.all([
      supabase.from("training_months").select("*").eq("id", monthId).single(),
      supabase.from("training_weeks").select("*").eq("month_id", monthId).order("week_number"),
      supabase.from("clients").select("name, surname, subscription_end, email").eq("id", clientId).single(),
      supabase.auth.getUser(),
    ]);
    setMonth(m);
    setWeeks(w ?? []);
    if (c) {
      setClientName(`${c.name} ${c.surname}`);
      setSubscriptionEnd(c.subscription_end ?? null);
      if (c.email === userData.user?.email) {
        setIsClientView(true);
        document.documentElement.classList.add("dark");
      }
    }

    // Ultima settimana con data_end tra tutti i mesi del cliente
    const { data: allWeeks } = await supabase
      .from("training_weeks")
      .select("*, training_months!inner(client_id)")
      .eq("training_months.client_id", clientId)
      .not("date_end", "is", null)
      .order("date_end", { ascending: false })
      .limit(1);
    setLastWeekAny(allWeeks?.[0] ?? null);

    setLoading(false);
  }, [monthId, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleEditWeek = (week: TrainingWeek, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingWeekId(week.id);
    setEditDateStart(week.date_start ?? "");
    setEditDateEnd(week.date_end ?? "");
  };

  const handleSaveWeekDates = async (weekId: string) => {
    setSavingWeek(true);
    await supabase.from("training_weeks").update({
      date_start: editDateStart || null,
      date_end: editDateEnd || null,
    }).eq("id", weekId);
    // Azzera i day_date così vengono ricalcolati dalle nuove date
    await supabase.from("training_days").update({ day_date: null }).eq("week_id", weekId);
    setSavingWeek(false);
    setEditingWeekId(null);
    fetch();
  };

  const handleOpenNotes = async () => {
    // Se ci sono già note salvate, mostrare quelle
    if (month?.notes) {
      setNotesText(month.notes);
      setShowNotes(true);
      return;
    }
    // Altrimenti genera il template con titoli settimana/day
    const daysMap: Record<string, { id: string; day_number: number; label: string | null }[]> = {};
    for (const w of weeks) {
      const { data } = await supabase.from("training_days").select("id, day_number, label").eq("week_id", w.id).order("day_number");
      daysMap[w.id] = data ?? [];
    }
    setWeekDays(daysMap);
    let template = "";
    for (const w of weeks) {
      template += `── SETTIMANA ${w.week_number} ─────────────────────────\n`;
      const days = daysMap[w.id] ?? [];
      for (const d of days) {
        const dayTitle = d.label ?? `Day ${d.day_number}`;
        template += `\n${dayTitle}\n\n\n`;
      }
      template += "\n";
    }
    setNotesText(template);
    setShowNotes(true);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await supabase.from("training_months").update({ notes: notesText }).eq("id", monthId);
    setSavingNotes(false);
    setMonth(m => m ? { ...m, notes: notesText } : m);
    setShowNotes(false);
  };

  const handleSaveDesc = async () => {
    setSavingDesc(true);
    await supabase.from("training_months").update({ description: descText.trim() || null }).eq("id", monthId);
    setSavingDesc(false);
    setMonth(m => m ? { ...m, description: descText.trim() || null } : m);
    setEditingDesc(false);
  };

  const handleSaveVf = async (value: string | null) => {
    setSavingVf(true);
    await supabase.from("training_months").update({ visible_from: value || null }).eq("id", monthId);
    setSavingVf(false);
    setMonth(m => m ? { ...m, visible_from: value || null } : m);
    setEditingVf(false);
  };

  const formatVf = (ds: string) =>
    new Date(ds + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  const handleDeleteMonth = async () => {
    setDeleting(true);
    await supabase.from("training_months").delete().eq("id", monthId);
    router.push(`/clienti/${clientId}`);
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) : "";

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header backHref={`/clienti/${clientId}`} title="Caricamento..." />
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-20 bg-gray-100" />)}
      </div>
    </div>
  );

  if (!month) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Mese non trovato</p>
        <Link href={`/clienti/${clientId}`} className="btn-primary">Torna al cliente</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref={`/clienti/${clientId}`}
        title={month.label}
        subtitle={clientName}
        clientView={isClientView}
        clientId={isClientView ? clientId : undefined}
        right={!isClientView ? (
          <div className="flex items-center gap-2">
            <button onClick={handleOpenNotes} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Note
            </button>
            <button onClick={() => setShowNewWeek(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Settimana
            </button>
          </div>
        ) : undefined}
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Descrizione mese — solo coach */}
        {!isClientView && (
          <div>
            {editingDesc ? (
              <div className="card p-4 space-y-3">
                <textarea
                  autoFocus
                  rows={3}
                  placeholder="Aggiungi una descrizione per questo mese..."
                  value={descText}
                  onChange={e => setDescText(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 resize-none bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 leading-relaxed"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingDesc(false)} className="btn-secondary flex-none text-xs py-1.5 px-3">Annulla</button>
                  <button onClick={handleSaveDesc} disabled={savingDesc} className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50">
                    {savingDesc ? "Salvo..." : "Salva"}
                  </button>
                </div>
              </div>
            ) : month.description ? (
              <div className="card p-4 flex items-start justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{month.description}</p>
                <button onClick={() => { setDescText(month.description ?? ""); setEditingDesc(true); }}
                  className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0 mt-0.5"
                  title="Modifica descrizione">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => { setDescText(""); setEditingDesc(true); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Aggiungi descrizione mese
              </button>
            )}
          </div>
        )}
        {/* Descrizione visibile anche al cliente se presente */}
        {isClientView && month.description && (
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{month.description}</p>
          </div>
        )}

        {/* Visibilità mese */}
        {(() => {
          const todayStr = new Date().toISOString().split("T")[0];
          // Data auto: 3 giorni prima dell'inizio della prima settimana
          const computedVf = (() => {
            const ds = weeks[0]?.date_start;
            if (!ds) return null;
            const dt = new Date(ds + "T12:00:00");
            dt.setDate(dt.getDate() - 3);
            return dt.toISOString().split("T")[0];
          })();
          const effectiveVf = month.visible_from ?? computedVf;
          const isAutomatic = !month.visible_from && !!computedVf;

          return !isClientView ? (
            <div>
              {editingVf ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="input text-sm py-1.5 flex-1"
                    value={vfDraft}
                    onChange={e => setVfDraft(e.target.value)}
                  />
                  <button
                    onClick={() => handleSaveVf(vfDraft)}
                    disabled={savingVf || !vfDraft}
                    className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                  >
                    {savingVf ? "Salvo..." : "Salva"}
                  </button>
                  <button onClick={() => setEditingVf(false)} className="btn-secondary text-xs py-1.5 px-3">✕</button>
                </div>
              ) : effectiveVf && effectiveVf > todayStr ? (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="text-amber-600 dark:text-amber-400">
                    La scheda risulterà visibile il <strong>{formatVf(effectiveVf)}</strong>
                    {isAutomatic && <span className="text-gray-400 font-normal"> (automatico)</span>}
                  </span>
                  <button
                    onClick={() => { setVfDraft(effectiveVf); setEditingVf(true); }}
                    className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                    title="Modifica data"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {!isAutomatic && (
                    <button
                      onClick={() => handleSaveVf(null)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                      title="Ripristina data automatica"
                    >
                      Ripristina automatico
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null;
        })()}

        {/* Weeks */}
        {(() => {
          const todayStr = new Date().toISOString().split("T")[0];
          const computedVf = (() => {
            const ds = weeks[0]?.date_start;
            if (!ds) return null;
            const dt = new Date(ds + "T12:00:00");
            dt.setDate(dt.getDate() - 3);
            return dt.toISOString().split("T")[0];
          })();
          const effectiveVf = month.visible_from ?? computedVf;
          const isLocked = isClientView && !!effectiveVf && effectiveVf > todayStr;
          return (
        <div>
          <p className="section-label">{weeks.length} settiman{weeks.length === 1 ? "a" : "e"}</p>

          {isLocked ? (
            <div className="card p-6 text-center space-y-3">
              <div className="text-4xl">🔒</div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Allenamento in arrivo</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Il tuo allenamento si attiverà il{" "}
                <strong className="text-gray-700 dark:text-gray-200">{formatVf(effectiveVf!)}</strong>.
                <br />
                Se vuoi anticipare la data, contatta la coach.
              </p>
            </div>
          ) : weeks.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-gray-500">Nessuna settimana ancora.</p>
              {!isClientView && <button className="btn-primary mt-3 text-sm" onClick={() => setShowNewWeek(true)}>Crea Settimana 1</button>}
            </div>
          ) : (
            <div className="space-y-3">
              {weeks.map(week => (
                <div key={week.id} className="card overflow-hidden">
                  {editingWeekId === week.id ? (
                    // ── Modalità edit date ──────────────────────
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: "#D4E600", color: "#111" }}>
                          S{week.week_number}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Settimana {week.week_number}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Dal</label>
                          <input className="input" type="date" value={editDateStart} onChange={e => setEditDateStart(e.target.value)} />
                        </div>
                        <div>
                          <label className="label">Al</label>
                          <input className="input" type="date" value={editDateEnd} onChange={e => setEditDateEnd(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className="btn-secondary flex-1 text-sm" onClick={() => setEditingWeekId(null)}>Annulla</button>
                        <button className="btn-primary flex-1 text-sm" disabled={savingWeek} onClick={() => handleSaveWeekDates(week.id)}>
                          {savingWeek ? "Salvo..." : "Salva"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── Vista normale ───────────────────────────
                    <Link
                      href={`/clienti/${clientId}/${monthId}/${week.id}`}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700 block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: "#D4E600", color: "#111" }}>
                          S{week.week_number}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">Settimana {week.week_number}</div>
                          {(week.date_start || week.date_end) && (
                            <div className="text-sm text-gray-400 mt-0.5">
                              {formatDate(week.date_start)} — {formatDate(week.date_end)}
                            </div>
                          )}
                          {week.notes && <div className="text-xs text-gray-400 mt-0.5">{week.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isClientView && (
                          <button
                            onClick={e => handleEditWeek(week, e)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Modifica date"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        <svg className="text-gray-300 group-hover:text-gray-500 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        );
        })()}

        {/* Delete — solo coach */}
        {!isClientView && <div className="pb-4 text-center">
          {!deleteConfirm ? (
            <button
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              onClick={() => setDeleteConfirm(true)}
            >
              Elimina mese
            </button>
          ) : (
            <div className="card p-4 border-red-100 text-center space-y-3">
              <p className="text-sm text-red-500 font-medium">Eliminare {month.label}?</p>
              <p className="text-xs text-gray-400">Questa azione è irreversibile e cancella tutte le settimane e gli allenamenti.</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                <button className="btn-danger flex-1 text-sm" onClick={handleDeleteMonth} disabled={deleting}>{deleting ? "Eliminando..." : "Sì, elimina"}</button>
              </div>
            </div>
          )}
        </div>}
      </main>

      <Modal open={showNewWeek} onClose={() => setShowNewWeek(false)} title="Nuova settimana">
        <NewWeekForm monthId={monthId} existingCount={weeks.length}
          lastWeek={weeks.length > 0 ? weeks[weeks.length - 1] : lastWeekAny}
          subscriptionEnd={subscriptionEnd}
          onSuccess={() => { setShowNewWeek(false); fetch(); }} onCancel={() => setShowNewWeek(false)} />
      </Modal>

      {/* ── Modale Note Coach ─────────────────────────────────── */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowNotes(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl flex flex-col" style={{ height: "80vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">📝 Note — {month.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Appunti liberi della coach</p>
              </div>
              <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Textarea unica */}
            <textarea
              className="flex-1 w-full px-5 py-4 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 resize-none focus:outline-none font-mono leading-relaxed placeholder-gray-300 dark:placeholder-gray-600"
              placeholder="Inizia a scrivere..."
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
            />
            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex gap-2">
              <button onClick={() => setShowNotes(false)}
                className="flex-none px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Chiudi
              </button>
              <button onClick={handleSaveNotes} disabled={savingNotes}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: "#D4E600", color: "#111" }}>
                {savingNotes ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
