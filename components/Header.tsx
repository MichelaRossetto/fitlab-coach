"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Regolamento slides ───────────────────────────────────────
const REGOLAMENTO_SLIDES = [
  {
    emoji: "📌",
    title: "Assenze e spostamenti",
    text: "Ogni seduta è uno spazio riservato esclusivamente a te e fa parte di un percorso costruito su misura.\n\nPuoi spostare una sessione direttamente dal tuo profilo, entro la mattinata del giorno precedente. Passato questo limite, contatta la coach direttamente.\n\nTi chiediamo di non abusare di questa possibilità: il limite è volutamente ampio per darti flessibilità, ma spostamenti continui compromettono la qualità della programmazione.\n\nCome regola generale, cerca di limitarti a un massimo di uno spostamento a settimana — non tutte le settimane e non tutti i giorni.",
  },
  {
    emoji: "🔄",
    title: "Recuperi",
    text: "È consentito il recupero di massimo 1 settimana ogni 4 settimane di programmazione.\n\nNon sono previsti ulteriori recuperi, salvo malattia superiore a 15 giorni documentata da certificato medico.\n\nSpostamenti frequenti e cancellazioni dell'ultimo momento compromettono l'efficacia della programmazione.",
  },
  {
    emoji: "👟",
    title: "Scarpe e igiene",
    text: "Per motivi di igiene e sicurezza è obbligatorio utilizzare scarpe pulite, riservate esclusivamente all'uso interno.\n\nNon è consentito accedere alle aree di allenamento con calzature utilizzate all'esterno.\n\nPulire e riporre sempre l'attrezzatura dopo ogni utilizzo.",
  },
  {
    emoji: "🤝",
    title: "Condivisione degli spazi",
    text: "Lo studio è uno spazio condiviso tra clienti con programmazione autonoma e clienti in sessione di personal training.\n\nDurante le sessioni, alcune aree o attrezzature potrebbero essere temporaneamente riservate. Si richiede collaborazione e flessibilità nel rispetto delle attività in corso.",
  },
  {
    emoji: "⭐",
    title: "Il nostro patto",
    text: "Lo studio opera su appuntamento e programmazione personalizzata, costruita sulle tue esigenze e sui tuoi obiettivi.\n\nCostanza, continuità e rispetto della programmazione concordata sono fondamentali per ottenere risultati concreti.\n\nCollaborazione, puntualità e rispetto reciproco sono la base del lavoro che facciamo insieme.",
  },
];

// ─── Guida slides ─────────────────────────────────────────────
const GUIDA_SLIDES = [
  {
    emoji: "👤",
    title: "Il tuo profilo",
    text: "Qui trovi i tuoi dati anagrafici e gli orari abituali di allenamento. Questi vengono impostati dalla tua coach — se qualcosa non torna, scrivile direttamente.",
  },
  {
    emoji: "🏋️",
    title: "Massimali",
    text: "I massimali sono i tuoi pesi di riferimento per gli esercizi di forza. Servono alla coach per calcolare automaticamente il carico di ogni sessione in base alla % che ha scelto per te.\n\nPuoi inserirli o aggiornarli direttamente da qui, oppure dal giorno di allenamento in cui compare quell'esercizio — troverai un link apposito.",
  },
  {
    emoji: "⚡",
    title: "Allenamento di oggi",
    text: "Il bottone giallo ti porta direttamente all'allenamento previsto per oggi, in base alla data corrente. Se non è il giorno giusto, lo trovi comunque nella lista dei prossimi allenamenti.",
  },
  {
    emoji: "📅",
    title: "Prossimi allenamenti",
    text: "Vedi le tue prossime sessioni con data e orario. Puoi spostare un allenamento cliccando il bottone \"Sposta\" — ti verranno mostrati gli slot disponibili e quelli già al completo.\n\nAttenzione: non puoi spostare una sessione dopo mezzogiorno del giorno precedente. Passato quel limite trovi la scritta \"scrivi alla coach\" — contattala direttamente per cambi urgenti.",
  },
  {
    emoji: "📋",
    title: "La scheda di allenamento",
    text: "Ogni giorno mostra la scheda completa con tutti gli esercizi, le serie, le ripetizioni e i carichi calcolati.\n\nQuando finisci, clicca \"Completato\" per segnare la sessione come fatta. Puoi anche segnare \"Saltato\" se non hai potuto allenarti. Tutte le sessioni passate mostrano automaticamente il loro stato.",
  },
  {
    emoji: "🖨️",
    title: "Stampa la scheda",
    text: "Dal giorno o dalla settimana puoi stampare la scheda in formato PDF — utile se preferisci avere tutto su carta in palestra. Trovi il bottone in alto nella pagina dell'allenamento.",
  },
  {
    emoji: "💬",
    title: "Feedback",
    text: "Hai trovato un problema? Hai un suggerimento? Usa l'icona fumetto in alto a destra per inviare un messaggio direttamente alla coach. Puoi segnalare un bug, proporre un miglioramento, o semplicemente lasciare un commento.",
  },
];

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
  const [showGuida, setShowGuida] = useState(false);
  const [guidaSlide, setGuidaSlide] = useState(0);
  const [showRegolamento, setShowRegolamento] = useState(false);
  const [regSlide, setRegSlide] = useState(0);

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
              <div className="flex items-center gap-3">
                {/* Regolamento */}
                <button
                  onClick={() => { setRegSlide(0); setShowRegolamento(true); }}
                  className="h-7 px-2.5 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ backgroundColor: "#22c55e", color: "#fff" }}
                  title="Regolamento Studio"
                >
                  📋
                </button>
                {/* Guida */}
                <button
                  onClick={() => { setGuidaSlide(0); setShowGuida(true); }}
                  className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 transition-colors text-xs font-bold"
                  title="Guida all'app"
                >
                  ?
                </button>
                {/* Feedback */}
                <button
                  onClick={() => setShowFeedback(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Invia feedback"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                {/* Logout */}
                <button onClick={handleLogout} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" title="Esci">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
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
      {/* Modal guida */}
      {showGuida && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowGuida(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {/* Slide content */}
            <div className="p-6 space-y-3 min-h-[260px] flex flex-col justify-center">
              <div className="text-4xl">{GUIDA_SLIDES[guidaSlide].emoji}</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {GUIDA_SLIDES[guidaSlide].title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {GUIDA_SLIDES[guidaSlide].text}
              </p>
            </div>

            {/* Dots + navigation */}
            <div className="px-6 pb-5 space-y-4">
              {/* Dots */}
              <div className="flex justify-center gap-1.5">
                {GUIDA_SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setGuidaSlide(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: i === guidaSlide ? "#C0D738" : "#d1d5db" }}
                  />
                ))}
              </div>
              {/* Buttons */}
              <div className="flex gap-2">
                {guidaSlide > 0 ? (
                  <button onClick={() => setGuidaSlide(s => s - 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    ← Indietro
                  </button>
                ) : (
                  <button onClick={() => setShowGuida(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Chiudi
                  </button>
                )}
                {guidaSlide < GUIDA_SLIDES.length - 1 ? (
                  <button onClick={() => setGuidaSlide(s => s + 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "#D4E600", color: "#111" }}>
                    Avanti →
                  </button>
                ) : (
                  <button onClick={() => setShowGuida(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "#D4E600", color: "#111" }}>
                    Capito! ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal regolamento */}
      {showRegolamento && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowRegolamento(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {/* Header verde */}
            <div className="flex items-center gap-2 px-5 pt-5 pb-0">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Regolamento Studio</span>
            </div>
            {/* Slide content */}
            <div className="p-6 space-y-3 min-h-[260px] flex flex-col justify-center">
              <div className="text-4xl">{REGOLAMENTO_SLIDES[regSlide].emoji}</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {REGOLAMENTO_SLIDES[regSlide].title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {REGOLAMENTO_SLIDES[regSlide].text}
              </p>
            </div>
            {/* Nav */}
            <div className="px-6 pb-6 space-y-3">
              <div className="flex justify-center gap-1.5">
                {REGOLAMENTO_SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setRegSlide(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: i === regSlide ? "#22c55e" : "#d1d5db" }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {regSlide > 0 ? (
                  <button onClick={() => setRegSlide(s => s - 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    ← Indietro
                  </button>
                ) : (
                  <button onClick={() => setShowRegolamento(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Chiudi
                  </button>
                )}
                {regSlide < REGOLAMENTO_SLIDES.length - 1 ? (
                  <button onClick={() => setRegSlide(s => s + 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "#22c55e", color: "#fff" }}>
                    Avanti →
                  </button>
                ) : (
                  <button onClick={() => setShowRegolamento(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "#22c55e", color: "#fff" }}>
                    Ho letto ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
