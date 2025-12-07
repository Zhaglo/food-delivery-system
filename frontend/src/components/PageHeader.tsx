import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="mb-4 pb-2 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Раздел
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 max-w-xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}