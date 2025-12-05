// src/components/StatusBadge.tsx
type StatusKind = "order" | "delivery";

type Props = {
  status: string;
  kind?: StatusKind;
};

export function StatusBadge({ status, kind = "order" }: Props) {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

  const mapOrder: Record<string, string> = {
    NEW: "bg-sky-100 text-sky-700",
    COOKING: "bg-amber-100 text-amber-700",
    READY: "bg-emerald-100 text-emerald-700",
    ON_DELIVERY: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const mapDelivery: Record<string, string> = {
    PENDING: "bg-sky-100 text-sky-700",
    ASSIGNED: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-green-100 text-green-700",
    DONE: "bg-red-100 text-red-700",
  };

  const palette = kind === "order" ? mapOrder : mapDelivery;
  const color = palette[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`${base} ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{status}</span>
    </span>
  );
}