"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  backHref?: string;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ backHref, title, subtitle, right }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4">
        {/* Logo bar */}
        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tight leading-none">
              <span style={{ color: "#D4E600" }}>FIT</span>
              <span className="text-gray-900">LAB</span>
            </span>
          </Link>
          <span className="text-xs text-gray-400 font-medium">Michela · Coach</span>
        </div>

        {/* Sub-header with back + title */}
        {(backHref || title) && (
          <div className="flex items-center gap-3 py-2.5">
            {backHref && (
              <button
                onClick={() => router.push(backHref)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200
                           text-gray-500 hover:bg-gray-50 active:scale-90 transition-all"
                aria-label="Indietro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
                </svg>
              </button>
            )}
            {title && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{title}</div>
                {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
              </div>
            )}
            {right && <div className="flex-shrink-0">{right}</div>}
          </div>
        )}
      </div>
    </header>
  );
}
