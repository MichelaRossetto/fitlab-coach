import { getSubscriptionStatus } from "@/lib/types";

interface StatusBadgeProps {
  subscriptionEnd: string | null;
  isPaused?: boolean | null;
}

export function StatusBadge({ subscriptionEnd, isPaused }: StatusBadgeProps) {
  if (isPaused) {
    return (
      <span className="badge-expired" style={{ backgroundColor: "#e0e7ff", color: "#4338ca", opacity: 1 }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#6366f1" }} />
        In pausa
      </span>
    );
  }

  const status = getSubscriptionStatus(subscriptionEnd);
  const formatted = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null;

  if (status === "active") {
    return (
      <span className="badge-active">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Attivo · {formatted}
      </span>
    );
  }

  if (status === "expiring") {
    const daysLeft = Math.ceil(
      (new Date(subscriptionEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return (
      <span className="badge-expiring">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Scade in {daysLeft}g · {formatted}
      </span>
    );
  }

  // expired
  return (
    <span className="badge-expired">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      {formatted ? `Scaduto · ${formatted}` : "Scaduto"}
    </span>
  );
}
