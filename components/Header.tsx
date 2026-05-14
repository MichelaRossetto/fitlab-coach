"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  backHref?: string;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ backHref, title, subtitle, right }: HeaderProps) {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-2xl mx-auto px-4">
        {/* Logo bar */}
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tight leading-none">
              <span style={{ color: "#D4E600" }}>FIT</span>
              <span className="text-gray-900 dark:text-white">LAB</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Michela · Coach</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
              title="Esci"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sub-header with back + title */}
        {(backHref || title) && (
          <div className="flex items-center gap-3 py-2.5">
            {backHref && (
              <button
                onClick={() => router.push(backHref)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200
                           text-gray-500 hover:bg-gray-50 active:scale-90 transition-all
                           dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Indietro"
              >
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
  );
}
