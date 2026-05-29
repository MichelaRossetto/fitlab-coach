"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  backHref?: string;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  clientView?: boolean;
  clientId?: string; // necessario per inviare feedback
}

export function Header({ backHref, title, subtitle, right, clientView, clientId }: HeaderProps) {
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbType, setFbType] = useState<"bug" | "suggerimento" | "altro">("suggerimento");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbSent, setFbSent] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSendFeedback = async () => {
    if (!fbMessage.trim() || !clientId) return;
    setFbSending(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, type: fbType, message: fbMessage }),
    });
    setFbSending(false);
    setFbSent(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFbSent(false);
      setFbMessage("");
      setFbType("suggerimento");
    }, 2000);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4">
          {/* Logo bar */}
          <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight leading-none">
                <span style={{ color: "#C0D738" }}>FIT</span>
                <span className="text-gray-900 dark:text-white">LAB</span>
              </span>
            </Link>
            {!clientView && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">Michela · Coach</span>
                <Link href="/esercizi" className="text-gray-300 hover:text-gray-500 transition-colors" title="Libreria esercizi">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </Link>
                <button onClick={handleLogout} className="text-xs text-gray-300 hover:text-gray-500 transition-colors" title="Esci">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            )}
            {clientView && (
              <button
                onClick={() => setShowFeedback(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Invia feedback"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
          </div>
          {/* Sub-header */}
          {(backHref || title) && (
            <div className="flex items-center gap-3 py-2.5">
              {backHref && (
                <button onClick={() => router.push(backHref)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-90 transition-all dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Indietro">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
                  </svg>
                </button>
              )}
              {title && (
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate dark:text-gray-100">{title}</div>
                  {subtitle && <div className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{subtitle}</div>}
                </div>
              )}
              {right && <div className="flex-shrink-0">{right}</div>}
            </div>
          )}
        </div>
      </header>

      {/* Modal feedback */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowFeedback(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            {fbSent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">Grazie per il feedback!</p>
                <p className="text-sm text-gray-400 mt-1">La coach lo leggerà presto.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Invia feedback</h3>
                  <button onClick={() => setShowFeedback(false)} className="text-gray-400 hover:text-gray-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                {/* Tipo */}
                <div className="flex gap-2">
                  {([["bug", "🐛 Bug"], ["suggerimento", "💡 Suggerimento"], ["altro", "⭐ Altro"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setFbType(val)}
                      className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all border"
                      style={fbType === val
                        ? { backgroundColor: "#D4E600", color: "#111", borderColor: "transparent" }
                        : { backgroundColor: "transparent", borderColor: "#e5e7eb", color: "#6b7280" }
                      }>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Messaggio */}
                <textarea
                  rows={4}
                  placeholder="Descrivi il problema o il suggerimento..."
                  value={fbMessage}
                  onChange={e => setFbMessage(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 resize-none bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <button
                  onClick={handleSendFeedback}
                  disabled={!fbMessage.trim() || fbSending}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#D4E600", color: "#111" }}>
                  {fbSending ? "Invio..." : "Invia"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
