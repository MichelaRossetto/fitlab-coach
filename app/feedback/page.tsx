"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";

type Feedback = {
  id: string;
  client_id: string;
  type: "bug" | "suggerimento" | "altro";
  message: string;
  created_at: string;
  read: boolean;
  clients: { name: string; surname: string } | null;
};

const TYPE_LABELS: Record<string, string> = { bug: "🐛 Bug", suggerimento: "💡 Suggerimento", altro: "⭐ Altro" };
const TYPE_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suggerimento: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  altro: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feedback").then(r => r.json()).then(data => { setItems(data ?? []); setLoading(false); });
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header backHref="/" title="Feedback clienti" subtitle={unreadCount > 0 ? `${unreadCount} non letti` : "Tutti letti"} />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Carico...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-10 italic">Nessun feedback ancora.</p>
        ) : items.map(item => (
          <div key={item.id} className={`card p-4 space-y-2 transition-colors ${!item.read ? "border-l-4 border-lime-400" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type]}`}>
                  {TYPE_LABELS[item.type]}
                </span>
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
  );
}
