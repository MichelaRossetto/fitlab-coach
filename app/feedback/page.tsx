"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";

type Feedback = {
  id: string;
  client_id: string;
  type: "bug" | "suggerimento" | "altro" | "payment" | "reschedule";
  message: string;
  created_at: string;
  read: boolean;
  clients: { name: string; surname: string } | null;
};

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  bug: "🐛 Bug",
  suggerimento: "💡 Suggerimento",
  altro: "⭐ Altro",
};
const FEEDBACK_TYPE_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suggerimento: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  altro: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"feedback" | "pagamenti" | "spostamenti">("pagamenti");

  useEffect(() => {
    fetch("/api/feedback")
      .then(r => r.json())
      .then(data => { setItems(data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const payments = items.filter(i => i.type === "payment");
  const reschedules = items.filter(i => i.type === "reschedule");
  const feedbacks = items.filter(i => i.type !== "payment" && i.type !== "reschedule");
  const unreadPayments = payments.filter(i => !i.read).length;
  const unreadReschedules = reschedules.filter(i => !i.read).length;
  const unreadFeedbacks = feedbacks.filter(i => !i.read).length;
  const totalUnread = items.filter(i => !i.read).length;

  const activeItems = tab === "pagamenti" ? payments : tab === "spostamenti" ? reschedules : feedbacks;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header backHref="/" title="Messaggi" subtitle={totalUnread > 0 ? `${totalUnread} non letti` : "Tutti letti"} />

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-1 mb-5">
          <button
            onClick={() => setTab("pagamenti")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === "pagamenti" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            💳 Pagamenti
            {unreadPayments > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">{unreadPayments}</span>}
          </button>
          <button
            onClick={() => setTab("spostamenti")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === "spostamenti" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            🔄 Spostamenti
            {unreadReschedules > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">{unreadReschedules}</span>}
          </button>
          <button
            onClick={() => setTab("feedback")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === "feedback" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            💬 Feedback
            {unreadFeedbacks > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-lime-500 text-white">{unreadFeedbacks}</span>}
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-3 pb-8">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Carico...</p>
          ) : activeItems.length === 0 ? (
            <p className="text-center text-gray-400 py-10 italic">
              {tab === "pagamenti" ? "Nessun avviso di pagamento." : tab === "spostamenti" ? "Nessuno spostamento registrato." : "Nessun feedback ancora."}
            </p>
          ) : activeItems.map(item => (
            <div key={item.id} className={`card p-4 space-y-2 transition-colors ${!item.read ? "border-l-4 border-lime-400" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.type === "payment" ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      💳 Pagamento
                    </span>
                  ) : item.type === "reschedule" ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      🔄 Spostamento
                    </span>
                  ) : (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${FEEDBACK_TYPE_COLORS[item.type]}`}>
                      {FEEDBACK_TYPE_LABELS[item.type]}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {item.clients ? `${item.clients.name} ${item.clients.surname}` : "Cliente"}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {new Date(item.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.message}</p>
              {!item.read && (
                <button onClick={() => markRead(item.id)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
                  Segna come letto
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
