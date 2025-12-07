import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function Card({
  title,
  subtitle,
  actions,
  className = "",
  children,
}: CardProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <section
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-900/5 p-4 sm:p-5 ${className}`}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 mb-3 pb-1 border-b border-slate-100/80">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}