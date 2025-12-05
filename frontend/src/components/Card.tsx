// src/components/Card.tsx
import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function Card({ title, subtitle, actions, className = "", children }: CardProps) {
  return (
    <section
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 ${className}`}
    >
      {(title || subtitle || actions) && (
        <header className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}