import { getSubscriptionStatus, SubscriptionStatus } from "@/lib/types";

interface StatusBadgeProps {
  subscriptionEnd: string | null;
}

export function StatusBadge({ subscriptionEnd }: StatusBadgeProps) {
  const status = getSubscriptionStatus(subscriptionEnd);

  if (!subscriptionEnd) {
    return <span className="badge-expired">Nessuna scadenza</span>;
  }

  const formatted = new Date(subscriptionEnd).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

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
      (new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return (
      <span className="badge-expiring">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Scade in {daysLeft}g · {formatted}
      </span>
    );
  }

  return (
    <span className="badge-expired">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Scaduto · {formatted}
    </span>
  );
}
