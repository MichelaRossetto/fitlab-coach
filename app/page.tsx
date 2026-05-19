"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Client, ClientType, getInitials, getSubscriptionStatus, TIME_SLOTS_MORNING, TIME_SLOTS_AFTERNOON } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";

type FilterType = "all" | "expiring" | "expired" | "inactive" | "paused";
type SectionFilter = FilterType | null; // null = sezione nascosta
type ViewType = "list" | "calendar";

interface ScheduleEntry {
  client_id: string;
  day_of_week: number;
  time: string;
}

// ─── Mini stats row per tipo ──────────────────────────────────
function TypeStatsRow({
  label, clients, sectionFilter, onFilter,
}: {
  label: ClientType;
  clients: Client[];
  sectionFilter: SectionFilter;
  onFilter: (f: SectionFilter) => void;
}) {
  const stats = {
    total:    clients.length,
    expiring: clients.filter(c => !c.is_paused && getSubscriptionStatus(c.subscription_end) === "expiring").length,
    expired:  clients.filter(c => !c.is_paused && getSubscriptionStatus(c.subscription_end) === "expired").length,
    inactive: clients.filter(c => !c.is_paused && getSubscriptionStatus(c.subscription_end) === "inactive").length,
    paused:   clients.filter(c => c.is_paused).length,
  };

  const isPR = label === "PR";
  const accent = isPR ? "#C0D738" : "#6366f1";
  const hidden = sectionFilter === null;

  // "totali": toggle visibilità sezione. Gli altri: filtro dentro la sezione.
  const pillActive = (filter: FilterType) => !hidden && sectionFilter === filter;

  const handleTotal = () => onFilter(hidden || sectionFilter !== "all" ? "all" : null);
  const handleFilter = (f: FilterType) => {
    if (hidden) return; // sezione nascosta: non cambiare filtro
    onFilter(sectionFilter === f ? "all" : f);
  };

  const pillClass = (active: boolean) =>
    `flex flex-col items-center px-3 py-2 rounded-xl border transition-all flex-1 ${
      active
        ? "bg-gray-900 border-gray-900 dark:bg-gray-100 dark:border-gray-100"
        : "bg-white border-gray-100 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accent }}>{label}</span>
        <span className="text-xs text-gray-400">{isPR ? "Programmazione" : "Personal Training"}</span>
        {hidden && <span className="text-[10px] text-gray-400 italic">nascosta · clicca totali per mostrare</span>}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {/* Totali: toggle visibilità */}
        <button onClick={handleTotal} className={pillClass(pillActive("all"))}>
          <span className={`text-lg font-bold leading-none ${pillActive("all") ? "text-white dark:text-gray-900" : hidden ? "text-gray-300 dark:text-gray-600" : "text-gray-900 dark:text-gray-100"}`}>{stats.total}</span>
          <span className={`text-[10px] mt-0.5 ${pillActive("all") ? "text-gray-300 dark:text-gray-600" : "text-gray-400"}`}>totali</span>
        </button>
        {/* Filtri: operano dentro la sezione */}
        {(["expiring", "expired", "inactive", "paused"] as const).map((f, i) => {
          const value = [stats.expiring, stats.expired, stats.inactive, stats.paused][i];
          const color = ["text-amber-600", "text-red-500", "text-gray-400", "text-indigo-500"][i];
          const sublabel = ["in scad.", "scaduti", "inattivi", "in pausa"][i];
          const active = pillActive(f);
          return (
            <button key={f} onClick={() => handleFilter(f)} disabled={hidden}
              className={pillClass(active) + (hidden ? " opacity-30 cursor-default" : "")}>
              <span className={`text-lg font-bold leading-none ${active ? "text-white dark:text-gray-900" : color}`}>{value}</span>
              <span className={`text-[10px] mt-0.5 ${active ? "text-gray-300 dark:text-gray-600" : "text-gray-400"}`}>{sublabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────
const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven"];
const MONTH_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}


function CalendarView({ scheduleEntries, clients, activeFilter }: {
  scheduleEntries: ScheduleEntry[];
  clients: Client[];
  activeFilter: FilterType;
}) {
  const visibleClients = clients.filter(c => {
    if (c.is_paused) return false;
    const s = getSubscriptionStatus(c.subscription_end);
    return s === "active" || s === "expiring";
  });
  const visibleIds = new Set(visibleClients.map(c => c.id));
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const weekLabel = (() => {
    const start = weekDays[0];
    const end = weekDays[4];
    if (start.getMonth() === end.getMonth())
      return `${start.getDate()}–${end.getDate()} ${MONTH_SHORT[start.getMonth()]} ${start.getFullYear()}`;
    return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  })();

  const DISPLAY_SLOTS_MORNING   = ["08:00","09:00","10:00","11:00","12:00","13:00"];
  const DISPLAY_SLOTS_AFTERNOON = ["16:00","17:00","18:00","19:00"];
  const DISPLAY_SLOTS = [...DISPLAY_SLOTS_MORNING, ...DISPLAY_SLOTS_AFTERNOON];

  const timeToMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const slotMap: Record<number, Record<string, { pr: string[]; pt: string[] }>> = {};
  for (let d = 0; d < 5; d++) slotMap[d] = {};
  for (const e of scheduleEntries) {
    if (e.day_of_week < 0 || e.day_of_week > 4) continue;
    if (!visibleIds.has(e.client_id)) continue;
    const clientType = visibleClients.find(c => c.id === e.client_id)?.client_type ?? "PR";
    const T = timeToMin(e.time);
    for (const slot of DISPLAY_SLOTS) {
      const H = timeToMin(slot);
      if (T < H + 60 && T + 60 > H) {
        if (!slotMap[e.day_of_week][slot]) slotMap[e.day_of_week][slot] = { pr: [], pt: [] };
        const key = clientType === "PT" ? "pt" : "pr";
        if (!slotMap[e.day_of_week][slot][key].includes(e.client_id))
          slotMap[e.day_of_week][slot][key].push(e.client_id);
      }
    }
  }

  const clientsInSlot: Client[] = selectedSlot ? (() => {
    const slot = slotMap[selectedSlot.day]?.[selectedSlot.time];
    if (!slot) return [];
    return [...slot.pr, ...slot.pt]
      .map(id => visibleClients.find(c => c.id === id))
      .filter((c): c is Client => Boolean(c));
  })() : [];

  const SlotCell = ({ day, time }: { day: number; time: string }) => {
    const slot = slotMap[day]?.[time] ?? { pr: [], pt: [] };
    const prCount = slot.pr.length;
    const ptCount = slot.pt.length;
    const total = prCount + ptCount;
    const overloaded = total >= 5;
    return (
      <button
        onClick={() => total > 0 && setSelectedSlot({ day, time })}
        className="border-l border-gray-100 dark:border-gray-700 px-1 flex flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-75 min-h-[32px]"
        disabled={total === 0}
      >
        <div className="flex items-center gap-0.5">
          {prCount > 0 && (
            <span className="text-[11px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: "#C0D738", color: "#111" }}>{prCount}</span>
          )}
          {ptCount > 0 && (
            <span className="text-[11px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: "#6366f1", color: "#fff" }}>{ptCount}</span>
          )}
        </div>
        {overloaded && (
          <span className="text-[9px] font-bold leading-none" style={{ color: "#dc2626" }}>FULL</span>
        )}
      </button>
    );
  };

  return (
    <>
      <div className="card overflow-hidden">
        {(() => {
          const todayMonday = getMonday(new Date());
          const isFuture = weekStart.getTime() > todayMonday.getTime();
          const isPast   = weekStart.getTime() < todayMonday.getTime();
          const backBtn = (
            <button
              onClick={() => setWeekStart(getMonday(new Date()))}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              {isFuture ? "← settimana corrente" : "settimana corrente →"}
            </button>
          );
          return (
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 min-w-[120px]">
                <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                {isFuture && backBtn}
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{weekLabel}</span>
              <div className="flex items-center gap-2 justify-end min-w-[120px]">
                {isPast && backBtn}
                <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-2" />
          {weekDays.map((date, i) => (
            <div key={i} className={`p-2 text-center border-l border-gray-100 dark:border-gray-700 ${isToday(date) ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}>
              <div className="text-[10px] text-gray-400 font-medium">{DAY_LABELS[i]}</div>
              <div className={`text-sm font-bold mt-0.5 ${isToday(date) ? "text-yellow-600 dark:text-yellow-400" : "text-gray-700 dark:text-gray-200"}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-gray-200 dark:border-gray-600">
          <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-700/50">Mattina</div>
          {DISPLAY_SLOTS_MORNING.map(time => (
            <div key={time} className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-gray-50 dark:border-gray-700/50 last:border-0">
              <div className="p-2 text-[11px] text-gray-400 flex items-center justify-end pr-3 font-mono">{time}</div>
              {[0,1,2,3,4].map(day => <SlotCell key={day} day={day} time={time} />)}
            </div>
          ))}
        </div>

        <div>
          <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-700/50">Pomeriggio</div>
          {DISPLAY_SLOTS_AFTERNOON.map(time => (
            <div key={time} className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-gray-50 dark:border-gray-700/50 last:border-0">
              <div className="p-2 text-[11px] text-gray-400 flex items-center justify-end pr-3 font-mono">{time}</div>
              {[0,1,2,3,4].map(day => <SlotCell key={day} day={day} time={time} />)}
            </div>
          ))}
        </div>

        <div className="px-3 py-2 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-[10px] text-gray-400 font-semibold">Legenda:</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#C0D738", color: "#111" }}>2</span>
            <span className="text-[10px] text-gray-400">PR</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#6366f1", color: "#fff" }}>1</span>
            <span className="text-[10px] text-gray-400">PT</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold" style={{ color: "#dc2626" }}>FULL = 5+</span>
          </div>
        </div>
      </div>

      <Modal open={!!selectedSlot} onClose={() => setSelectedSlot(null)}
        title={selectedSlot ? `${DAY_LABELS[selectedSlot.day]} · ${selectedSlot.time}` : ""}>
        <div className="space-y-1">
          {clientsInSlot.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nessun cliente</p>
          ) : clientsInSlot.map(client => (
            <Link key={client.id} href={`/clienti/${client.id}`} onClick={() => setSelectedSlot(null)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 flex-shrink-0"
                style={{ borderColor: client.client_type === "PT" ? "#6366f1" : "#C0D738", backgroundColor: client.client_type === "PT" ? "#eef2ff" : "#f9fce0", color: "#111" }}>
                {getInitials(client.name, client.surname)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{client.name} {client.surname}</span>
                <div className="mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${client.client_type === "PT" ? "bg-indigo-500" : "bg-[#C0D738] text-black"}`}>
                    {client.client_type ?? "PR"}
                  </span>
                </div>
              </div>
              <svg className="ml-auto text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      </Modal>
    </>
  );
}

// ─── New Client Form ──────────────────────────────────────────
function NewClientForm({ trainerId, onSuccess, onCancel }: { trainerId: string; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: "", surname: "", email: "", phone: "", subscription_end: "", notes: "" });
  const [clientType, setClientType] = useState<ClientType>("PR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.surname.trim()) { setError("Nome e cognome sono obbligatori"); return; }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("clients").insert({
      name: form.name.trim(), surname: form.surname.trim(),
      email: form.email.trim() || null, phone: form.phone.trim() || null,
      subscription_end: form.subscription_end || null,
      notes: form.notes.trim() || null,
      trainer_id: trainerId,
      client_type: clientType,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo cliente */}
      <div>
        <label className="label">Tipo cliente</label>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
          {(["PR", "PT"] as ClientType[]).map(t => (
            <button key={t} type="button" onClick={() => setClientType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${clientType === t ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400"}`}
              style={clientType === t ? { color: t === "PR" ? "#8a9a00" : "#6366f1" } : {}}>
              {t} — {t === "PR" ? "Programmazione" : "Personal Training"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Nome *</label><input className="input" placeholder="es. Mario" value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Cognome *</label><input className="input" placeholder="es. Rossi" value={form.surname} onChange={set("surname")} /></div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" placeholder="email@esempio.com" value={form.email} onChange={set("email")} /></div>
      <div><label className="label">Telefono</label><input className="input" type="tel" placeholder="+39 333 000 0000" value={form.phone} onChange={set("phone")} /></div>
      <div><label className="label">Scadenza abbonamento</label><input className="input" type="date" value={form.subscription_end} onChange={set("subscription_end")} /></div>
      <div><label className="label">Note</label><textarea className="input resize-none" rows={2} placeholder="Obiettivi, infortuni, note..." value={form.notes} onChange={set("notes")} /></div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Salvataggio..." : "Aggiungi cliente"}</button>
      </div>
    </form>
  );
}

// ─── Client List Section ──────────────────────────────────────
function ClientSection({
  type, clients, scheduleDays, search, activeFilter,
}: {
  type: ClientType;
  clients: Client[];
  scheduleDays: Record<string, number[]>;
  search: string;
  activeFilter: SectionFilter;
}) {
  if (activeFilter === null) return null; // sezione nascosta

  const isPR = type === "PR";
  const accent = isPR ? "#C0D738" : "#6366f1";
  const accentBg = isPR ? "#f9fce0" : "#eef2ff";

  const filtered = clients.filter(c => {
    const nameMatch = `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase());
    if (!nameMatch) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "paused") return !!c.is_paused;
    if (c.is_paused) return false; // i pausati compaiono solo nel filtro "paused"
    return getSubscriptionStatus(c.subscription_end) === activeFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    const order = { expiring: 0, active: 1, expired: 2, inactive: 3 };
    return order[getSubscriptionStatus(a.subscription_end)] - order[getSubscriptionStatus(b.subscription_end)];
  });

  if (sorted.length === 0 && (search || activeFilter !== "all")) return null;

  return (
    <div className="space-y-2">
      <p className="section-label flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: accent }}>{type}</span>
        {sorted.length} client{sorted.length === 1 ? "e" : "i"}
        {activeFilter !== "all" && <span className="text-gray-300">· filtrati</span>}
      </p>
      {sorted.length === 0 ? (
        <div className="card px-4 py-6 text-center text-sm text-gray-400">
          Nessun cliente {type} in questa categoria
        </div>
      ) : (
        <div className="card divide-y divide-gray-50 dark:divide-gray-700">
          {sorted.map(client => (
            <Link key={client.id} href={`/clienti/${client.id}`}
              className={`flex items-center gap-3.5 p-4 hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700 ${getSubscriptionStatus(client.subscription_end) === "inactive" ? "opacity-40" : ""}`}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm border-2"
                style={{ borderColor: accent, backgroundColor: accentBg, color: "#111" }}>
                {getInitials(client.name, client.surname)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm truncate dark:text-gray-100">{client.name} {client.surname}</span>
                  {scheduleDays[client.id]?.length > 0 && (
                    <span className="text-[11px] font-medium flex-shrink-0 flex items-center gap-0.5" style={{ color: isPR ? "#8a9a00" : "#6366f1" }}>
                      {scheduleDays[client.id].sort().map((d, i, arr) => (
                        <span key={d}>{["L","M","M","G","V"][d]}{i < arr.length - 1 && <span className="text-gray-400 mx-0.5">·</span>}</span>
                      ))}
                    </span>
                  )}
                </div>
                <div className="mt-1"><StatusBadge subscriptionEnd={client.subscription_end} isPaused={client.is_paused} /></div>
              </div>
              <svg className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleDays, setScheduleDays] = useState<Record<string, number[]>>({});
  const [trainerId, setTrainerId] = useState<string>("");
  const [trainerEmail, setTrainerEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [prFilter, setPrFilter] = useState<SectionFilter>("all");
  const [ptFilter, setPtFilter] = useState<SectionFilter>(null);
  const [view, setView] = useState<ViewType>("list");

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      setTrainerId(user.id);
      setTrainerEmail(user.email ?? "");
      const { data: clientMatch } = await supabase.from("clients").select("id").eq("email", user.email).maybeSingle();
      if (clientMatch) { router.replace(`/clienti/${clientMatch.id}`); return; }
    }
    const [{ data }, schedRes] = await Promise.all([
      supabase.from("clients").select("*").order("surname", { ascending: true }),
      fetch("/api/schedules", { cache: "no-store" }),
    ]);
    setClients(data ?? []);
    const schedData = schedRes.ok ? await schedRes.json() : [];
    const entries: ScheduleEntry[] = (schedData ?? []) as ScheduleEntry[];
    setScheduleEntries(entries);
    const days: Record<string, number[]> = {};
    entries.forEach(s => {
      if (!days[s.client_id]) days[s.client_id] = [];
      if (!days[s.client_id].includes(s.day_of_week)) days[s.client_id].push(s.day_of_week);
    });
    setScheduleDays(days);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const prClients = clients.filter(c => (c.client_type ?? "PR") === "PR");
  const ptClients = clients.filter(c => c.client_type === "PT");

  const hasAnyResult = (type: "PR" | "PT") => {
    const filter = type === "PR" ? prFilter : ptFilter;
    if (filter === null) return false;
    const list = type === "PR" ? prClients : ptClients;
    return list.some(c => {
      const nameMatch = `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase());
      if (!nameMatch) return false;
      if (filter === "all") return true;
      if (filter === "paused") return !!c.is_paused;
      if (c.is_paused) return false;
      return getSubscriptionStatus(c.subscription_end) === filter;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl tracking-tight leading-none">
              <span style={{ color: "#C0D738" }}>FIT</span>
              <span className="text-gray-900 dark:text-white">LAB</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{trainerEmail || "Coach App"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1">
              <svg className="dark:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              <svg className="hidden dark:block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>
            <Link href="/esercizi" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1" title="Libreria esercizi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors p-1" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 btn-primary text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nuovo cliente
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Stats distinte per tipo */}
        {!loading && clients.length > 0 && (
          <div className="space-y-3">
            {ptClients.length > 0 && (
              <TypeStatsRow label="PT" clients={ptClients} sectionFilter={ptFilter} onFilter={setPtFilter} />
            )}
            {prClients.length > 0 && (
              <TypeStatsRow label="PR" clients={prClients} sectionFilter={prFilter} onFilter={setPrFilter} />
            )}
          </div>
        )}

        {/* View toggle */}
        {!loading && (
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-1">
            <button onClick={() => setView("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all
                ${view === "list" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Lista
            </button>
            <button onClick={() => setView("calendar")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all
                ${view === "calendar" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Calendario
            </button>
          </div>
        )}

        {view === "calendar" ? (
          <CalendarView scheduleEntries={scheduleEntries} clients={clients} activeFilter="all" />
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="input pl-10" placeholder="Cerca cliente..." value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded w-40" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasAnyResult("PR") && !hasAnyResult("PT") ? (
              <div className="card p-10 text-center">
                {clients.length === 0 ? (
                  <>
                    <div className="text-3xl mb-3">👋</div>
                    <p className="font-medium text-gray-700 mb-1">Nessun cliente ancora</p>
                    <p className="text-sm text-gray-400 mb-4">Aggiungi il tuo primo cliente per iniziare</p>
                    <button className="btn-primary mx-auto" onClick={() => setShowModal(true)}>Aggiungi cliente</button>
                  </>
                ) : search ? (
                  <>
                    <div className="text-3xl mb-3">🔍</div>
                    <p className="text-gray-500">{`Nessun cliente trovato per "${search}"`}</p>
                    <button className="mt-3 text-sm text-gray-400 hover:text-gray-600 underline" onClick={() => setSearch("")}>Rimuovi ricerca</button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Clicca su <strong>totali</strong> PT o PR per visualizzare la lista</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <ClientSection type="PT" clients={ptClients} scheduleDays={scheduleDays} search={search} activeFilter={ptFilter} />
                <ClientSection type="PR" clients={prClients} scheduleDays={scheduleDays} search={search} activeFilter={prFilter} />
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuovo cliente">
        <NewClientForm trainerId={trainerId} onSuccess={() => { setShowModal(false); fetchClients(); }} onCancel={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
