type StatusKind = "order" | "delivery";

type Props = {
  status: string;
  kind?: StatusKind;
};

const ORDER_LABELS: Record<string, string> = {
  NEW: "Новый",
  COOKING: "Готовится",
  READY: "Готов",
  ON_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const DELIVERY_LABELS: Record<string, string> = {
  PENDING: "Ожидает",
  ASSIGNED: "Назначен",
  IN_PROGRESS: "В доставке",
  DONE: "Завершён",
};

export function StatusBadge({ status, kind = "order" }: Props) {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium";

  const orderPalette: Record<string, string> = {
    NEW: "bg-sky-50 text-sky-700 border border-sky-100",
    COOKING: "bg-amber-50 text-amber-700 border border-amber-100",
    READY: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    ON_DELIVERY: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    CANCELLED: "bg-rose-50 text-rose-700 border border-rose-100",
  };

  const deliveryPalette: Record<string, string> = {
    PENDING: "bg-slate-50 text-slate-700 border border-slate-200",
    ASSIGNED: "bg-sky-50 text-sky-700 border border-sky-100",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    DONE: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  };

  const palette = kind === "order" ? orderPalette : deliveryPalette;
  const color = palette[status] ?? "bg-slate-50 text-slate-700 border border-slate-200";

  const label =
    (kind === "order" ? ORDER_LABELS[status] : DELIVERY_LABELS[status]) ??
    status;

  return (
    <span className={`${base} ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="truncate">{label}</span>
    </span>
  );
}